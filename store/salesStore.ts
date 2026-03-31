'use client';
import { create } from 'zustand';
import { Sale, Period } from '@/lib/types';
import { getStorage, setStorage } from '@/lib/seed';

const KEY = 'bc_sales';

function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start: string;
  if (period === 'daily') {
    start = end;
  } else if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    start = d.toISOString().split('T')[0];
  } else {
    // monthly
    start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return { start, end };
}

interface SalesState {
  sales: Sale[];
  load: () => void;
  addSale: (s: Omit<Sale, 'id' | 'createdAt'>) => void;
  updateSale: (id: string, s: Partial<Omit<Sale, 'id' | 'createdAt'>>) => void;
  deleteSale: (id: string) => void;
  getSalesByPeriod: (period: Period) => Sale[];
  getRevenueByPeriod: (period: Period) => number;
  getSalesByStaff: (period: Period) => { staffId: string; staffName: string; count: number; total: number }[];
  getChartData: (period: Period) => { label: string; revenue: number; date: string }[];
  getTodaySales: () => Sale[];
  getThisMonthRevenue: () => number;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],

  load: () => {
    const sales = getStorage<Sale[]>(KEY, []);
    set({ sales });
  },

  addSale: (data) => {
    const newSale: Sale = { ...data, id: 'sale' + Date.now(), createdAt: new Date().toISOString() };
    const updated = [newSale, ...get().sales];
    setStorage(KEY, updated);
    set({ sales: updated });
  },

  deleteSale: (id) => {
    if (!confirm('Bu satışı silmek istediğinize emin misiniz?')) return;
    const updated = get().sales.filter(s => s.id !== id);
    setStorage(KEY, updated);
    set({ sales: updated });
  },

  updateSale: (id, data) => {
    const updated = get().sales.map(s => {
      if (s.id === id) {
        return { ...s, ...data };
      }
      return s;
    });
    setStorage(KEY, updated);
    set({ sales: updated });
  },

  getSalesByPeriod: (period) => {
    const { start, end } = getDateRange(period);
    return get().sales.filter(s => s.date >= start && s.date <= end);
  },

  getRevenueByPeriod: (period) => {
    return get().getSalesByPeriod(period).reduce((sum, s) => sum + s.amount, 0);
  },

  getSalesByStaff: (period) => {
    const map = new Map<string, { staffId: string; staffName: string; count: number; total: number }>();
    get().getSalesByPeriod(period).forEach(s => {
      const cur = map.get(s.staffId) || { staffId: s.staffId, staffName: s.staffName, count: 0, total: 0 };
      map.set(s.staffId, { ...cur, count: cur.count + 1, total: cur.total + s.amount });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  },

  getChartData: (period) => {
    const sales = get().sales;
    if (period === 'daily') {
      // Last 7 days, group by day
      const result: { label: string; revenue: number; date: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
        const revenue = sales.filter(s => s.date === date).reduce((sum, s) => sum + s.amount, 0);
        result.push({ label, revenue, date });
      }
      return result;
    } else if (period === 'weekly') {
      // Last 4 weeks, group by week
      const result: { label: string; revenue: number; date: string }[] = [];
      for (let w = 3; w >= 0; w--) {
        const endD = new Date();
        endD.setDate(endD.getDate() - w * 7);
        const startD = new Date(endD);
        startD.setDate(startD.getDate() - 6);
        const endDate = endD.toISOString().split('T')[0];
        const startDate = startD.toISOString().split('T')[0];
        const label = `${startD.getDate()} ${startD.toLocaleDateString('tr-TR', { month: 'short' })}`;
        const revenue = sales.filter(s => s.date >= startDate && s.date <= endDate).reduce((sum, s) => sum + s.amount, 0);
        result.push({ label, revenue, date: endDate });
      }
      return result;
    } else {
      // Last 6 months
      const result: { label: string; revenue: number; date: string }[] = [];
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      for (let m = 5; m >= 0; m--) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
        const revenue = sales.filter(s => s.date.startsWith(ym)).reduce((sum, s) => sum + s.amount, 0);
        result.push({ label, revenue, date: ym });
      }
      return result;
    }
  },

  getTodaySales: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().sales.filter(s => s.date === today);
  },

  getThisMonthRevenue: () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return get().sales.filter(s => s.date.startsWith(ym)).reduce((sum, s) => sum + s.amount, 0);
  },
}));

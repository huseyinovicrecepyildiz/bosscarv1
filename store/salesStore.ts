import { create } from 'zustand';
import { Sale, Period } from '@/lib/types';
import { pb } from '@/lib/pocketbase';

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
    start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return { start, end };
}

interface SalesState {
  sales: Sale[];
  load: () => Promise<void>;
  addSale: (s: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  updateSale: (id: string, s: Partial<Omit<Sale, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  getSalesByPeriod: (period: Period) => Sale[];
  getRevenueByPeriod: (period: Period) => number;
  getSalesByStaff: (period: Period) => { staffId: string; staffName: string; count: number; total: number }[];
  getChartData: (period: Period) => { label: string; revenue: number; date: string }[];
  getTodaySales: () => Sale[];
  getThisMonthRevenue: () => number;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],

  load: async () => {
    try {
      const records = await pb.collection('sales').getFullList({
        sort: '-date',
      });
      const mapped: Sale[] = records.map(record => ({
        id: record.id,
        plate: record.plate,
        vehicleType: record.vehicleType,
        serviceId: record.serviceId,
        serviceName: record.serviceName,
        amount: record.amount,
        staffId: record.staffId,
        staffName: record.staffName,
        date: record.date,
        note: record.note,
        ppfPanels: Array.isArray(record.ppfPanels) ? record.ppfPanels : [],
        paymentAmount: record.paymentAmount ?? 0,
        paymentStatus: record.paymentStatus || 'ödenmedi',
        createdAt: record.created ?? record.date
      }));
      set({ sales: mapped });
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  },

  addSale: async (data) => {
    try {
      const inserted = await pb.collection('sales').create({
        plate: data.plate,
        vehicleType: data.vehicleType,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        amount: data.amount,
        staffId: data.staffId,
        staffName: data.staffName,
        date: data.date,
        note: data.note,
        ppfPanels: data.ppfPanels ?? [],
        paymentAmount: (data as any).paymentAmount ?? 0,
        paymentStatus: (data as any).paymentStatus ?? 'ödenmedi'
      });

      const newSale: Sale = {
        id: inserted.id,
        plate: inserted.plate,
        vehicleType: inserted.vehicleType,
        serviceId: inserted.serviceId,
        serviceName: inserted.serviceName,
        amount: inserted.amount,
        staffId: inserted.staffId,
        staffName: inserted.staffName,
        date: inserted.date,
        note: inserted.note,
        ppfPanels: Array.isArray(inserted.ppfPanels) ? inserted.ppfPanels : [],
        paymentAmount: inserted.paymentAmount ?? 0,
        paymentStatus: inserted.paymentStatus || 'ödenmedi',
        createdAt: inserted.created ?? inserted.date
      };

      set({ sales: [newSale, ...get().sales] });
    } catch (error) {
      console.error(error);
    }
  },

  deleteSale: async (id) => {
    if (!confirm('Bu satışı silmek istediğinize emin misiniz?')) return;
    const prev = get().sales;
    set({ sales: prev.filter(s => s.id !== id) });

    try {
      await pb.collection('sales').delete(id);
    } catch (error) {
      console.error(error);
      set({ sales: prev });
    }
  },

  updateSale: async (id, data) => {
    const prev = get().sales;
    set({ sales: prev.map(s => s.id === id ? { ...s, ...data } : s) });

    try {
      await pb.collection('sales').update(id, data);
    } catch (error) {
      console.error(error);
      set({ sales: prev });
    }
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
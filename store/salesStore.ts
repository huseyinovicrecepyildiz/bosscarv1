'use client';
import { create } from 'zustand';
import { Sale, Period } from '@/lib/types';
import { supabase } from '@/lib/supabase';

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
    const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error loading sales:', error); return; }
    const mapped: Sale[] = data.map(row => ({
      id: row.id,
      plate: row.plate,
      vehicleType: row.vehicle_type,
      serviceId: row.service_id,
      serviceName: row.service_name,
      amount: row.amount,
      staffId: row.staff_id,
      staffName: row.staff_name,
      date: row.date,
      note: row.note,
      createdAt: row.created_at
    }));
    set({ sales: mapped });
  },

  addSale: async (data) => {
    const { data: inserted, error } = await supabase.from('sales').insert({
      plate: data.plate,
      vehicle_type: data.vehicleType,
      service_id: data.serviceId,
      service_name: data.serviceName,
      amount: data.amount,
      staff_id: data.staffId,
      staff_name: data.staffName,
      date: data.date,
      note: data.note
    }).select().single();
    if (error) { console.error(error); return; }
    
    const newSale: Sale = {
      id: inserted.id,
      plate: inserted.plate,
      vehicleType: inserted.vehicle_type,
      serviceId: inserted.service_id,
      serviceName: inserted.service_name,
      amount: inserted.amount,
      staffId: inserted.staff_id,
      staffName: inserted.staff_name,
      date: inserted.date,
      note: inserted.note,
      createdAt: inserted.created_at
    };
    
    set({ sales: [newSale, ...get().sales] });
  },

  deleteSale: async (id) => {
    if (!confirm('Bu satışı silmek istediğinize emin misiniz?')) return;
    const prev = get().sales;
    set({ sales: prev.filter(s => s.id !== id) });
    
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) {
      console.error(error);
      set({ sales: prev });
    }
  },

  updateSale: async (id, data) => {
    const updates: any = {};
    if (data.plate !== undefined) updates.plate = data.plate;
    if (data.vehicleType !== undefined) updates.vehicle_type = data.vehicleType;
    if (data.serviceId !== undefined) updates.service_id = data.serviceId;
    if (data.serviceName !== undefined) updates.service_name = data.serviceName;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.staffId !== undefined) updates.staff_id = data.staffId;
    if (data.staffName !== undefined) updates.staff_name = data.staffName;
    if (data.date !== undefined) updates.date = data.date;
    if (data.note !== undefined) updates.note = data.note;

    const prev = get().sales;
    set({ sales: prev.map(s => s.id === id ? { ...s, ...data } : s) });

    const { error } = await supabase.from('sales').update(updates).eq('id', id);
    if (error) {
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

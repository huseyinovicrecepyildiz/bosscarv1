import { create } from 'zustand';
import { Expense, Period } from '@/lib/types';
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

interface ExpensesState {
  expenses: Expense[];
  load: () => Promise<void>;
  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByPeriod: (period: Period) => Expense[];
  getTotalByPeriod: (period: Period) => number;
  getChartData: (period: Period) => { label: string; expenses: number; date: string }[];
  getThisMonthTotal: () => number;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],

  load: async () => {
    try {
      const records = await pb.collection('expenses').getFullList();
      const mapped: Expense[] = records.map(record => ({
        id: record.id,
        category: record.category,
        amount: record.amount,
        note: record.note,
        date: record.date ? String(record.date).slice(0, 10) : '',
        createdAt: record.created
      }));
      set({ expenses: mapped });
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      if (typeof window !== 'undefined') {
         try { window.alert("Masraflar yüklenemedi: " + (error?.response?.message || error.message)); } catch(e) {}
      }
    }
  },

  addExpense: async (data) => {
    try {
      const inserted = await pb.collection('expenses').create({
        category: data.category,
        amount: data.amount,
        note: data.note,
        date: data.date
      });
      
      const newExpense: Expense = {
        id: inserted.id,
        category: inserted.category,
        amount: inserted.amount,
        note: inserted.note,
        date: inserted.date,
        createdAt: inserted.created
      };
      
      set({ expenses: [newExpense, ...get().expenses] });
    } catch (error: any) {
      console.error(error);
      if (typeof window !== 'undefined') {
         try { window.alert("Masraf eklenemedi: " + (error?.response?.message || error.message)); } catch(e) {}
      }
    }
  },

  deleteExpense: async (id) => {
    const prev = get().expenses;
    set({ expenses: prev.filter(e => e.id !== id) });
    
    try {
      await pb.collection('expenses').delete(id);
    } catch (error) {
      console.error(error);
      set({ expenses: prev });
    }
  },

  getExpensesByPeriod: (period) => {
    const { start, end } = getDateRange(period);
    return get().expenses.filter(e => e.date >= start && e.date <= end);
  },

  getTotalByPeriod: (period) => {
    return get().getExpensesByPeriod(period).reduce((sum, e) => sum + e.amount, 0);
  },

  getChartData: (period) => {
    const expenses = get().expenses;
    if (period === 'daily') {
      const result: { label: string; expenses: number; date: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
        const total = expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0);
        result.push({ label, expenses: total, date });
      }
      return result;
    } else if (period === 'weekly') {
      const result: { label: string; expenses: number; date: string }[] = [];
      for (let w = 3; w >= 0; w--) {
        const endD = new Date();
        endD.setDate(endD.getDate() - w * 7);
        const startD = new Date(endD);
        startD.setDate(startD.getDate() - 6);
        const endDate = endD.toISOString().split('T')[0];
        const startDate = startD.toISOString().split('T')[0];
        const label = `${startD.getDate()} ${startD.toLocaleDateString('tr-TR', { month: 'short' })}`;
        const total = expenses.filter(e => e.date >= startDate && e.date <= endDate).reduce((sum, e) => sum + e.amount, 0);
        result.push({ label, expenses: total, date: endDate });
      }
      return result;
    } else {
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const result: { label: string; expenses: number; date: string }[] = [];
      for (let m = 5; m >= 0; m--) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
        const total = expenses.filter(e => e.date.startsWith(ym)).reduce((sum, e) => sum + e.amount, 0);
        result.push({ label, expenses: total, date: ym });
      }
      return result;
    }
  },

  getThisMonthTotal: () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return get().expenses.filter(e => e.date.startsWith(ym)).reduce((sum, e) => sum + e.amount, 0);
  },
}));

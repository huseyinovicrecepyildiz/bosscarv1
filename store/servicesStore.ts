'use client';
import { create } from 'zustand';
import { ServiceType, VehiclePrice } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface ServicesState {
  services: ServiceType[];
  load: () => Promise<void>;
  addService: (s: Omit<ServiceType, 'id' | 'createdAt'>) => Promise<void>;
  updateService: (id: string, data: { name?: string; prices?: VehiclePrice[]; isPpf?: boolean; active?: boolean }) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  getActiveServices: () => ServiceType[];
  getPriceForVehicle: (serviceId: string, vehicleType: string) => number | null;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],

  load: async () => {
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    if (error) { console.error('Error loading services:', error); return; }
    const mapped: ServiceType[] = data.map(row => ({
      id: row.id,
      name: row.name,
      prices: row.prices,
      isPpf: row.is_ppf,
      active: row.active,
      createdAt: row.created_at
    }));
    set({ services: mapped });
  },

  addService: async (data) => {
    const { data: inserted, error } = await supabase.from('services').insert({
      name: data.name,
      prices: data.prices,
      is_ppf: data.isPpf,
      active: data.active
    }).select().single();
    if (error) { console.error(error); return; }
    const newService: ServiceType = {
      id: inserted.id,
      name: inserted.name,
      prices: inserted.prices,
      isPpf: inserted.is_ppf,
      active: inserted.active,
      createdAt: inserted.created_at
    };
    set({ services: [...get().services, newService] });
  },

  updateService: async (id, data) => {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.prices !== undefined) updates.prices = data.prices;
    if (data.isPpf !== undefined) updates.is_ppf = data.isPpf;
    if (data.active !== undefined) updates.active = data.active;
    
    // Optimistic UI
    const prev = get().services;
    set({ services: prev.map(s => s.id === id ? { ...s, ...data } : s) });
    
    const { error } = await supabase.from('services').update(updates).eq('id', id);
    if (error) {
      console.error(error);
      set({ services: prev }); // Revert on error
    }
  },

  toggleActive: async (id) => {
    const service = get().services.find(s => s.id === id);
    if (!service) return;
    const newActive = !service.active;
    
    // Optimistic UI
    const prev = get().services;
    set({ services: prev.map(s => s.id === id ? { ...s, active: newActive } : s) });
    
    const { error } = await supabase.from('services').update({ active: newActive }).eq('id', id);
    if (error) {
      console.error(error);
      set({ services: prev });
    }
  },

  deleteService: async (id) => {
    // Optimistic UI
    const prev = get().services;
    set({ services: prev.filter(s => s.id !== id) });
    
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error(error);
      set({ services: prev });
    }
  },

  getActiveServices: () => get().services.filter(s => s.active),

  getPriceForVehicle: (serviceId, vehicleType) => {
    const service = get().services.find(s => s.id === serviceId);
    if (!service) return null;
    const vp = service.prices.find(p => p.vehicleType === vehicleType);
    return vp ? vp.price : null;
  },
}));

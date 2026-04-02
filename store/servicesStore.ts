import { create } from 'zustand';
import { ServiceType, VehiclePrice } from '@/lib/types';
import { pb } from '@/lib/pocketbase';

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
    try {
      const records = await pb.collection('services').getFullList({
        sort: '+created',
      });
      const mapped: ServiceType[] = records.map(record => ({
        id: record.id,
        name: record.name,
        prices: record.prices,
        isPpf: record.isPpf,
        active: record.active,
        createdAt: record.created
      }));
      set({ services: mapped });
    } catch (error) {
      console.error('Error loading services:', error);
    }
  },

  addService: async (data) => {
    try {
      const inserted = await pb.collection('services').create({
        name: data.name,
        prices: data.prices,
        isPpf: data.isPpf,
        active: data.active
      });
      const newService: ServiceType = {
        id: inserted.id,
        name: inserted.name,
        prices: inserted.prices,
        isPpf: inserted.isPpf,
        active: inserted.active,
        createdAt: inserted.created
      };
      set({ services: [...get().services, newService] });
    } catch (error) {
      console.error(error);
    }
  },

  updateService: async (id, data) => {
    // Optimistic UI
    const prev = get().services;
    set({ services: prev.map(s => s.id === id ? { ...s, ...data } : s) });
    
    try {
      await pb.collection('services').update(id, data);
    } catch (error) {
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
    
    try {
      await pb.collection('services').update(id, { active: newActive });
    } catch (error) {
      console.error(error);
      set({ services: prev });
    }
  },

  deleteService: async (id) => {
    // Optimistic UI
    const prev = get().services;
    set({ services: prev.filter(s => s.id !== id) });
    
    try {
      await pb.collection('services').delete(id);
    } catch (error) {
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

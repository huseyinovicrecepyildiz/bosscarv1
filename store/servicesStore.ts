'use client';
import { create } from 'zustand';
import { ServiceType, VehiclePrice } from '@/lib/types';
import { getStorage, setStorage } from '@/lib/seed';

const KEY = 'bc_services';

interface ServicesState {
  services: ServiceType[];
  load: () => void;
  addService: (s: Omit<ServiceType, 'id' | 'createdAt'>) => void;
  updateService: (id: string, data: { name?: string; prices?: VehiclePrice[]; isPpf?: boolean; active?: boolean }) => void;
  toggleActive: (id: string) => void;
  deleteService: (id: string) => void;
  getActiveServices: () => ServiceType[];
  getPriceForVehicle: (serviceId: string, vehicleType: string) => number | null;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],

  load: () => {
    const services = getStorage<ServiceType[]>(KEY, []);
    set({ services });
  },

  addService: (data) => {
    const newService: ServiceType = { ...data, id: 'srv' + Date.now(), createdAt: new Date().toISOString() };
    const updated = [...get().services, newService];
    setStorage(KEY, updated);
    set({ services: updated });
  },

  updateService: (id, data) => {
    const updated = get().services.map(s => s.id === id ? { ...s, ...data } : s);
    setStorage(KEY, updated);
    set({ services: updated });
  },

  toggleActive: (id) => {
    const updated = get().services.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setStorage(KEY, updated);
    set({ services: updated });
  },

  deleteService: (id) => {
    const updated = get().services.filter(s => s.id !== id);
    setStorage(KEY, updated);
    set({ services: updated });
  },

  getActiveServices: () => get().services.filter(s => s.active),

  getPriceForVehicle: (serviceId, vehicleType) => {
    const service = get().services.find(s => s.id === serviceId);
    if (!service) return null;
    const vp = service.prices.find(p => p.vehicleType === vehicleType);
    return vp ? vp.price : null;
  },
}));

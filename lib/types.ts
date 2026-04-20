// Types
export type Role = 'admin' | 'yetkili' | 'personel';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  createdAt: string;
}

export interface VehiclePrice {
  vehicleType: string;
  price: number;
}

export interface ServiceType {
  id: string;
  name: string;
  prices: VehiclePrice[];   // per-vehicle pricing
  isPpf?: boolean;          // PPF: price must be entered manually per sale
  active: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  plate: string;
  vehicleType: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  staffId: string;
  staffName: string;
  date: string;
  note?: string;            // optional sale note
  ppfPanels?: string[];     // panel id list for PPF coatings (only filled for PPF sales)
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'Fatura' | 'Maaş' | 'Kira' | 'Malzeme' | 'Diğer';
  amount: number;
  note: string;
  date: string;
  createdAt: string;
}

export type Period = 'daily' | 'weekly' | 'monthly';

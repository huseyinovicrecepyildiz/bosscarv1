import { User, ServiceType, Sale, Expense } from './types';

const SEED_USERS: User[] = [
  { id: 'admin', name: 'Admin Kullanıcı', email: 'admin@bosscar.com', role: 'admin', password: 'admin123', createdAt: '2024-01-01T08:00:00Z' },
  { id: 'yetkili', name: 'Ahmet Yıldız', email: 'yetkili@bosscar.com', role: 'yetkili', password: 'yetki123', createdAt: '2024-01-15T08:00:00Z' },
  { id: 'personel', name: 'Mehmet Demir', email: 'personel@bosscar.com', role: 'personel', password: 'pers123', createdAt: '2024-02-01T08:00:00Z' },
  { id: 'ali', name: 'Ali Kaya', email: 'ali@bosscar.com', role: 'personel', password: 'ali123', createdAt: '2024-02-10T08:00:00Z' },
];

const SEED_SERVICES: ServiceType[] = [
  {
    id: 's1', name: 'Dış Yıkama', active: true, createdAt: '2024-01-01T00:00:00Z',
    prices: [
      { vehicleType: 'Sedan', price: 150 },
      { vehicleType: 'SUV', price: 200 },
      { vehicleType: 'Pickup', price: 180 },
      { vehicleType: 'Van', price: 220 },
      { vehicleType: 'Minibüs', price: 280 },
      { vehicleType: 'Motosiklet', price: 80 },
    ],
  },
  {
    id: 's2', name: 'İç Dış Temizlik', active: true, createdAt: '2024-01-01T00:00:00Z',
    prices: [
      { vehicleType: 'Sedan', price: 280 },
      { vehicleType: 'SUV', price: 380 },
      { vehicleType: 'Pickup', price: 340 },
      { vehicleType: 'Van', price: 420 },
      { vehicleType: 'Minibüs', price: 500 },
      { vehicleType: 'Motosiklet', price: 150 },
    ],
  },
  {
    id: 's3', name: 'Buharlı Temizlik', active: true, createdAt: '2024-01-01T00:00:00Z',
    prices: [
      { vehicleType: 'Sedan', price: 450 },
      { vehicleType: 'SUV', price: 600 },
      { vehicleType: 'Pickup', price: 550 },
      { vehicleType: 'Van', price: 700 },
      { vehicleType: 'Minibüs', price: 850 },
    ],
  },
  {
    id: 's4', name: 'Detaylı Temizlik', active: true, createdAt: '2024-01-01T00:00:00Z',
    prices: [
      { vehicleType: 'Sedan', price: 650 },
      { vehicleType: 'SUV', price: 850 },
      { vehicleType: 'Pickup', price: 750 },
      { vehicleType: 'Van', price: 950 },
    ],
  },
  {
    id: 's5', name: 'Polisaj', active: false, createdAt: '2024-01-01T00:00:00Z',
    prices: [
      { vehicleType: 'Sedan', price: 800 },
      { vehicleType: 'SUV', price: 1100 },
    ],
  },
];

const VEHICLE_TYPES_SEED = ['Sedan', 'SUV', 'Pickup', 'Van', 'Minibüs', 'Motosiklet'];

function generateSales(): Sale[] {
  const sales: Sale[] = [];
  const now = new Date();
  const staffPool = [
    { id: 'yetkili', name: 'Ahmet Yıldız' },
    { id: 'personel', name: 'Mehmet Demir' },
    { id: 'ali', name: 'Ali Kaya' },
  ];
  const plates = ['34ABC123', '06XYZ456', '35DEF789', '41GHI012', '16JKL345', '07MNO678', '01PQR901', '42STU234'];
  const activeServices = SEED_SERVICES.filter(s => s.active);

  for (let d = 59; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const count = Math.floor(Math.random() * 6) + 2;
    for (let i = 0; i < count; i++) {
      const service = activeServices[Math.floor(Math.random() * activeServices.length)];
      const staff = staffPool[Math.floor(Math.random() * staffPool.length)];
      const plate = plates[Math.floor(Math.random() * plates.length)];
      // Pick a vehicle type that exists in the service's prices
      const vp = service.prices[Math.floor(Math.random() * service.prices.length)];
      sales.push({
        id: `sale-${d}-${i}`,
        plate,
        vehicleType: vp.vehicleType,
        serviceId: service.id,
        serviceName: service.name,
        amount: vp.price,
        staffId: staff.id,
        staffName: staff.name,
        date: date.toISOString().split('T')[0],
        createdAt: date.toISOString(),
      });
    }
  }
  return sales;
}

function generateExpenses(): Expense[] {
  const expenses: Expense[] = [];
  const now = new Date();
  const categories: Expense['category'][] = ['Fatura', 'Maaş', 'Kira', 'Malzeme'];
  const notes = ['Elektrik faturası', 'Su faturası', 'Aylık maaş ödemesi', 'Kira ödemesi', 'Deterjan alımı', 'Wax malzemesi'];

  for (let d = 59; d >= 0; d -= 4) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const cat = categories[Math.floor(Math.random() * categories.length)];
    expenses.push({
      id: `exp-${d}`,
      category: cat,
      amount: Math.floor(Math.random() * 6000) + 500,
      note: notes[Math.floor(Math.random() * notes.length)],
      date: date.toISOString().split('T')[0],
      createdAt: date.toISOString(),
    });
  }
  return expenses;
}

export const SEED_DATA = {
  users: SEED_USERS,
  services: SEED_SERVICES,
  sales: generateSales(),
  expenses: generateExpenses(),
};

export function initializeStorage() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('bc_users'))    localStorage.setItem('bc_users',    JSON.stringify(SEED_DATA.users));
  if (!localStorage.getItem('bc_services')) localStorage.setItem('bc_services', JSON.stringify(SEED_DATA.services));
  if (!localStorage.getItem('bc_sales'))    localStorage.setItem('bc_sales',    JSON.stringify(SEED_DATA.sales));
  if (!localStorage.getItem('bc_expenses')) localStorage.setItem('bc_expenses', JSON.stringify(SEED_DATA.expenses));
}

export function resetStorage() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bc_users',    JSON.stringify(SEED_DATA.users));
  localStorage.setItem('bc_services', JSON.stringify(SEED_DATA.services));
  localStorage.setItem('bc_sales',    JSON.stringify(SEED_DATA.sales));
  localStorage.setItem('bc_expenses', JSON.stringify(SEED_DATA.expenses));
}

export function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

export function setStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Storage error for ${key}:`, err);
  }
}

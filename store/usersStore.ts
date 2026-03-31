'use client';
import { create } from 'zustand';
import { User, Role } from '@/lib/types';
import { getStorage, setStorage } from '@/lib/seed';

const KEY = 'bc_users';

interface UsersState {
  users: User[];
  load: () => void;
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateUser: (id: string, data: Partial<Pick<User, 'name' | 'email' | 'role'>>) => void;
  deleteUser: (id: string) => void;
  resetPassword: (id: string, newPassword: string) => void;
  setRole: (id: string, role: Role) => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],

  load: () => {
    const users = getStorage<User[]>(KEY, []);
    set({ users });
  },

  addUser: (data) => {
    const users = get().users;
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Bu Kullanıcı ID zaten kullanımda.' };
    }
    const newUser: User = {
      ...data,
      id: 'u' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    setStorage(KEY, updated);
    set({ users: updated });
    return { success: true };
  },

  updateUser: (id, data) => {
    const updated = get().users.map(u => u.id === id ? { ...u, ...data } : u);
    setStorage(KEY, updated);
    set({ users: updated });
  },

  deleteUser: (id) => {
    const updated = get().users.filter(u => u.id !== id);
    setStorage(KEY, updated);
    set({ users: updated });
  },

  resetPassword: (id, newPassword) => {
    const updated = get().users.map(u => u.id === id ? { ...u, password: newPassword } : u);
    setStorage(KEY, updated);
    set({ users: updated });
  },

  setRole: (id, role) => {
    const updated = get().users.map(u => u.id === id ? { ...u, role } : u);
    setStorage(KEY, updated);
    set({ users: updated });
  },
}));

'use client';
import { create } from 'zustand';
import { User, Role } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { updateTokenPayload, getAuthUser } from '@/lib/auth';

interface UsersState {
  users: User[];
  load: () => Promise<void>;
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, data: Partial<Pick<User, 'name' | 'email' | 'role'>>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetPassword: (id: string, newPassword: string) => Promise<void>;
  setRole: (id: string, role: Role) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],

  load: async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    if (error) { console.error('Error loading users:', error); return; }
    const mapped: User[] = data.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as Role,
      password: row.password,
      createdAt: row.created_at
    }));
    set({ users: mapped });
  },

  addUser: async (data) => {
    const users = get().users;
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Bu Kullanıcı ID zaten kullanımda.' };
    }
    
    // Server-side unique constraint check is also done by Postgres, but we checked client side first
    const { data: inserted, error } = await supabase.from('users').insert({
      name: data.name,
      email: data.email,
      role: data.role,
      password: data.password
    }).select().single();
    
    if (error) { 
      return { success: false, error: 'Veritabanına kaydedilirken hata oluştu.' }; 
    }
    
    const newUser: User = {
      id: inserted.id,
      name: inserted.name,
      email: inserted.email,
      role: inserted.role as Role,
      password: inserted.password,
      createdAt: inserted.created_at
    };
    
    set({ users: [...users, newUser] });
    return { success: true };
  },

  updateUser: async (id, data) => {
    const prev = get().users;
    set({ users: prev.map(u => u.id === id ? { ...u, ...data } : u) });
    
    const currentUser = getAuthUser();
    if (currentUser?.userId === id) {
      const payloadUpdate: any = {};
      if (data.name) payloadUpdate.name = data.name;
      if (data.email) payloadUpdate.email = data.email;
      if (data.role) payloadUpdate.role = data.role;
      updateTokenPayload(payloadUpdate);
    }
    
    const { error } = await supabase.from('users').update(data).eq('id', id);
    if (error) {
      console.error(error);
      set({ users: prev }); // Revert
    }
  },

  deleteUser: async (id) => {
    const prev = get().users;
    set({ users: prev.filter(u => u.id !== id) });
    
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error(error);
      set({ users: prev });
    }
  },

  resetPassword: async (id, newPassword) => {
    const prev = get().users;
    set({ users: prev.map(u => u.id === id ? { ...u, password: newPassword } : u) });
    
    const { error } = await supabase.from('users').update({ password: newPassword }).eq('id', id);
    if (error) {
      console.error(error);
      set({ users: prev });
    }
  },

  setRole: async (id, role) => {
    const prev = get().users;
    set({ users: prev.map(u => u.id === id ? { ...u, role } : u) });
    
    const currentUser = getAuthUser();
    if (currentUser?.userId === id) {
      updateTokenPayload({ role });
    }

    const { error } = await supabase.from('users').update({ role }).eq('id', id);
    if (error) {
      console.error(error);
      set({ users: prev });
    }
  },
}));

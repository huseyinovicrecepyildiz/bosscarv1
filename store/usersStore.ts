import { create } from 'zustand';
import { User, Role } from '@/lib/types';
import { pb } from '@/lib/pocketbase';
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
    try {
      const records = await pb.collection('users').getFullList({
        sort: '+created',
      });
      const mapped: User[] = records.map(record => ({
        id: record.id,
        name: record.name,
        email: record.email || record.username,
        role: record.role as Role,
        password: record.password_plain || '********', // Use custom field if present, or mask
        createdAt: record.created
      }));
      set({ users: mapped });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  },

  addUser: async (data) => {
    const users = get().users;
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Bu Kullanıcı ID zaten kullanımda.' };
    }
    
    try {
      // In PocketBase 'users' collection:
      const inserted = await pb.collection('users').create({
        username: data.email.split('@')[0], // Use email part as username
        email: data.email.includes('@') ? data.email : `${data.email}@bosscar.local`,
        name: data.name,
        role: data.role,
        password: data.password,
        passwordConfirm: data.password,
        password_plain: data.password, // Store plain for UI if required by existing logic
        emailVisibility: true
      });
      
      const newUser: User = {
        id: inserted.id,
        name: inserted.name,
        email: inserted.email || inserted.username,
        role: inserted.role as Role,
        password: data.password,
        createdAt: inserted.created
      };
      
      set({ users: [...users, newUser] });
      return { success: true };
    } catch (error: any) {
      console.error(error);
      return { success: false, error: error.message || 'Kullanıcı oluşturulurken hata oluştu.' };
    }
  },

  updateUser: async (id, data) => {
    const prev = get().users;
    set({ users: prev.map(u => u.id === id ? { ...u, ...data } : u) });
    
    const currentUser = getAuthUser();
    if (currentUser?.userId === id) {
      updateTokenPayload(data);
    }
    
    try {
      await pb.collection('users').update(id, data);
    } catch (error) {
      console.error(error);
      set({ users: prev }); // Revert
    }
  },

  deleteUser: async (id) => {
    const prev = get().users;
    set({ users: prev.filter(u => u.id !== id) });
    
    try {
      await pb.collection('users').delete(id);
    } catch (error) {
      console.error(error);
      set({ users: prev });
    }
  },

  resetPassword: async (id, newPassword) => {
    const prev = get().users;
    set({ users: prev.map(u => u.id === id ? { ...u, password: newPassword } : u) });
    
    try {
      await pb.collection('users').update(id, {
        password: newPassword,
        passwordConfirm: newPassword,
        password_plain: newPassword
      });
    } catch (error) {
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

    try {
      await pb.collection('users').update(id, { role });
    } catch (error) {
      console.error(error);
      set({ users: prev });
    }
  },
}));

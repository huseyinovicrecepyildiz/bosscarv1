'use client';
import { create } from 'zustand';
import { AuthPayload, getAuthUser, login, logout } from '@/lib/auth';

interface AuthState {
  user: AuthPayload | null;
  initialized: boolean;
  login: (loginId: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  init: () => void;
  refresh: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  init: () => {
    const user = getAuthUser();
    set({ user, initialized: true });
  },

  refresh: () => {
    const user = getAuthUser();
    set({ user });
  },

  login: (loginId, password) => {
    const result = login(loginId, password);
    if (result.success && result.user) {
      set({ user: result.user });
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  logout: () => {
    logout();
    set({ user: null });
  },
}));

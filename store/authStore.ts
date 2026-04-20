import { create } from 'zustand';
import { login as loginApi, logout as logoutApi, getAuthUser } from '@/lib/auth';

interface AuthState {
  user: any;
  initialized: boolean;
  init: () => void;
  refresh: () => void;
  login: (id: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void; 
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  
  init: () => {
    try {
      // Safari burada hata fırlatsa bile uygulama çökmeyecek
      const user = getAuthUser();
      set({ user, initialized: true });
    } catch (error) {
      console.warn("Safari/Storage erişim engeli yakalandı:", error);
      // Hata olsa bile initialized: true diyoruz ki sonsuz döngüden çıkıp Login'e atabilsin
      set({ user: null, initialized: true });
    }
  },
  
  refresh: () => {
    try {
      const user = getAuthUser();
      set({ user });
    } catch (error) {
      set({ user: null });
    }
  },
  
  login: async (id, pass) => {
    try {
      const result = await loginApi(id, pass);
      if (result.success && result.user) {
        set({ user: result.user, initialized: true });
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Giriş sırasında bir hata oluştu.' };
    }
  },
  
  logout: () => { 
    try {
      logoutApi();
    } catch (error) {
      console.warn("Logout sırasında storage hatası:", error);
    }
    set({ user: null });
    window.location.href = '/login';
  }
}));
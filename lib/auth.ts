import { pb } from './pocketbase';

export const login = async (loginId: string, pass: string) => {
  try {
    const identifier = loginId.trim().includes('@') ? loginId.trim() : `${loginId.trim()}@bosscar.local`;
    const authData = await pb.collection('users').authWithPassword(identifier, pass);

    // Cookie zırhı
    try {
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, secure: false, path: '/' });
    } catch (e) {
      console.warn("Safari cookie engeli aşıldı");
    }

    const payload = {
      userId: authData.record.id,
      email: authData.record.email,
      name: authData.record.name,
      role: authData.record.role ? String(authData.record.role).toLowerCase() : 'personel',
      exp: Date.now() + 86400000
    };

    const jsonStr = JSON.stringify(payload);
    const safeBase64 = btoa(encodeURIComponent(jsonStr));
    
    // LocalStorage zırhı
    try {
      localStorage.setItem('bc_token', safeBase64);
    } catch(e) {
      console.warn("Safari localStorage engeli aşıldı");
    }
    
    return { success: true, user: payload };
  } catch (err: any) {
    return { success: false, error: "Hatalı Giriş!" };
  }
};

/**
 * 🚨 SIDEBAR HATASINI ÇÖZEN FONKSİYON
 */
export const logout = () => {
  if (typeof window === 'undefined') return;
  try {
    pb.authStore.clear();
    document.cookie = "pb_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    localStorage.removeItem('bc_token');
  } catch (e) {}
};

export const getAuthUser = () => {
  if (typeof window === 'undefined') return null;
  
  // 🚨 İŞTE SAFARİ'Yİ ÇÖKERTEN YER BURASIYDI! Tamamen try-catch İÇİNE aldık.
  try {
    const token = localStorage.getItem('bc_token');
    if (!token) return null;
    
    const decodedStr = decodeURIComponent(atob(token));
    const payload = JSON.parse(decodedStr);
    
    if (payload.exp > Date.now()) {
      if (payload.role) payload.role = String(payload.role).toLowerCase();
      return payload;
    }
    
    localStorage.removeItem('bc_token');
    return null;
  } catch (err) { 
    return null; 
  }
};

export const updateTokenPayload = (newData: any) => {
  if (typeof window === 'undefined') return;
  try {
    const currentUser = getAuthUser();
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...newData };
    const safeBase64 = btoa(encodeURIComponent(JSON.stringify(updatedUser)));
    localStorage.setItem('bc_token', safeBase64);
  } catch (e) {}
};
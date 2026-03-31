import { User, Role } from './types';
import { getStorage, setStorage } from './seed';

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  exp: number;
}

// UTF-8 safe base64 encode/decode for Turkish characters
function encodeToken(payload: AuthPayload): string {
  const json = JSON.stringify(payload);
  const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8);
}

function decodeToken(token: string): AuthPayload {
  const decoded = atob(token);
  const utf8 = decodeURIComponent(
    decoded.split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
  return JSON.parse(utf8) as AuthPayload;
}

export function login(loginId: string, password: string): { success: boolean; error?: string; user?: AuthPayload } {
  const users: User[] = getStorage('bc_users', []);
  const found = users.find(u => 
    (u.id.toLowerCase() === loginId.toLowerCase() || u.email.toLowerCase() === loginId.toLowerCase()) 
    && u.password === password
  );
  if (!found) return { success: false, error: 'Kullanıcı ID veya şifre hatalı.' };

  const payload: AuthPayload = {
    userId: found.id,
    email: found.email,
    name: found.name,
    role: found.role,
    exp: Date.now() + 1000 * 60 * 60 * 24, // 24h
  };

  const token = encodeToken(payload);
  localStorage.setItem('bc_token', token);
  return { success: true, user: payload };
}

export function logout() {
  localStorage.removeItem('bc_token');
}

export function getAuthUser(): AuthPayload | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('bc_token');
  if (!token) return null;
  try {
    const payload = decodeToken(token);
    if (payload.exp < Date.now()) { logout(); return null; }
    // Sync role from users store (in case role was updated)
    const users: User[] = getStorage('bc_users', []);
    const user = users.find(u => u.id === payload.userId);
    if (!user) { logout(); return null; }
    return { ...payload, role: user.role, name: user.name };
  } catch {
    logout();
    return null;
  }
}

export function canAccess(role: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(role);
}

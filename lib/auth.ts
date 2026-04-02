import { Role } from './types';
import { pb } from './pocketbase';

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

export async function login(loginId: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthPayload }> {
  try {
    // PocketBase can sign in with email or username
    const authData = await pb.collection('users').authWithPassword(loginId, password);
    const { record } = authData;

    const payload: AuthPayload = {
      userId: record.id,
      email: record.email || record.username,
      name: record.name,
      role: record.role as Role,
      exp: Date.now() + 1000 * 60 * 60 * 24, // 24h
    };

    const token = encodeToken(payload);
    localStorage.setItem('bc_token', token);
    return { success: true, user: payload };
  } catch (err: any) {
    return { success: false, error: 'Kullanıcı ID veya şifre hatalı.' };
  }
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bc_token');
    pb.authStore.clear(); // Also clear PocketBase auth store
  }
}

export function getAuthUser(): AuthPayload | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('bc_token');
  if (!token) return null;
  try {
    const payload = decodeToken(token);
    if (payload.exp < Date.now()) { logout(); return null; }
    return payload;
  } catch {
    logout();
    return null;
  }
}

// Allows updating the JWT payload synchronously without querying db
export function updateTokenPayload(partial: Partial<AuthPayload>) {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('bc_token');
  if (!token) return;
  try {
    const payload = decodeToken(token);
    const newPayload = { ...payload, ...partial };
    localStorage.setItem('bc_token', encodeToken(newPayload));
  } catch {}
}

export function canAccess(role: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(role);
}

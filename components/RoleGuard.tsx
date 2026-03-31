'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/lib/types';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, initialized } = useAuthStore();
  const router = useRouter();

  if (!initialized) return null;

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="animate-fade-in" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', textAlign: 'center', padding: '2rem',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '1.25rem',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', marginBottom: '1.5rem',
        }}>
          🚫
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171', marginBottom: '0.75rem' }}>
          Erişim Engellendi
        </h2>
        <p style={{ color: '#64748b', maxWidth: 400, lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Bu sayfaya erişmek için yeterli yetkiniz bulunmamaktadır.
          {user ? ` "${user.role}" rolüyle bu alana giremezsiniz.` : ' Lütfen giriş yapınız.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => router.back()}>← Geri Dön</button>
          <button className="btn-primary" onClick={() => router.push('/sales')}>Ana Sayfaya Git</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

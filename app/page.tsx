'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { initializeStorage } from '@/lib/seed';

export default function HomePage() {
  const router = useRouter();
  const { user, init, initialized } = useAuthStore();

  useEffect(() => {
    initializeStorage();
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, initialized, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#020617' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '3px solid #f59e0b', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Yükleniyor...</p>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

import './globals.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, init, initialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname(); // 🚨 Sayfa kontrolü için ekledik

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    // Eğer login sayfasındaysak veya kullanıcı varsa yönlendirme yapma
    if (initialized && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, initialized, router, pathname]);

  const renderContent = () => {
    // Yükleme ekranı
    if (!initialized) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #f59e0b', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // 🚨 LOGIN SAYFASINDAYSAK: Sidebar'sız düz içeriği göster (Takılmayı çözer)
    if (pathname === '/login') {
      return <>{children}</>;
    }

    // Kullanıcı yoksa ve login değilsek boş dön (yönlendirmeyi bekle)
    if (!user) return null;

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#020617' }}>
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </div>
    );
  };

  return (
    <html lang="tr">
      <body>
        {renderContent()}
      </body>
    </html>
  );
}
'use client';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/sales': 'Hizmet Satışı',
  '/services': 'Hizmet Yönetimi',
  '/expenses': 'Gider Yönetimi',
  '/users': 'Kullanıcı Yönetimi',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const title = PAGE_TITLES[pathname] || 'Boss Car ERP';
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header style={{
      height: 64, display: 'flex', alignItems: 'center',
      padding: '0 1.25rem', gap: '1rem',
      background: 'rgba(15, 23, 42, 0.9)',
      borderBottom: '1px solid rgba(71,85,105,0.2)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Hamburger (mobile) */}
      <button
        id="header-menu-btn"
        className="mobile-menu-btn btn-ghost"
        onClick={onMenuClick}
        aria-label="Menüyü aç"
        style={{ display: 'none', fontSize: '1.25rem' }}
      >
        ☰
      </button>

      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{title}</h2>
        <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: 2, display: 'none' }} className="date-display">{dateStr}</p>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Date display (desktop) */}
        <div style={{ display: 'none', flexDirection: 'column', alignItems: 'flex-end' }} className="desktop-date">
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{dateStr}</p>
        </div>

        {/* Role badge */}
        {user && (
          <span className={`badge badge-${user.role}`}>
            {user.role === 'admin' ? '👑' : user.role === 'yetkili' ? '🔑' : '👤'} {user.role}
          </span>
        )}

        {/* Avatar */}
        {user && (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#020617', fontSize: '0.875rem',
            border: '2px solid rgba(245,158,11,0.3)',
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .mobile-menu-btn { display: flex !important; }
          .date-display { display: block !important; }
        }
        @media (min-width: 1024px) {
          .desktop-date { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

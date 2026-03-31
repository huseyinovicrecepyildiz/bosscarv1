'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
  id: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin'], id: 'nav-dashboard' },
  { href: '/sales', label: 'Hizmet Satışı', icon: '💰', roles: ['admin', 'yetkili', 'personel'], id: 'nav-sales' },
  { href: '/services', label: 'Hizmet Yönetimi', icon: '⚙️', roles: ['admin', 'yetkili'], id: 'nav-services' },
  { href: '/expenses', label: 'Gider Yönetimi', icon: '📋', roles: ['admin'], id: 'nav-expenses' },
  { href: '/users', label: 'Kullanıcılar', icon: '👥', roles: ['admin'], id: 'nav-users' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const filteredNav = NAV_ITEMS.filter(item => user && item.roles.includes(user.role));

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem 0.875rem' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.25rem', marginBottom: '2rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '0.625rem',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
        }}>🚗</div>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>
            Boss <span className="gradient-text">Car</span>
          </h1>
          <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: 2 }}>ERP Sistemi</p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <p style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          Menü
        </p>
        {filteredNav.map(item => (
          <button
            key={item.href}
            id={item.id}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
            onClick={() => navigate(item.href)}
          >
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ borderTop: '1px solid rgba(71,85,105,0.2)', paddingTop: '1rem', marginTop: '1rem' }}>
        {user && (
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15,23,42,0.6)', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', fontWeight: 700, color: '#020617', flexShrink: 0,
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <span className={`badge badge-${user.role}`}>{user.role}</span>
              </div>
            </div>
          </div>
        )}
        <button id="btn-logout" className="sidebar-link" onClick={handleLogout} style={{ color: '#f87171', width: '100%' }}>
          <span>🚪</span>
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'rgba(15, 23, 42, 0.95)',
        borderRight: '1px solid rgba(71,85,105,0.2)',
        height: '100vh', position: 'sticky', top: 0,
        display: 'none',
      }} className="sidebar-desktop">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.8)',
            backdropFilter: 'blur(4px)', zIndex: 40,
          }}
        />
      )}

      {/* Mobile sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 260, zIndex: 50,
        background: 'rgba(15, 23, 42, 0.98)',
        borderRight: '1px solid rgba(71,85,105,0.3)',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'block',
      }} className="sidebar-mobile">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1rem 0' }}>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '1.25rem' }}>✕</button>
        </div>
        {sidebarContent}
      </aside>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-desktop { display: block !important; }
          .sidebar-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}

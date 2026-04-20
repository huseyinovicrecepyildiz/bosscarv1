'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const { login, user, init } = useAuthStore();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sayfa yüklendiğinde mevcut oturumu kontrol et
  useEffect(() => {
    init();
  }, [init]);

  // Eğer kullanıcı zaten giriş yapmışsa direkt yönlendir
  useEffect(() => {
    if (user) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // login fonksiyonu lib/auth.ts içindeki suffix mantığını kullanır
    const res = await login(id, pw);

    if (res.success) {
      // 🚨 İŞTE KRİTİK DEĞİŞİKLİK BURASI:
      // Next.js router yerine tarayıcıyı zorla yönlendiriyoruz.
      // Bu komut sayfayı tamamen tazelediği için buton "takılı" kalamaz.
      window.location.href = '/dashboard';
    } else {
      setLoading(false);
      setError(res.error || "Giriş başarısız. Bilgileri kontrol edin.");
    }
  };

  return (
    <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ background: '#0f172a', padding: '2.5rem', borderRadius: '1rem', width: '380px', border: '1px solid #1e293b', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'white', fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>Boss Car</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Araç Temizlik Yönetim Sistemi</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Kullanıcı ID</label>
          <input 
            type="text" 
            placeholder="admin" 
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Şifre</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '1rem', 
            background: loading ? '#92400e' : '#f59e0b', 
            color: '#020617', 
            border: 'none', 
            borderRadius: '0.5rem', 
            fontWeight: 'bold', 
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}
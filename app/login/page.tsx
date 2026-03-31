'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { validateLoginId, validatePassword } from '@/lib/validators';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, init } = useAuthStore();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ loginId?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const idErr = validateLoginId(loginId);
    const passErr = validatePassword(password);
    if (idErr) errs.loginId = idErr;
    if (passErr) errs.password = passErr;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    // Small delay for UX
    await new Promise(r => setTimeout(r, 400));
    const result = await login(loginId, password);

    if (result.success) {
      // Keep loading=true, useEffect will redirect when user state updates
      router.replace('/dashboard');
    } else {
      setLoading(false);
      setErrors({ general: result.error });
    }
  };



  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%', width: 300, height: 300,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: '1rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            marginBottom: '1rem', boxShadow: '0 8px 32px rgba(245,158,11,0.3)',
            fontSize: '2rem',
          }}>
            🚗
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
            Boss <span className="gradient-text">Car</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.375rem' }}>
            Araç Temizlik Yönetim Sistemi
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ borderRadius: '1rem', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1.5rem' }}>
            Sisteme Giriş
          </h2>

          {errors.general && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem',
              color: '#f87171', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ⚠️ {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Kullanıcı ID</label>
              <input
                id="login-id"
                type="text"
                className="input-base"
                placeholder="Örn: admin"
                value={loginId}
                onChange={e => { setLoginId(e.target.value); setErrors(p => ({ ...p, loginId: undefined })); }}
                autoComplete="username"
              />
              {errors.loginId && <p className="error-text">{errors.loginId}</p>}
            </div>

            <div>
              <label className="label">Şifre</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <button id="login-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(2,6,23,0.3)', borderTopColor: '#020617', animation: 'spin 0.7s linear infinite' }} />
                  Giriş yapılıyor...
                </>
              ) : 'Giriş Yap'}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}

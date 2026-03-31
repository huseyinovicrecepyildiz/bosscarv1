'use client';
import { useState, useEffect } from 'react';
import { useUsersStore } from '@/store/usersStore';
import { useAuthStore } from '@/store/authStore';
import { validateLoginId, validateName, validatePassword } from '@/lib/validators';
import { User, Role } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';
import { formatDate } from '@/lib/validators';

const ROLES: { value: Role; label: string; badge: string }[] = [
  { value: 'admin', label: '👑 Admin', badge: 'badge-admin' },
  { value: 'yetkili', label: '🔑 Yetkili', badge: 'badge-yetkili' },
  { value: 'personel', label: '👤 Personel', badge: 'badge-personel' },
];

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <UsersContent />
    </RoleGuard>
  );
}

// --- User Modal ---
interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSave: (data: { name: string; email: string; role: Role; password?: string }) => { success: boolean; error?: string };
}

function UserModal({ user, onClose, onSave }: UserModalProps) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState<Role>(user?.role || 'personel');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const nameErr = validateName(name);
    const emailErr = validateLoginId(email);
    if (nameErr) errs.name = nameErr;
    if (emailErr) errs.email = emailErr;
    if (!user) {
      const passErr = validatePassword(password);
      if (passErr) errs.password = passErr;
    } else if (password && password.length > 0) {
      const passErr = validatePassword(password);
      if (passErr) errs.password = passErr;
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const result = onSave({ name: name.trim(), email: email.trim().toLowerCase(), role, ...(password ? { password } : {}) });
    if (!result.success) { setErrors({ general: result.error }); return; }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card animate-fade-in-up" style={{ maxWidth: 440, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
            {user ? '✏️ Kullanıcı Düzenle' : '➕ Yeni Kullanıcı'}
          </h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        {errors.general && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '0.625rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.8rem' }}>
            ⚠️ {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label className="label">Ad Soyad *</label>
            <input id="user-name" type="text" className="input-base" placeholder="Ahmet Yılmaz" value={name} onChange={e => setName(e.target.value)} />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Kullanıcı ID *</label>
            <input id="user-email" type="text" className="input-base" placeholder="Örn: ahmet123" value={email} onChange={e => setEmail(e.target.value)} />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Rol *</label>
            <select id="user-role" className="input-base" value={role} onChange={e => setRole(e.target.value as Role)}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{user ? 'Yeni Şifre (boş bırakılırsa değişmez)' : 'Şifre *'}</label>
            <input id="user-password" type="password" className="input-base" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>İptal</button>
            <button id="user-save" type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {user ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Password Reset Modal ---
interface PasswordModalProps {
  user: User;
  onClose: () => void;
  onReset: (password: string) => void;
}

function PasswordResetModal({ user, onClose, onReset }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); return; }
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    onReset(password);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card animate-fade-in-up" style={{ maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>🔑 Şifre Sıfırla</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          <strong style={{ color: '#e2e8f0' }}>{user.name}</strong> kullanıcısı için yeni şifre belirleyin.
        </p>
        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#6ee7b7' }}>✅ Şifre güncellendi!</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label className="label">Yeni Şifre *</label>
              <input id="reset-password" type="password" className="input-base" placeholder="••••••" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="label">Şifre Tekrar *</label>
              <input id="reset-confirm" type="password" className="input-base" placeholder="••••••" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} />
              {error && <p className="error-text">{error}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>İptal</button>
              <button id="reset-submit" type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Sıfırla</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// --- Main Content ---
function UsersContent() {
  const { users, load, addUser, updateUser, deleteUser, resetPassword, setRole } = useUsersStore();
  const { user: currentUser, refresh } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: { name: string; email: string; role: Role; password?: string }) => {
    if (editing) {
      updateUser(editing.id, { name: data.name, email: data.email, role: data.role });
      if (data.password) resetPassword(editing.id, data.password);
      if (editing.id === currentUser?.userId) refresh();
      return { success: true };
    } else {
      return addUser({ name: data.name, email: data.email, role: data.role, password: data.password! });
    }
  };

  const handleDelete = (u: User) => {
    if (u.id === currentUser?.userId) { alert('Kendi hesabınızı silemezsiniz.'); return; }
    if (confirm(`"${u.name}" adlı kullanıcı silinsin mi?`)) deleteUser(u.id);
  };

  const handleRoleChange = (u: User, role: Role) => {
    setRole(u.id, role);
    if (u.id === currentUser?.userId) refresh();
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9' }}>Kullanıcı Yönetimi</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{users.length} kayıtlı kullanıcı</p>
        </div>
        <button id="btn-add-user" className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          ➕ Yeni Kullanıcı
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          className="input-base"
          placeholder="🔍 Ad, ID veya rol ile ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {ROLES.map(r => (
          <div key={r.value} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{r.label.split(' ')[0]}</span>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {r.value === 'admin' ? 'Admin' : r.value === 'yetkili' ? 'Yetkili' : 'Personel'}
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>
                {users.filter(u => u.role === r.value).length}
              </p>
            </div>
          </div>
        ))}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Toplam</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>{users.length}</p>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="card desktop-table" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Kullanıcı ID</th>
                <th>Rol</th>
                <th>Kayıt Tarihi</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>Kullanıcı bulunamadı.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#020617', fontSize: '0.875rem', flexShrink: 0,
                      }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.875rem' }}>{u.name}</p>
                        {u.id === currentUser?.userId && <p style={{ fontSize: '0.7rem', color: '#f59e0b' }}>• Siz</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.email}</td>
                  <td>
                    <select
                      className="input-base"
                      value={u.role}
                      onChange={e => handleRoleChange(u, e.target.value as Role)}
                      style={{ width: 'auto', padding: '0.3rem 2rem 0.3rem 0.6rem', fontSize: '0.8rem' }}
                      disabled={u.id === currentUser?.userId}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(u.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" title="Düzenle" onClick={() => { setEditing(u); setModalOpen(true); }} style={{ fontSize: '0.875rem' }}>✏️</button>
                      <button className="btn-ghost" title="Şifre Sıfırla" onClick={() => setResetTarget(u)} style={{ fontSize: '0.875rem' }}>🔑</button>
                      <button className="btn-ghost" title="Sil" onClick={() => handleDelete(u)} style={{ fontSize: '0.875rem', color: '#f87171' }} disabled={u.id === currentUser?.userId}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map(u => (
          <div key={u.id} className="card card-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: '#020617', fontSize: '1rem',
                }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f1f5f9' }}>{u.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</p>
                </div>
              </div>
              <span className={`badge badge-${u.role}`}>{u.role}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Rol:</label>
              <select
                className="input-base"
                value={u.role}
                onChange={e => handleRoleChange(u, e.target.value as Role)}
                style={{ flex: 1, padding: '0.35rem 2rem 0.35rem 0.6rem', fontSize: '0.8rem' }}
                disabled={u.id === currentUser?.userId}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={() => { setEditing(u); setModalOpen(true); }}>✏️ Düzenle</button>
              <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={() => setResetTarget(u)}>🔑 Şifre</button>
              <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={() => handleDelete(u)} disabled={u.id === currentUser?.userId}>🗑️ Sil</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <UserModal
          user={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
      {resetTarget && (
        <PasswordResetModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onReset={(pw) => resetPassword(resetTarget.id, pw)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

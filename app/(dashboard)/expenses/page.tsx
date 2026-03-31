'use client';
import { useState, useEffect } from 'react';
import { useExpensesStore } from '@/store/expensesStore';
import { validatePrice, formatCurrency, formatDate } from '@/lib/validators';
import { Expense, Period } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';
import PeriodFilter from '@/components/PeriodFilter';

const CATEGORIES: Expense['category'][] = ['Fatura', 'Maaş', 'Kira', 'Malzeme', 'Diğer'];
const CATEGORY_ICONS: Record<string, string> = { Fatura: '📄', Maaş: '👤', Kira: '🏠', Malzeme: '🧴', Diğer: '📦' };
const CATEGORY_COLORS: Record<string, string> = {
  Fatura: 'rgba(99,102,241,0.12)', Maaş: 'rgba(245,158,11,0.12)',
  Kira: 'rgba(239,68,68,0.12)', Malzeme: 'rgba(16,185,129,0.12)', Diğer: 'rgba(71,85,105,0.25)',
};

const PERIOD_LABELS: Record<Period, string> = { daily: 'Bugün', weekly: 'Bu Hafta', monthly: 'Bu Ay' };

export default function ExpensesPage() {
  return <RoleGuard allowedRoles={['admin']}><ExpensesContent /></RoleGuard>;
}

function ExpensesContent() {
  const { expenses, load, addExpense, deleteExpense, getExpensesByPeriod, getTotalByPeriod } = useExpensesStore();
  const [category, setCategory] = useState<Expense['category']>('Fatura');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [success, setSuccess] = useState(false);
  const [period, setPeriod] = useState<Period>('monthly');
  const [filterCat, setFilterCat] = useState<string>('all');

  useEffect(() => { load(); }, [load]);

  const periodTotal = getTotalByPeriod(period);
  const periodExpenses = getExpensesByPeriod(period);
  const filtered = filterCat === 'all' ? periodExpenses : periodExpenses.filter(e => e.category === filterCat);

  // Category breakdown for current period
  const catTotals = CATEGORIES.map(cat => ({
    cat,
    total: periodExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
    count: periodExpenses.filter(e => e.category === cat).length,
  }));

  const validate = () => {
    const amtErr = validatePrice(amount);
    if (amtErr) { setErrors({ amount: amtErr }); return false; }
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    addExpense({ category, amount: parseFloat(amount), note: note.trim(), date });
    setAmount(''); setNote(''); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9' }}>Gider Yönetimi</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{PERIOD_LABELS[period]} toplam: <strong style={{ color: '#f87171' }}>{formatCurrency(periodTotal)}</strong></p>
        </div>
        <PeriodFilter value={period} onChange={p => { setPeriod(p); setFilterCat('all'); }} />
      </div>

      {/* Category summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {catTotals.map(({ cat, total, count }) => (
          <div key={cat} className="card card-hover" style={{
            background: filterCat === cat ? CATEGORY_COLORS[cat] : 'rgba(15,23,42,0.5)',
            border: `1px solid ${filterCat === cat ? 'rgba(245,158,11,0.35)' : 'rgba(71,85,105,0.2)'}`,
            cursor: 'pointer',
          }} onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{CATEGORY_ICONS[cat]}</p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{cat}</p>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: total > 0 ? '#f87171' : '#475569' }}>{formatCurrency(total)}</p>
            <p style={{ fontSize: '0.68rem', color: '#64748b' }}>{count} kayıt</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr', gap: '1.25rem' }} className="exp-grid">
        {/* Add form */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.25rem' }}>➕ Gider Ekle</h3>
          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '0.5rem', padding: '0.625rem', marginBottom: '1rem', color: '#6ee7b7', fontSize: '0.8rem' }}>
              ✅ Gider başarıyla kaydedildi!
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label className="label">Kategori *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setCategory(c)} style={{
                    padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid', cursor: 'pointer',
                    background: category === c ? CATEGORY_COLORS[c] : 'rgba(15,23,42,0.5)',
                    borderColor: category === c ? 'rgba(245,158,11,0.3)' : 'rgba(71,85,105,0.25)',
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    fontSize: '0.8rem', fontWeight: 500,
                    color: category === c ? '#e2e8f0' : '#64748b',
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}>
                    <span>{CATEGORY_ICONS[c]}</span> {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Tutar (₺) *</label>
              <input id="exp-amount" type="number" className="input-base" placeholder="500" value={amount} min="1" step="0.01"
                onChange={e => { setAmount(e.target.value); setErrors({}); }} />
              {errors.amount && <p className="error-text">{errors.amount}</p>}
            </div>
            <div>
              <label className="label">Tarih *</label>
              <input id="exp-date" type="date" className="input-base" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Not (İsteğe bağlı)</label>
              <textarea id="exp-note" className="input-base" placeholder="Açıklama..." value={note}
                onChange={e => setNote(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </div>
            <button id="exp-submit" type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>💾 Kaydet</button>
          </form>
        </div>

        {/* Expense list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(71,85,105,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
              {PERIOD_LABELS[period]} Giderler
              {filterCat !== 'all' && <span style={{ color: '#f59e0b', fontWeight: 400 }}> · {filterCat}</span>}
            </h3>
            {filterCat !== 'all' && (
              <button className="btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => setFilterCat('all')}>× Filtreyi Kaldır</button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-base">
              <thead>
                <tr><th>Kategori</th><th>Tutar</th><th>Tarih</th><th>Not</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#475569' }}>Bu dönemde gider kaydı yok.</td></tr>
                ) : filtered.map(exp => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{CATEGORY_ICONS[exp.category]}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#e2e8f0' }}>{exp.category}</span>
                      </div>
                    </td>
                    <td style={{ color: '#f87171', fontWeight: 700 }}>{formatCurrency(exp.amount)}</td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(exp.date)}</td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.note || '—'}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => { if (confirm('Bu gider silinsin mi?')) deleteExpense(exp.id); }} style={{ color: '#f87171', fontSize: '0.875rem' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { .exp-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

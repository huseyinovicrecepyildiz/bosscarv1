'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesStore } from '@/store/salesStore';
import { useExpensesStore } from '@/store/expensesStore';
import { useUsersStore } from '@/store/usersStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/validators';
import { Period, Sale } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';
import PeriodFilter from '@/components/PeriodFilter';
import RevenueChart from '@/components/dashboard/RevenueChart';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <RoleGuard allowedRoles={['admin']}><DashboardContent /></RoleGuard>;
}

const PERIOD_LABELS: Record<Period, string> = { daily: 'Bugün', weekly: 'Bu Hafta', monthly: 'Bu Ay' };

function DashboardContent() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('monthly');
  const { sales, load: loadSales, getSalesByPeriod, getRevenueByPeriod, getSalesByStaff, getChartData: getSalesChart, getTodaySales } = useSalesStore();
  const { load: loadExpenses, getExpensesByPeriod, getTotalByPeriod, getChartData: getExpChart } = useExpensesStore();
  const { users, load: loadUsers } = useUsersStore();
  const { user } = useAuthStore();
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [unpaidSales, setUnpaidSales] = useState<any[]>([]);

  useEffect(() => { loadSales(); loadExpenses(); loadUsers(); }, [loadSales, loadExpenses, loadUsers]);

  useEffect(() => {
    const unpaid = sales.filter((s: any) => {
      const status = String(s.paymentStatus || '').toLowerCase();
      return status === 'ödenmedi' || status === 'kısmi ödeme';
    });
    setUnpaidSales(unpaid);
  }, [sales]);

  const periodSales = getSalesByPeriod(period);
  const periodRevenue = getRevenueByPeriod(period);
  const periodExpenses = getTotalByPeriod(period);
  const netProfit = periodRevenue - periodExpenses;
  const todaySales = getTodaySales();
  const staffPerformance = getSalesByStaff(period);

  // Merge chart data
  const salesChart = getSalesChart(period);
  const expChart = getExpChart(period);
  const chartData = salesChart.map(s => ({
    label: s.label,
    gelir: s.revenue,
    gider: expChart.find(e => e.date === s.date)?.expenses ?? 0,
  }));

  const periodLabel = PERIOD_LABELS[period];

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header + Period Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9' }}>
            Merhaba, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Boss Car ERP • {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Stat Cards */}
      <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {[
          {
            label: `${periodLabel} Gelir`, value: formatCurrency(periodRevenue), icon: '💵',
            color: 'green', sub: `${periodSales.length} işlem`,
          },
          {
            label: `${periodLabel} Gider`, value: formatCurrency(periodExpenses), icon: '📋',
            color: 'red', sub: `${getExpensesByPeriod(period).length} kayıt`,
          },
          {
            label: 'Net Kâr', value: formatCurrency(netProfit), icon: netProfit >= 0 ? '📈' : '📉',
            color: netProfit >= 0 ? 'amber' : 'red',
            sub: netProfit >= 0 ? '🟢 Kâra geçildi' : '🔴 Zarar olabilir',
          },
          {
            label: 'Tahsilat Bekleyen', value: unpaidSales.length.toString(), icon: '⏳',
            color: 'red', sub: `${formatCurrency(unpaidSales.reduce((sum, s: any) => sum + (s.amount - (s.paymentAmount || 0)), 0))} alacak`,
            onClick: () => setShowUnpaidModal(true)
          },
          {
            label: 'Bugünkü Satış', value: todaySales.length.toString(), icon: '🚗',
            color: 'violet', sub: formatCurrency(todaySales.reduce((s, x) => s + x.amount, 0)),
          },
          {
            label: 'Personel', value: users.length.toString(), icon: '👥',
            color: 'amber', sub: `Aktif kadro`,
            onClick: () => router.push('/staff')
          },
        ].map(stat => (
          <div 
            key={stat.label} 
            className={`card stat-gradient-${stat.color}`} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '1rem 0.5rem',
              textAlign: 'center',
              cursor: (stat as any).onClick ? 'pointer' : 'default',
              transition: 'transform 0.2s',
            }}
            onClick={(stat as any).onClick}
            onMouseOver={(e) => (stat as any).onClick && (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseOut={(e) => (stat as any).onClick && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '1.75rem' }}>{stat.icon}</div>
            <div style={{ minWidth: 0, width: '100%' }}>
              <p style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.label}</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.value}</p>
              <p style={{ fontSize: '0.6rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ... (Unpaid Sales Modal omitted for brevity, but I will keep it in the final file change) */}
      {/* (Since I'm using replace_file_content I must include the modal if I'm replacing the whole section) */}
      
      {/* Unpaid Sales Modal */}
      {showUnpaidModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem'
        }}>
          <div className="card animate-fade-in-up" style={{ width: '100%', maxWidth: 800, maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0, background: '#0f172a', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '1rem' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(71,85,105,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>⏳ Tahsilat Bekleyenler</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowUnpaidModal(false)} style={{ fontSize: '1.25rem' }}>✕</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem' }}>
              {unpaidSales.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#475569' }}>Bekleyen tahsilat bulunmuyor.</div>
              ) : (
                <>
                  <div className="hidden-mobile">
                    <table className="table-base">
                      <thead>
                        <tr><th>Plaka</th><th>Hizmet</th><th>Toplam</th><th>Kalan</th></tr>
                      </thead>
                      <tbody>
                        {unpaidSales.map((s: any) => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 600, color: '#fbbf24' }}>{s.plate}</td>
                            <td style={{ fontSize: '0.85rem' }}>{s.serviceName}</td>
                            <td>{formatCurrency(s.amount)}</td>
                            <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatCurrency(s.amount - (s.paymentAmount || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="only-mobile">
                    {unpaidSales.map((s: any) => (
                      <div key={s.id} className="mobile-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#fbbf24' }}>{s.plate}</span>
                          <span style={{ color: '#ef4444', fontWeight: 800 }}>{formatCurrency(s.amount - (s.paymentAmount || 0))}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{s.serviceName}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '1rem', background: 'rgba(15,23,42,0.6)', borderTop: '1px solid rgba(71,85,105,0.2)' }}>
              <div style={{ textAlign: 'center', color: '#ef4444', fontWeight: 800, fontSize: '1.2rem' }}>
                {formatCurrency(unpaidSales.reduce((sum, s: any) => sum + (s.amount - (s.paymentAmount || 0)), 0))}
              </div>
              <button className="btn-secondary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => setShowUnpaidModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="chart-grid">
        {/* Revenue / Expense Chart */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>📈 Gelir ve Gider</h3>
          {chartData.length > 0 ? (
            <RevenueChart data={chartData} showExpenses />
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>Yeterli veri yok.</div>
          )}
        </div>

        {/* Staff Performance */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>🏆 Verimlilik</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {staffPerformance.slice(0, 5).map((sp, i) => (
              <div key={sp.staffId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{sp.staffName}</span>
                  <span style={{ fontWeight: 700, color: '#fbbf24' }}>{formatCurrency(sp.total)}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(71,85,105,0.3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(sp.total / (staffPerformance[0]?.total || 1)) * 100}%`, background: '#fbbf24' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(71,85,105,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>📋 Son İşlemler</h3>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden-mobile">
          <table className="table-base">
            <thead>
              <tr><th>Plaka</th><th>Hizmet</th><th>Tutar</th><th>Tarih</th></tr>
            </thead>
            <tbody>
              {periodSales.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>İşlem yok.</td></tr>
              ) : periodSales.slice(0, 8).map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: '#fbbf24' }}>{s.plate}</td>
                  <td style={{ fontSize: '0.85rem' }}>{s.serviceName}</td>
                  <td style={{ color: '#6ee7b7' }}>{formatCurrency(s.amount)}</td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="only-mobile" style={{ padding: '0.75rem' }}>
          {periodSales.slice(0, 8).map(s => (
            <div key={s.id} className="mobile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>{s.plate}</span>
                <span style={{ color: '#6ee7b7', fontWeight: 700 }}>{formatCurrency(s.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>{s.serviceName}</span>
                <span>{s.date}</span>
              </div>
            </div>
          ))}
          {periodSales.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>İşlem yok.</div>}
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .chart-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
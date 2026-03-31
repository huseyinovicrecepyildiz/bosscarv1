'use client';
import { useEffect, useState } from 'react';
import { useSalesStore } from '@/store/salesStore';
import { useExpensesStore } from '@/store/expensesStore';
import { useUsersStore } from '@/store/usersStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/validators';
import { Period } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';
import PeriodFilter from '@/components/PeriodFilter';
import RevenueChart from '@/components/dashboard/RevenueChart';

export default function DashboardPage() {
  return <RoleGuard allowedRoles={['admin']}><DashboardContent /></RoleGuard>;
}

const PERIOD_LABELS: Record<Period, string> = { daily: 'Bugün', weekly: 'Bu Hafta', monthly: 'Bu Ay' };

function DashboardContent() {
  const [period, setPeriod] = useState<Period>('monthly');
  const { sales, load: loadSales, getSalesByPeriod, getRevenueByPeriod, getSalesByStaff, getChartData: getSalesChart, getTodaySales } = useSalesStore();
  const { load: loadExpenses, getExpensesByPeriod, getTotalByPeriod, getChartData: getExpChart } = useExpensesStore();
  const { users, load: loadUsers } = useUsersStore();
  const { user } = useAuthStore();

  useEffect(() => { loadSales(); loadExpenses(); loadUsers(); }, [loadSales, loadExpenses, loadUsers]);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
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
            sub: netProfit >= 0 ? '🟢 Kârlı dönem' : '🔴 Zararlı dönem',
          },
          {
            label: 'Bugünkü Satış', value: todaySales.length.toString(), icon: '🚗',
            color: 'violet', sub: formatCurrency(todaySales.reduce((s, x) => s + x.amount, 0)),
          },
          {
            label: 'Toplam Personel', value: users.length.toString(), icon: '👥',
            color: 'amber', sub: `${users.filter(u => u.role === 'admin').length} admin·${users.filter(u => u.role === 'yetkili').length} yetkili`,
          },
        ].map(stat => (
          <div key={stat.label} className={`card stat-gradient-${stat.color}`} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>{stat.icon}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{stat.label}</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.value}</p>
              <p style={{ fontSize: '0.68rem', color: '#64748b' }}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="chart-grid">
        {/* Revenue / Expense Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
              📈 Gelir — Gider
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b', marginLeft: '0.5rem' }}>
                ({period === 'daily' ? 'Son 7 Gün' : period === 'weekly' ? 'Son 4 Hafta' : 'Son 6 Ay'})
              </span>
            </h3>
          </div>
          {chartData.length > 0 ? (
            <RevenueChart data={chartData} showExpenses />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>Yeterli veri yok.</div>
          )}
        </div>

        {/* Staff Performance */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>
            🏆 {periodLabel} Personel Performansı
          </h3>
          {staffPerformance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>
              <p style={{ fontSize: '2rem' }}>📊</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Bu dönemde veri yok.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {staffPerformance.map((sp, i) => {
                const maxTotal = staffPerformance[0]?.total || 1;
                const pct = (sp.total / maxTotal) * 100;
                return (
                  <div key={sp.staffId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤'}</span>
                        <span style={{ fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0' }}>{sp.staffName}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>{formatCurrency(sp.total)}</p>
                        <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{sp.count} araç</p>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(71,85,105,0.3)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, width: `${pct}%`,
                        background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : i === 1 ? 'linear-gradient(90deg,#6366f1,#a5b4fc)' : 'linear-gradient(90deg,#10b981,#6ee7b7)',
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(71,85,105,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
            📋 Son İşlemler
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b', marginLeft: '0.5rem' }}>({periodLabel})</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{periodSales.length} satış</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base">
            <thead>
              <tr><th>Plaka</th><th>Hizmet</th><th>Araç Türü</th><th>Personel</th><th>Tutar</th><th>Tarih</th></tr>
            </thead>
            <tbody>
              {periodSales.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>Bu dönemde işlem yok.</td></tr>
              ) : periodSales.slice(0, 15).map(s => (
                <tr key={s.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#fbbf24', letterSpacing: '0.05em' }}>{s.plate}</span></td>
                  <td style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{s.serviceName}</td>
                  <td><span style={{ background: 'rgba(71,85,105,0.2)', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#94a3b8' }}>{s.vehicleType}</span></td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{s.staffName}</td>
                  <td style={{ color: '#6ee7b7', fontWeight: 600 }}>{formatCurrency(s.amount)}</td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .chart-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

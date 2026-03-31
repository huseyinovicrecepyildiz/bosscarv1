'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  label: string;
  gelir?: number;
  gider?: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  showExpenses?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const gelir = payload.find((p: any) => p.dataKey === 'gelir')?.value ?? 0;
    const gider = payload.find((p: any) => p.dataKey === 'gider')?.value ?? 0;
    return (
      <div style={{
        background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(71,85,105,0.4)',
        borderRadius: '0.5rem', padding: '0.75rem 1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: 160,
      }}>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.dataKey === 'gelir' ? 'Gelir' : 'Gider'}:</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>
              ₺{p.value.toLocaleString('tr-TR')}
            </span>
          </div>
        ))}
        {gelir > 0 || gider > 0 ? (
          <div style={{ borderTop: '1px solid rgba(71,85,105,0.3)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Net: </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: (gelir - gider) >= 0 ? '#6ee7b7' : '#f87171' }}>
              ₺{(gelir - gider).toLocaleString('tr-TR')}
            </span>
          </div>
        ) : null}
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data, showExpenses = true }: RevenueChartProps) {
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="gelirGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="giderGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.15)" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(71,85,105,0.2)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(71,85,105,0.2)' }}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `₺${(v / 1000).toFixed(0)}K` : `₺${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(val) => <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{val === 'gelir' ? 'Gelir' : 'Gider'}</span>}
          />
          <Area type="monotone" dataKey="gelir" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gelirGrad)"
            dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#fbbf24' }} />
          {showExpenses && (
            <Area type="monotone" dataKey="gider" stroke="#ef4444" strokeWidth={2} fill="url(#giderGrad)"
              dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#f87171' }} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

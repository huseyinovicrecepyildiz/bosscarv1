'use client';
import { Period } from '@/lib/types';

interface PeriodFilterProps {
  value: Period;
  onChange: (period: Period) => void;
}

const OPTIONS: { value: Period; label: string; short: string }[] = [
  { value: 'daily', label: 'Günlük', short: 'Son 7 Gün' },
  { value: 'weekly', label: 'Haftalık', short: 'Son 4 Hafta' },
  { value: 'monthly', label: 'Aylık', short: 'Son 6 Ay' },
];

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'rgba(15,23,42,0.8)',
      border: '1px solid rgba(71,85,105,0.35)',
      borderRadius: '0.625rem',
      padding: '0.25rem',
      gap: '0.125rem',
    }}>
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.short}
          style={{
            padding: '0.375rem 0.875rem',
            borderRadius: '0.4rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.18s',
            background: value === opt.value
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'transparent',
            color: value === opt.value ? '#020617' : '#94a3b8',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

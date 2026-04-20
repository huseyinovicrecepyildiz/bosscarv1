'use client';
import { useState } from 'react';

type PanelDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const PANELS: PanelDef[] = [
  { id: 'front-bumper',       label: 'Ön Tampon',          x: 10,  y: 10,  w: 280, h: 50 },
  { id: 'front-left-fender',  label: 'Sol Ön Çamurluk',    x: 10,  y: 65,  w: 70,  h: 110 },
  { id: 'hood',               label: 'Kaput',              x: 80,  y: 65,  w: 140, h: 110 },
  { id: 'front-right-fender', label: 'Sağ Ön Çamurluk',    x: 220, y: 65,  w: 70,  h: 110 },
  { id: 'front-left-door',    label: 'Sol Ön Kapı',        x: 10,  y: 180, w: 70,  h: 130 },
  { id: 'roof',               label: 'Tavan',              x: 80,  y: 180, w: 140, h: 265 },
  { id: 'front-right-door',   label: 'Sağ Ön Kapı',        x: 220, y: 180, w: 70,  h: 130 },
  { id: 'rear-left-door',     label: 'Sol Arka Kapı',      x: 10,  y: 315, w: 70,  h: 130 },
  { id: 'rear-right-door',    label: 'Sağ Arka Kapı',      x: 220, y: 315, w: 70,  h: 130 },
  { id: 'rear-left-quarter',  label: 'Sol Arka Çeyrek',    x: 10,  y: 450, w: 70,  h: 140 },
  { id: 'trunk',              label: 'Bagaj Kapağı',       x: 80,  y: 450, w: 140, h: 140 },
  { id: 'rear-right-quarter', label: 'Sağ Arka Çeyrek',    x: 220, y: 450, w: 70,  h: 140 },
  { id: 'rear-bumper',        label: 'Arka Tampon',        x: 10,  y: 595, w: 280, h: 50 },
];

const TOTAL = PANELS.length;

type Props = {
  value: string[];
  onChange?: (ids: string[]) => void;
  readOnly?: boolean;
};

export default function CarBodyDiagram({ value, onChange, readOnly }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const selected = new Set(value);

  const toggle = (id: string) => {
    if (readOnly || !onChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(Array.from(next));
  };

  const label = hoverId ? PANELS.find(p => p.id === hoverId)?.label : null;

  return (
    <div style={{
      background: 'rgba(15,23,42,0.5)',
      border: '1px solid rgba(71,85,105,0.25)',
      borderRadius: '0.625rem',
      padding: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
    }}>
      <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', fontWeight: 600 }}>
        ▲ ÖN
      </div>

      <svg
        viewBox="0 0 300 655"
        width="100%"
        style={{ maxWidth: 220, height: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x={4} y={4} width={292} height={647}
          rx={34} ry={34}
          fill="none"
          stroke="rgba(71,85,105,0.35)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />
        {PANELS.map(p => {
          const isSel = selected.has(p.id);
          const isHover = hoverId === p.id;
          const fill = isSel ? '#f59e0b' : isHover && !readOnly ? '#475569' : '#334155';
          return (
            <rect
              key={p.id}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx={6}
              ry={6}
              fill={fill}
              fillOpacity={isSel ? 0.85 : 0.75}
              stroke={isSel ? '#fbbf24' : 'rgba(15,23,42,0.6)'}
              strokeWidth={isSel ? 2 : 1}
              style={{ cursor: readOnly ? 'default' : 'pointer', transition: 'fill 0.15s' }}
              onClick={() => toggle(p.id)}
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId(h => h === p.id ? null : h)}
            />
          );
        })}
      </svg>

      <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', fontWeight: 600 }}>
        ARKA ▼
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: '0.25rem',
        gap: '0.5rem',
      }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', minHeight: '1em' }}>
          {label ?? (readOnly ? 'Kaplanan parçalar' : 'Parçaya tıklayarak işaretle')}
        </span>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: selected.size > 0 ? '#fbbf24' : '#64748b',
          background: selected.size > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(71,85,105,0.12)',
          border: '1px solid',
          borderColor: selected.size > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(71,85,105,0.25)',
          borderRadius: '0.35rem',
          padding: '0.15rem 0.45rem',
          whiteSpace: 'nowrap',
        }}>
          {selected.size} / {TOTAL}
        </span>
      </div>
    </div>
  );
}
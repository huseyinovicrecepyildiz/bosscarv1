'use client';
import { useState, useEffect } from 'react';
import { useServicesStore } from '@/store/servicesStore';
import { formatCurrency } from '@/lib/validators';
import { ServiceType, VehiclePrice } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';

const ALL_VEHICLE_TYPES = ['Sedan', 'SUV', 'Pickup', 'Van', 'Minibüs', 'Motosiklet'];

const VEHICLE_ICONS: Record<string, string> = {
  Sedan: '🚗', SUV: '🚙', Pickup: '🛻', Van: '🚐', Minibüs: '🚌', Motosiklet: '🏍️',
};

export default function ServicesPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'yetkili']}>
      <ServicesContent />
    </RoleGuard>
  );
}

// ─── Service Modal ──────────────────────────────────────────────────────────
interface ServiceModalProps {
  service?: ServiceType | null;
  onClose: () => void;
  onSave: (data: { name: string; prices: VehiclePrice[]; isPpf: boolean; active: boolean }) => void;
}

function ServiceModal({ service, onClose, onSave }: ServiceModalProps) {
  const [name, setName] = useState(service?.name || '');
  const [nameErr, setNameErr] = useState('');
  const [isPpf, setIsPpf] = useState(service?.isPpf ?? false);
  // Initialize price rows: existing prices + empty rows for missing vehicle types
  const [priceRows, setPriceRows] = useState<{ vehicleType: string; price: string; enabled: boolean }[]>(() => {
    return ALL_VEHICLE_TYPES.map(vt => {
      const existing = service?.prices.find(p => p.vehicleType === vt);
      return {
        vehicleType: vt,
        price: existing ? existing.price.toString() : '',
        enabled: !!existing,
      };
    });
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleRow = (vt: string) => {
    setPriceRows(rows => rows.map(r => r.vehicleType === vt ? { ...r, enabled: !r.enabled, price: r.enabled ? '' : r.price } : r));
    setErrors(e => { const n = { ...e }; delete n[vt]; return n; });
  };

  const setPrice = (vt: string, val: string) => {
    setPriceRows(rows => rows.map(r => r.vehicleType === vt ? { ...r, price: val } : r));
    setErrors(e => { const n = { ...e }; delete n[vt]; return n; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) { setNameErr('En az 2 karakter giriniz.'); return; }
    setNameErr('');

    let prices: VehiclePrice[] = [];
    if (!isPpf) {
      const enabledRows = priceRows.filter(r => r.enabled);
      if (enabledRows.length === 0) { errs['_general'] = 'En az bir araç türü için fiyat belirlemelisiniz.'; }

      enabledRows.forEach(r => {
        const n = parseFloat(r.price);
        if (!r.price || isNaN(n) || n <= 0) errs[r.vehicleType] = 'Geçerli fiyat girin.';
      });

      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      prices = enabledRows.map(r => ({ vehicleType: r.vehicleType, price: parseFloat(r.price) }));
    }

    onSave({ name: name.trim(), prices, isPpf, active: service?.active ?? true });
    onClose();
  };

  const enabledCount = priceRows.filter(r => r.enabled).length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card animate-fade-in-up" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>
              {service ? '✏️ Hizmet Düzenle' : '➕ Yeni Hizmet Ekle'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
              Araç türlerine göre fiyat belirleyin
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Service name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Hizmet Adı *</label>
            <input
              id="svc-name"
              type="text"
              className="input-base"
              placeholder="örn: Dış Yıkama"
              value={name}
              onChange={e => { setName(e.target.value); setNameErr(''); }}
            />
            {nameErr && <p className="error-text">{nameErr}</p>}
          </div>

          {/* PPF Toggle */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
            background: isPpf ? 'rgba(129,140,248,0.08)' : 'rgba(15,23,42,0.4)',
            border: `1px solid ${isPpf ? 'rgba(129,140,248,0.3)' : 'rgba(71,85,105,0.2)'}`,
            transition: 'all 0.15s', marginBottom: '1.25rem',
          }}>
            <input
              type="checkbox"
              checked={isPpf}
              onChange={e => setIsPpf(e.target.checked)}
              style={{ width: 17, height: 17, accentColor: '#818cf8', cursor: 'pointer' }}
            />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: isPpf ? '#818cf8' : '#94a3b8' }}>
                💠 PPF Kaplama (Özel Fiyatlı Hizmet)
              </p>
              <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>
                İşaretlenirse fiyat her satış sırasında manuel girilir — araç başı sabit fiyat yoktur.
              </p>
            </div>
          </label>

          {/* General error */}
          {errors['_general'] && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '0.625rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.8rem' }}>
              ⚠️ {errors['_general']}
            </div>
          )}

          {!isPpf ? (
            <>
              {/* Pricing header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="label" style={{ marginBottom: 0 }}>
                  Araç Başı Fiyatlar * <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>({enabledCount} araç türü seçili)</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" style={{ fontSize: '0.7rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setPriceRows(rows => rows.map(r => ({ ...r, enabled: true })))}>
                    Tümünü seç
                  </button>
                  <span style={{ color: '#475569' }}>·</span>
                  <button type="button" style={{ fontSize: '0.7rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setPriceRows(rows => rows.map(r => ({ ...r, enabled: false, price: '' })))}>
                    Temizle
                  </button>
                </div>
              </div>

              {/* Price rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {priceRows.map(row => (
                  <div key={row.vehicleType} style={{
                    display: 'grid', gridTemplateColumns: '36px 1fr 140px',
                    alignItems: 'center', gap: '0.625rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    background: row.enabled ? 'rgba(245,158,11,0.05)' : 'rgba(15,23,42,0.4)',
                    border: `1px solid ${row.enabled ? 'rgba(245,158,11,0.2)' : 'rgba(71,85,105,0.2)'}`,
                    transition: 'all 0.15s',
                  }}>
                    {/* Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={() => toggleRow(row.vehicleType)}
                        style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
                      />
                    </label>

                    {/* Vehicle type label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{VEHICLE_ICONS[row.vehicleType]}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: row.enabled ? '#e2e8f0' : '#64748b' }}>
                        {row.vehicleType}
                      </span>
                    </div>

                    {/* Price input */}
                    <div>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                          fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700, pointerEvents: 'none',
                        }}>₺</span>
                        <input
                          type="number"
                          className="input-base"
                          placeholder="0"
                          value={row.price}
                          onChange={e => setPrice(row.vehicleType, e.target.value)}
                          disabled={!row.enabled}
                          min="1"
                          step="1"
                          style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', textAlign: 'right' }}
                        />
                      </div>
                      {errors[row.vehicleType] && <p className="error-text" style={{ fontSize: '0.7rem', marginTop: 2 }}>{errors[row.vehicleType]}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick fill helper */}
              {enabledCount > 1 && (
                <div style={{ marginBottom: '1rem', padding: '0.625rem', background: 'rgba(15,23,42,0.5)', borderRadius: '0.5rem', border: '1px solid rgba(71,85,105,0.2)' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>💡 Hızlı fiyat doldur (Sedan baz alınır):</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'SUV +%30', multipliers: { Sedan: 1, SUV: 1.3, Pickup: 1.15, Van: 1.4, Minibüs: 1.7, Motosiklet: 0.55 } },
                      { label: 'SUV +%50', multipliers: { Sedan: 1, SUV: 1.5, Pickup: 1.25, Van: 1.6, Minibüs: 2, Motosiklet: 0.6 } },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                        onClick={() => {
                          const sedanRow = priceRows.find(r => r.vehicleType === 'Sedan');
                          const base = parseFloat(sedanRow?.price || '0');
                          if (!base) return;
                          setPriceRows(rows => rows.map(r => {
                            if (!r.enabled) return r;
                            const mult = (preset.multipliers as any)[r.vehicleType] ?? 1;
                            return { ...r, price: String(Math.round(base * mult / 10) * 10) };
                          }));
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{
              padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem',
              background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)',
              display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>💠</span>
              <p style={{ fontSize: '0.8rem', color: '#818cf8', lineHeight: 1.6 }}>
                PPF Kaplama hizmetinde <strong>sabit fiyat listesi yoktur</strong>.
                Her satış kaydı sırasında araca özel fiyat manuel olarak girilecektir.
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>İptal</button>
            <button id="svc-save" type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
              {service ? '💾 Güncelle' : '➕ Hizmet Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Price Preview Tooltip ───────────────────────────────────────────────────
function PriceBadges({ prices }: { prices: VehiclePrice[] }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '0.375rem', padding: '0.25rem 0.625rem', fontSize: '0.75rem',
          color: '#fbbf24', fontWeight: 600, cursor: 'default', fontFamily: 'Inter, sans-serif',
        }}
      >
        {prices.length} araç türü
      </button>
      {show && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 20,
          background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(71,85,105,0.4)',
          borderRadius: '0.5rem', padding: '0.75rem', minWidth: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {prices.map(p => (
            <div key={p.vehicleType} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid rgba(71,85,105,0.15)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {VEHICLE_ICONS[p.vehicleType]} {p.vehicleType}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>{formatCurrency(p.price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Content ──────────────────────────────────────────────────────────
function ServicesContent() {
  const { services, load, addService, updateService, toggleActive, deleteService } = useServicesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceType | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'passive'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { load(); }, [load]);

  const filtered = services.filter(s => {
    if (filter === 'active') return s.active;
    if (filter === 'passive') return !s.active;
    return true;
  });

  const handleSave = (data: { name: string; prices: VehiclePrice[]; isPpf: boolean; active: boolean }) => {
    if (editing) {
      updateService(editing.id, { name: data.name, prices: data.prices, isPpf: data.isPpf });
    } else {
      addService({ name: data.name, prices: data.prices, isPpf: data.isPpf, active: true });
    }
    setEditing(null);
  };

  // Min/max fiyat across all vehicle types
  const getPriceRange = (svc: ServiceType) => {
    if (svc.isPpf) return 'Özel Fiyat';
    if (!svc.prices.length) return '—';
    const prices = svc.prices.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9' }}>Hizmet Yönetimi</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
            {services.length} hizmet · {services.filter(s => s.active).length} aktif · Her araç türü için ayrı fiyat
          </p>
        </div>
        <button id="btn-add-service" className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          ➕ Yeni Hizmet
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', 'active', 'passive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.4rem 0.875rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
            border: '1px solid', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
            background: filter === f ? 'rgba(245,158,11,0.15)' : 'rgba(15,23,42,0.6)',
            color: filter === f ? '#fbbf24' : '#64748b',
            borderColor: filter === f ? 'rgba(245,158,11,0.3)' : 'rgba(71,85,105,0.3)',
          }}>
            {f === 'all' ? `Tümü (${services.length})` : f === 'active' ? `✅ Aktif (${services.filter(s => s.active).length})` : `⏸️ Pasif (${services.filter(s => !s.active).length})`}
          </button>
        ))}
      </div>

      {/* Service cards (desktop) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
          padding: '0.75rem 1.25rem',
          background: 'rgba(15,23,42,0.9)',
          borderBottom: '1px solid rgba(71,85,105,0.25)',
          fontSize: '0.72rem', fontWeight: 600, color: '#64748b',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <span>Hizmet Adı</span>
          <span>Fiyat Aralığı</span>
          <span>Araç Türleri</span>
          <span style={{ textAlign: 'right' }}>İşlemler</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
            <p style={{ fontSize: '2.5rem' }}>⚙️</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Hizmet bulunamadı.</p>
          </div>
        ) : filtered.map(service => (
          <div key={service.id}>
            {/* Service row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '0.875rem 1.25rem',
              borderBottom: '1px solid rgba(71,85,105,0.12)',
              alignItems: 'center',
              transition: 'background 0.15s',
              background: expandedId === service.id ? 'rgba(245,158,11,0.04)' : 'transparent',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = expandedId === service.id ? 'rgba(245,158,11,0.06)' : 'rgba(71,85,105,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = expandedId === service.id ? 'rgba(245,158,11,0.04)' : 'transparent')}
            >
              {/* Name + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  className="btn-ghost"
                  onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
                  style={{ fontSize: '0.7rem', padding: '0.25rem', color: expandedId === service.id ? '#f59e0b' : '#64748b' }}
                  title={expandedId === service.id ? 'Kapat' : 'Fiyatları Göster'}
                >
                  {expandedId === service.id ? '▼' : '▶'}
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{service.name}</p>
                    {service.isPpf && (
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700, color: '#818cf8',
                        background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)',
                        borderRadius: '0.25rem', padding: '0.1rem 0.35rem', letterSpacing: '0.04em',
                      }}>PPF</span>
                    )}
                  </div>
                  <span className={`badge ${service.active ? 'badge-active' : 'badge-passive'}`}>
                    {service.active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>

              {/* Price range */}
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: service.isPpf ? '#818cf8' : '#fbbf24' }}>
                {getPriceRange(service)}
              </span>

              {/* Vehicle count */}
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {service.isPpf ? (
                  <span style={{ fontSize: '0.75rem', color: '#818cf8', fontStyle: 'italic' }}>Tüm araçlar</span>
                ) : service.prices.map(p => (
                  <span key={p.vehicleType} title={`${p.vehicleType}: ${formatCurrency(p.price)}`}
                    style={{ fontSize: '1rem', cursor: 'default' }}>
                    {VEHICLE_ICONS[p.vehicleType]}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                <button className="btn-ghost" title="Düzenle" onClick={() => { setEditing(service); setModalOpen(true); }} style={{ fontSize: '0.875rem' }}>✏️</button>
                <button className="btn-ghost" title={service.active ? 'Pasife Al' : 'Aktife Al'} onClick={() => toggleActive(service.id)} style={{ fontSize: '0.875rem' }}>
                  {service.active ? '⏸️' : '▶️'}
                </button>
                <button className="btn-ghost" title="Sil" onClick={() => { if (confirm(`"${service.name}" silinsin mi?`)) deleteService(service.id); }} style={{ fontSize: '0.875rem', color: '#f87171' }}>🗑️</button>
              </div>
            </div>

            {/* Expanded price grid */}
            {expandedId === service.id && (
              <div style={{
                background: 'rgba(245,158,11,0.03)',
                borderBottom: '1px solid rgba(71,85,105,0.15)',
                padding: '0.875rem 1.25rem 1rem 3.5rem',
              }}>
                <p style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
                  Araç Başı Fiyatlar
                </p>
                <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                  {service.prices
                    .sort((a, b) => a.price - b.price)
                    .map(p => (
                      <div key={p.vehicleType} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(71,85,105,0.2)',
                        borderRadius: '0.5rem', padding: '0.5rem 0.875rem',
                        minWidth: 130,
                      }}>
                        <span style={{ fontSize: '1.25rem' }}>{VEHICLE_ICONS[p.vehicleType]}</span>
                        <div>
                          <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.vehicleType}</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24' }}>{formatCurrency(p.price)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pricing matrix hint */}
      <div style={{ marginTop: '1rem', padding: '0.875rem 1.25rem', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(71,85,105,0.2)', borderRadius: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>
          Her hizmet için <strong style={{ color: '#94a3b8' }}>araç türüne göre farklı fiyat</strong> belirleyebilirsiniz. Satış sırasında seçilen araç türüne göre otomatik fiyat uygulanır. Bir araç türü için fiyat belirtilmemişse o tür satış ekranında görünmez.
        </p>
      </div>

      {modalOpen && (
        <ServiceModal
          service={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

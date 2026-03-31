'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useServicesStore } from '@/store/servicesStore';
import { useSalesStore } from '@/store/salesStore';
import { validatePlate, formatCurrency, formatDate } from '@/lib/validators';
import { Period, Sale } from '@/lib/types';
import PeriodFilter from '@/components/PeriodFilter';
import RoleGuard from '@/components/RoleGuard';

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Pickup', 'Van', 'Minibüs', 'Motosiklet'];
const VEHICLE_ICONS: Record<string, string> = {
  Sedan: '🚗', SUV: '🚙', Pickup: '🛻', Van: '🚐', Minibüs: '🚌', Motosiklet: '🏍️',
};

export default function SalesPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'yetkili', 'personel']}>
      <SalesContent />
    </RoleGuard>
  );
}

function SalesContent() {
  const { user } = useAuthStore();
  const { services, load: loadServices } = useServicesStore();
  const { sales, load: loadSales, addSale, updateSale, deleteSale, getSalesByPeriod, getRevenueByPeriod } = useSalesStore();

  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ plate?: string; vehicleType?: string; serviceId?: string; manualPrice?: string }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>('daily');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  useEffect(() => { loadServices(); loadSales(); }, [loadServices, loadSales]);

  // Active services that support the selected vehicle type
  const activeServices = services.filter(s => s.active);
  const selectedService = services.find(s => s.id === serviceId);
  const isPpfService = selectedService?.isPpf ?? false;

  // For non-PPF services: filter by vehicle type price entries
  // For PPF services: show even if no per-vehicle price exists (price entered manually)
  const servicesForVehicle = vehicleType
    ? activeServices.filter(s => s.isPpf || s.prices.some(p => p.vehicleType === vehicleType))
    : [];

  const autoPrice = selectedService && vehicleType && !isPpfService
    ? (selectedService.prices.find(p => p.vehicleType === vehicleType)?.price ?? null)
    : null;

  const finalPrice = isPpfService
    ? (manualPrice ? parseFloat(manualPrice) : null)
    : autoPrice;

  const periodSales = getSalesByPeriod(period);
  const periodRevenue = getRevenueByPeriod(period);
  const todaySales = getSalesByPeriod('daily');

  const validate = () => {
    const errs: typeof errors = {};
    const plateErr = validatePlate(plate);
    if (plateErr) errs.plate = plateErr;
    if (!vehicleType) errs.vehicleType = 'Araç türü seçiniz.';
    if (!serviceId) errs.serviceId = 'Hizmet seçiniz.';
    if (isPpfService) {
      const n = parseFloat(manualPrice);
      if (!manualPrice || isNaN(n) || n <= 0) errs.manualPrice = 'PPF hizmeti için fiyat giriniz.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user || !selectedService || finalPrice === null) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    addSale({
      plate: plate.toUpperCase().replace(/\s/g, ''),
      vehicleType,
      serviceId,
      serviceName: selectedService.name,
      amount: finalPrice,
      staffId: user.userId,
      staffName: user.name,
      date: new Date().toISOString().split('T')[0],
      note: note.trim() || undefined,
    });
    setSuccess(`✅ ${plate.toUpperCase()} — ${vehicleType} "${selectedService.name}" kaydedildi! +${formatCurrency(finalPrice)}`);
    setPlate(''); setVehicleType(''); setServiceId(''); setManualPrice(''); setNote(''); setErrors({});
    setLoading(false);
    setTimeout(() => setSuccess(null), 4000);
  };

  const PERIOD_LABELS: Record<Period, string> = {
    daily: 'Bugün', weekly: 'Bu Hafta', monthly: 'Bu Ay',
  };

  // When service changes, reset manual price
  const handleServiceSelect = (id: string) => {
    setServiceId(id);
    setManualPrice('');
    setErrors(p => ({ ...p, serviceId: undefined, manualPrice: undefined }));
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Period filter + stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Hizmet Satışı</h2>
        <PeriodFilter value={period} onChange={p => { setPeriod(p); }} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          { label: `${PERIOD_LABELS[period]} Satış`, value: periodSales.length.toString(), unit: 'araç', color: 'green', icon: '🚗' },
          { label: `${PERIOD_LABELS[period]} Gelir`, value: formatCurrency(periodRevenue), unit: '', color: 'amber', icon: '💵' },
          { label: 'Bugün Satış', value: todaySales.length.toString(), unit: 'araç', color: 'violet', icon: '📅' },
          { label: 'Aktif Hizmetler', value: activeServices.length.toString(), unit: 'hizmet', color: 'green', icon: '⚙️' },
        ].map((stat, i) => (
          <div key={i} className={`card stat-gradient-${stat.color}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.75rem' }}>{stat.icon}</div>
            <div>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>{stat.label}</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
                {stat.value} <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#64748b' }}>{stat.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)', gap: '1.25rem' }} className="sales-grid">
        {/* New sale form */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.25rem' }}>💰 Yeni Satış</h3>

          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#6ee7b7', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Plate */}
            <div>
              <label className="label">Araç Plakası *</label>
              <input
                id="sale-plate"
                type="text"
                className="input-base"
                placeholder="34ABC123"
                value={plate}
                onChange={e => { setPlate(e.target.value.toUpperCase().replace(/\s/g, '')); setErrors(p => ({ ...p, plate: undefined })); }}
                maxLength={10}
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', fontSize: '1rem' }}
              />
              {errors.plate && <p className="error-text">{errors.plate}</p>}
            </div>

            {/* Vehicle type — visual selection */}
            <div>
              <label className="label">Araç Türü *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {VEHICLE_TYPES.map(vt => (
                  <button
                    key={vt}
                    type="button"
                    onClick={() => { setVehicleType(vt); setServiceId(''); setManualPrice(''); setErrors(p => ({ ...p, vehicleType: undefined })); }}
                    style={{
                      padding: '0.5rem 0.25rem', borderRadius: '0.5rem', border: '1px solid',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                      background: vehicleType === vt ? 'rgba(245,158,11,0.15)' : 'rgba(15,23,42,0.6)',
                      borderColor: vehicleType === vt ? 'rgba(245,158,11,0.4)' : 'rgba(71,85,105,0.3)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem' }}>{VEHICLE_ICONS[vt]}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 500, color: vehicleType === vt ? '#fbbf24' : '#94a3b8', marginTop: 2 }}>{vt}</div>
                  </button>
                ))}
              </div>
              {errors.vehicleType && <p className="error-text">{errors.vehicleType}</p>}
            </div>

            {/* Service selection */}
            <div>
              <label className="label">Hizmet Türü *</label>
              {!vehicleType ? (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(71,85,105,0.2)', color: '#475569', fontSize: '0.8rem', textAlign: 'center' }}>
                  Önce araç türü seçin
                </div>
              ) : servicesForVehicle.length === 0 ? (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.8rem' }}>
                  Bu araç türü için aktif hizmet bulunamadı.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {servicesForVehicle.map(s => {
                    const price = s.isPpf ? null : (s.prices.find(p => p.vehicleType === vehicleType)?.price ?? 0);
                    const isSelected = serviceId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleServiceSelect(s.id)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid',
                          cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                          background: isSelected ? 'rgba(245,158,11,0.1)' : 'rgba(15,23,42,0.5)',
                          borderColor: isSelected ? 'rgba(245,158,11,0.35)' : 'rgba(71,85,105,0.25)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: isSelected ? '#fbbf24' : '#e2e8f0' }}>
                            {s.name}
                          </span>
                          {s.isPpf && (
                            <span style={{
                              fontSize: '0.6rem', fontWeight: 700, color: '#818cf8',
                              background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)',
                              borderRadius: '0.25rem', padding: '0.1rem 0.35rem', letterSpacing: '0.04em',
                            }}>
                              ÖZEL FİYAT
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: s.isPpf ? '#818cf8' : '#fbbf24' }}>
                          {s.isPpf ? 'Manuel' : formatCurrency(price ?? 0)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.serviceId && <p className="error-text">{errors.serviceId}</p>}
            </div>

            {/* PPF Manual Price Input */}
            {isPpfService && serviceId && (
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💠 PPF Kaplama Fiyatı *</span>
                  <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 400 }}>araca özel giriniz</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.9rem', color: '#818cf8', fontWeight: 700, pointerEvents: 'none',
                  }}>₺</span>
                  <input
                    id="sale-ppf-price"
                    type="number"
                    className="input-base"
                    placeholder="0"
                    value={manualPrice}
                    onChange={e => { setManualPrice(e.target.value); setErrors(p => ({ ...p, manualPrice: undefined })); }}
                    min="1"
                    step="1"
                    style={{
                      paddingLeft: '1.75rem', fontSize: '1.1rem', fontWeight: 700,
                      color: '#818cf8', letterSpacing: '0.03em',
                      background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)',
                    }}
                  />
                </div>
                {errors.manualPrice && <p className="error-text">{errors.manualPrice}</p>}
              </div>
            )}

            {/* Price preview (non-PPF) */}
            {!isPpfService && autoPrice !== null && (
              <div style={{
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '0.5rem', padding: '0.875rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Araç: {vehicleType}</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{selectedService?.name}</p>
                </div>
                <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.35rem' }}>
                  {formatCurrency(autoPrice)}
                </span>
              </div>
            )}

            {/* PPF price preview */}
            {isPpfService && finalPrice !== null && (
              <div style={{
                background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)',
                borderRadius: '0.5rem', padding: '0.875rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Araç: {vehicleType} · PPF Kaplama</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{selectedService?.name}</p>
                </div>
                <span style={{ color: '#818cf8', fontWeight: 800, fontSize: '1.35rem' }}>
                  {formatCurrency(finalPrice)}
                </span>
              </div>
            )}

            {/* Note field */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📝 Not</span>
                <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 400 }}>isteğe bağlı</span>
              </label>
              <textarea
                id="sale-note"
                className="input-base"
                placeholder="Müşteri notu, özel istek, araç durumu..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                style={{
                  resize: 'vertical', minHeight: '3.5rem', maxHeight: '8rem',
                  fontSize: '0.85rem', lineHeight: 1.5, fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            <button id="sale-submit" type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '0.75rem' }}>
              {loading ? '⏳ Kaydediliyor...' : '✅ Satışı Kaydet'}
            </button>
          </form>
        </div>

        {/* Recent sales */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(71,85,105,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
              📋 {PERIOD_LABELS[period]} Satışlar
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b', marginLeft: '0.5rem' }}>({periodSales.length} kayıt)</span>
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {periodSales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#475569' }}>
                <p style={{ fontSize: '2rem' }}>📭</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Bu dönemde satış kaydı yok.</p>
              </div>
            ) : (
              <table className="table-base sales-table">
                <thead>
                  <tr>
                    <th>Plaka</th>
                    <th>Araç</th>
                    <th>Hizmet</th>
                    <th>Personel</th>
                    <th>Tutar</th>
                    <th>Not</th>
                    <th>Tarih</th>
                    <th style={{ textAlign: 'right' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {periodSales.slice(0, 30).map(sale => (
                    <tr key={sale.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#fbbf24', letterSpacing: '0.05em', fontSize: '0.875rem' }}>
                          {sale.plate}
                        </span>
                      </td>
                      <td style={{ fontSize: '1rem' }}>{VEHICLE_ICONS[sale.vehicleType]} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{sale.vehicleType}</span></td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{sale.serviceName}</span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sale.staffName}</td>
                      <td style={{ color: '#6ee7b7', fontWeight: 600 }}>{formatCurrency(sale.amount)}</td>
                      <td style={{ maxWidth: 140 }}>
                        {sale.note ? (
                          <span
                            title={sale.note}
                            style={{
                              fontSize: '0.72rem', color: '#94a3b8',
                              display: 'block', maxWidth: 130, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              cursor: 'help',
                            }}
                          >
                            💬 {sale.note}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#334155' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatDate(sale.date)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button
                            title="Düzenle"
                            onClick={() => setEditingSale({ ...sale })}
                            style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.375rem', padding: '0.35rem', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                          >
                            ✏️
                          </button>
                          <button
                            title="Sil"
                            onClick={() => deleteSale(sale.id)}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.375rem', padding: '0.35rem', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSale && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card animate-fade-in-up" style={{ width: '100%', maxWidth: 450, padding: '1.5rem', background: '#0f172a', border: '1px solid rgba(71,85,105,0.4)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.25rem', borderBottom: '1px solid rgba(71,85,105,0.2)', paddingBottom: '0.75rem' }}>
              Satışı Düzenle
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(15,23,42,0.6)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(71,85,105,0.2)' }}>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{editingSale.plate} — {editingSale.vehicleType}</p>
                <p style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 500 }}>{editingSale.serviceName}</p>
              </div>

              <div>
                <label className="label">Tutar (₺)</label>
                <input
                  type="number"
                  className="input-base"
                  value={editingSale.amount}
                  onChange={e => setEditingSale({ ...editingSale, amount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="label">Not</label>
                <textarea
                  className="input-base"
                  value={editingSale.note || ''}
                  onChange={e => setEditingSale({ ...editingSale, note: e.target.value })}
                  rows={3}
                  placeholder="Satış notu..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setEditingSale(null)}>
                  İptal
                </button>
                <button type="button" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => {
                  updateSale(editingSale.id, { amount: editingSale.amount, note: editingSale.note });
                  setEditingSale(null);
                }}>
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .sales-grid { grid-template-columns: 1fr !important; }
        }
        .sales-table th, .sales-table td {
          padding: 0.5rem 0.4rem !important;
          font-size: 0.8rem;
          white-space: nowrap;
        }
        .sales-table th:first-child, .sales-table td:first-child { padding-left: 0.8rem !important; }
        .sales-table th:last-child, .sales-table td:last-child { padding-right: 0.8rem !important; }
      `}</style>
    </div>
  );
}

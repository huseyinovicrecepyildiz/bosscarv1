'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useServicesStore } from '@/store/servicesStore';
import { useSalesStore } from '@/store/salesStore';
import { validatePlate, formatCurrency, formatDate } from '@/lib/validators';
import { Period, Sale } from '@/lib/types';
import PeriodFilter from '@/components/PeriodFilter';
import RoleGuard from '@/components/RoleGuard';
import CarBodyDiagram from '@/components/CarBodyDiagram';

export const dynamic = 'force-dynamic';

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
  const [ppfPanels, setPpfPanels] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ plate?: string; vehicleType?: string; serviceId?: string; manualPrice?: string }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>('daily');
  const [editingSale, setEditingSale] = useState<any>(null);
  const [payingSale, setPayingSale] = useState<any>(null);
  const [paymentInput, setPaymentInput] = useState('');

  useEffect(() => { loadServices(); loadSales(); }, [loadServices, loadSales]);

  const activeServices = services.filter(s => s.active);
  const selectedService = services.find(s => s.id === serviceId);
  const isPpfService = selectedService?.isPpf ?? false;

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
      ppfPanels: isPpfService ? ppfPanels : undefined,
    } as any);
    setSuccess(`✅ ${plate.toUpperCase()} — ${vehicleType} "${selectedService.name}" kaydedildi! +${formatCurrency(finalPrice)}`);
    setPlate(''); setVehicleType(''); setServiceId(''); setManualPrice(''); setNote(''); setPpfPanels([]); setErrors({});
    setLoading(false);
    setTimeout(() => setSuccess(null), 4000);
  };

  const PERIOD_LABELS: Record<Period, string> = {
    daily: 'Bugün', weekly: 'Bu Hafta', monthly: 'Bu Ay',
  };

  const handleServiceSelect = (id: string) => {
    setServiceId(id);
    setManualPrice('');
    setPpfPanels([]);
    setErrors(p => ({ ...p, serviceId: undefined, manualPrice: undefined }));
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Hizmet Satışı</h2>
        <PeriodFilter value={period} onChange={p => { setPeriod(p); }} />
      </div>

      <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {[
          { label: `${PERIOD_LABELS[period]} Satış`, value: periodSales.length.toString(), unit: 'araç', color: 'green', icon: '🚗' },
          { label: `${PERIOD_LABELS[period]} Gelir`, value: formatCurrency(periodRevenue), unit: '', color: 'amber', icon: '💵' },
          { label: 'Bugün', value: todaySales.length.toString(), unit: 'araç', color: 'violet', icon: '📅' },
          { label: 'Aktif', value: activeServices.length.toString(), unit: 'hizmet', color: 'green', icon: '⚙️' },
        ].map((stat, i) => (
          <div key={i} className={`card stat-gradient-${stat.color}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{stat.icon}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 500 }}>{stat.label}</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)', gap: '1.25rem' }} className="sales-grid">
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.1rem' }}>💰 Yeni Satış</h3>
          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#6ee7b7', fontSize: '0.75rem' }}>{success}</div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label className="label">Plaka *</label>
              <input type="text" className="input-base" placeholder="34ABC123" value={plate} onChange={e => { setPlate(e.target.value.toUpperCase().replace(/\s/g, '')); setErrors(p => ({ ...p, plate: undefined })); }} maxLength={10} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }} />
              {errors.plate && <p className="error-text">{errors.plate}</p>}
            </div>
            <div>
              <label className="label">Araç Türü *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem' }}>
                {VEHICLE_TYPES.map(vt => (
                  <button key={vt} type="button" onClick={() => { setVehicleType(vt); setServiceId(''); setManualPrice(''); setPpfPanels([]); setErrors(p => ({ ...p, vehicleType: undefined })); }} style={{ padding: '0.5rem 0.25rem', borderRadius: '0.5rem', border: '1px solid', background: vehicleType === vt ? 'rgba(245,158,11,0.15)' : 'rgba(15,23,42,0.6)', borderColor: vehicleType === vt ? 'rgba(245,158,11,0.4)' : 'rgba(71,85,105,0.3)' }}>
                    <div style={{ fontSize: '1.1rem' }}>{VEHICLE_ICONS[vt]}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: vehicleType === vt ? '#fbbf24' : '#94a3b8', marginTop: 2 }}>{vt}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Hizmet *</label>
              {!vehicleType ? (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15,23,42,0.4)', color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>Önce tür seçin</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {servicesForVehicle.map(s => {
                    const price = s.isPpf ? null : (s.prices.find(p => p.vehicleType === vehicleType)?.price ?? 0);
                    const isSelected = serviceId === s.id;
                    return (
                      <button key={s.id} type="button" onClick={() => handleServiceSelect(s.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid', background: isSelected ? 'rgba(245,158,11,0.1)' : 'rgba(15,23,42,0.5)', borderColor: isSelected ? 'rgba(245,158,11,0.35)' : 'rgba(71,85,105,0.25)' }}>
                        <span style={{ fontSize: '0.8rem', color: isSelected ? '#fbbf24' : '#e2e8f0' }}>{s.name}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.isPpf ? '#818cf8' : '#fbbf24' }}>{s.isPpf ? 'Özel' : formatCurrency(price ?? 0)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {isPpfService && (
              <div>
                <label className="label">💠 Fiyat *</label>
                <input type="number" className="input-base" value={manualPrice} onChange={e => setManualPrice(e.target.value)} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', textAlign: 'center' }} />
              </div>
            )}
            {isPpfService && serviceId && (
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎯 Kaplanan Kaporta Parçaları</span>
                  <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 400 }}>isteğe bağlı</span>
                </label>
                <CarBodyDiagram value={ppfPanels} onChange={setPpfPanels} />
              </div>
            )}
            <div>
              <label className="label">Not (Opsiyonel)</label>
              <textarea className="input-base" placeholder="Müşteri notu..." value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ fontSize: '0.85rem', resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.8rem' }}>{loading ? '⏳...' : '✅ Kaydet'}</button>
          </form>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(71,85,105,0.15)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>📋 Satış Kayıtları</h3>
          </div>

          <div className="hidden-mobile">
            <table className="table-base sales-table">
              <thead>
                <tr><th>Plaka</th><th>Hizmet</th><th>Tutar</th><th>Not</th><th>Durum</th><th style={{ textAlign: 'right' }}>İşlem</th></tr>
              </thead>
              <tbody>
                {periodSales.map((sale: any) => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 600, color: '#fbbf24' }}>{sale.plate}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {sale.serviceName}
                      {Array.isArray(sale.ppfPanels) && sale.ppfPanels.length > 0 && (
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.25rem', padding: '0.1rem 0.35rem' }}>
                          🎯 {sale.ppfPanels.length}
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#6ee7b7' }}>{formatCurrency(sale.amount)}</td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#94a3b8' }} title={sale.note}>{sale.note || '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', background: sale.paymentStatus === 'ödendi' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: sale.paymentStatus === 'ödendi' ? '#10b981' : '#ef4444' }}>
                        {sale.paymentStatus?.toUpperCase() || 'ÖDENMEDİ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setPayingSale(sale)} className="btn-ghost" style={{ padding: 4 }}>💳</button>
                        <button onClick={() => setEditingSale({ ...sale })} className="btn-ghost" style={{ padding: 4 }}>✏️</button>
                        <button onClick={() => deleteSale(sale.id)} className="btn-ghost" style={{ padding: 4 }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="only-mobile" style={{ padding: '0.75rem' }}>
            {periodSales.slice(0, 30).map((sale: any) => (
              <div key={sale.id} className="mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#fbbf24' }}>{sale.plate}</span>
                  <span style={{ fontWeight: 800, color: '#6ee7b7' }}>{formatCurrency(sale.amount)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                  {VEHICLE_ICONS[sale.vehicleType]} {sale.serviceName}
                  {Array.isArray(sale.ppfPanels) && sale.ppfPanels.length > 0 && (
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24' }}>🎯 {sale.ppfPanels.length}</span>
                  )}
                </div>
                {sale.note && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.75rem' }}>💬 {sale.note}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', background: sale.paymentStatus === 'ödendi' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: sale.paymentStatus === 'ödendi' ? '#10b981' : '#ef4444' }}>{sale.paymentStatus?.toUpperCase() || 'ÖDENMEDİ'}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => setPayingSale(sale)} className="btn-secondary" style={{ padding: '0.4rem' }}>💳</button>
                    <button onClick={() => setEditingSale({ ...sale })} className="btn-secondary" style={{ padding: '0.4rem' }}>✏️</button>
                    <button onClick={() => deleteSale(sale.id)} className="btn-danger" style={{ padding: '0.4rem' }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payingSale && (
        <div className="modal-backdrop">
          <div className="card animate-fade-in-up" style={{ width: '100%', maxWidth: 450, background: '#0f172a' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid rgba(71,85,105,0.2)', paddingBottom: '0.5rem' }}>💳 Ödeme: {payingSale.plate}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(15,23,42,0.6)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tutar:</span><span>{formatCurrency(payingSale.amount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', fontWeight: 700, marginTop: 4 }}><span>Kalan:</span><span>{formatCurrency(payingSale.amount - (payingSale.paymentAmount || 0))}</span></div>
              </div>
              <input type="number" className="input-base" value={paymentInput} onChange={e => setPaymentInput(e.target.value)} placeholder="Alınan ödeme..." style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPayingSale(null)}>İptal</button>
                <button className="btn-primary" style={{ flex: 1, background: '#10b981' }} onClick={() => {
                  const added = parseFloat(paymentInput) || 0;
                  const total = (payingSale.paymentAmount || 0) + added;
                  let st: any = 'ödenmedi';
                  if (total >= payingSale.amount) st = 'ödendi'; else if (total > 0) st = 'kısmi ödeme';
                  updateSale(payingSale.id, { paymentAmount: total, paymentStatus: st } as any);
                  setPayingSale(null);
                }}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSale && (() => {
        const editService = services.find(s => s.id === editingSale.serviceId);
        const isEditPpf = editService?.isPpf ?? (editingSale.serviceName?.toLowerCase().includes('ppf') ?? false);
        const editPanels: string[] = Array.isArray(editingSale.ppfPanels) ? editingSale.ppfPanels : [];
        return (
        <div className="modal-backdrop">
          <div className="card animate-fade-in-up" style={{ width: '100%', maxWidth: 450, background: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>✏️ Düzenle: {editingSale.plate}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label className="label">Ödenen (₺)</label><input type="number" className="input-base" value={editingSale.paymentAmount || 0} onChange={e => setEditingSale({ ...editingSale, paymentAmount: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="label">Durum</label>
                  <select className="input-base" value={editingSale.paymentStatus || 'ödenmedi'} onChange={e => setEditingSale({ ...editingSale, paymentStatus: e.target.value })}>
                    <option value="ödenmedi">Ödenmedi</option><option value="kısmi ödeme">Kısmi Ödeme</option><option value="ödendi">Ödendi</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Not</label><textarea className="input-base" value={editingSale.note || ''} onChange={e => setEditingSale({ ...editingSale, note: e.target.value })} rows={2} /></div>
              {isEditPpf && (
                <div>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🎯 Kaplanan Kaporta Parçaları</span>
                  </label>
                  <CarBodyDiagram
                    value={editPanels}
                    onChange={(ids) => setEditingSale({ ...editingSale, ppfPanels: ids })}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditingSale(null)}>İptal</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                  updateSale(editingSale.id, {
                    amount: editingSale.amount,
                    note: editingSale.note,
                    paymentAmount: editingSale.paymentAmount,
                    paymentStatus: editingSale.paymentStatus,
                    ...(isEditPpf ? { ppfPanels: editingSale.ppfPanels ?? [] } : {}),
                  } as any);
                  setEditingSale(null);
                }}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      <style>{`
        @media (max-width: 900px) { .sales-grid { grid-template-columns: 1fr !important; } }
        .sales-table th, .sales-table td { padding: 0.5rem 0.75rem !important; font-size: 0.8rem; white-space: nowrap; }
      `}</style>
    </div>
  );
}
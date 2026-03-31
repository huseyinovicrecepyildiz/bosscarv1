// Plate validation: Turkish format e.g. 34ABC123, 06A1234, 35AB456
export function validatePlate(plate: string): string | null {
  const cleaned = plate.toUpperCase().replace(/\s/g, '');
  const regex = /^(0[1-9]|[1-7][0-9]|8[01])[A-Z]{1,3}[0-9]{2,4}$/;
  if (!cleaned) return 'Plaka zorunludur.';
  if (!regex.test(cleaned)) return 'Geçerli bir Türk plakası giriniz. Örn: 34ABC123';
  return null;
}

export function validatePrice(value: string): string | null {
  if (!value) return 'Fiyat zorunludur.';
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return 'Geçerli bir tutar giriniz.';
  if (n > 1000000) return 'Tutar çok yüksek.';
  return null;
}

export function validateName(value: string): string | null {
  if (!value || value.trim().length < 2) return 'Ad Soyad en az 2 karakter olmalıdır.';
  return null;
}

export function validateLoginId(value: string): string | null {
  if (!value || value.trim().length === 0) return 'Kullanıcı ID zorunludur.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value || value.length < 6) return 'Şifre en az 6 karakter olmalıdır.';
  return null;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

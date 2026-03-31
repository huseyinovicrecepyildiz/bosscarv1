import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Boss Car ERP | Araç Temizlik Yönetim Sistemi',
  description: 'Boss Car araç temizlik dükkanı için profesyonel ERP yönetim sistemi. Satış, hizmet, gider ve personel yönetimi.',
  keywords: 'araç yıkama, oto kuaför, ERP, yönetim sistemi, boss car',
  authors: [{ name: 'Boss Car' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

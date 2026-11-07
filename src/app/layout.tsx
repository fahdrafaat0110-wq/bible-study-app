
import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'دراسة الكتاب المقدس',
  description: 'إدارة الحضور وقراءة الإنجيل والنوتة الروحية',
  manifest: '/manifest.json',
};

export const viewport = 'width=device-width,initial-scale=1,theme-color=#2563EB';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

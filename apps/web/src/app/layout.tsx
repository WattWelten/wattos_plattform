import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WattWeiser - KI-Plattform',
  description: 'Modulare, DSGVO-konforme KI-Plattform für Unternehmen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

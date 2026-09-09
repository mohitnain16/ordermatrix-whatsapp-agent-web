import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ordermatrix — WhatsApp Agent Admin',
  description: 'Admin dashboard for the Ordermatrix WhatsApp AI agent',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

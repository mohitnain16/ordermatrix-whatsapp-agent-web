import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ordermatrix — WhatsApp Agent Admin',
  description: 'Admin dashboard for the Ordermatrix WhatsApp AI agent',
};

// Runs before paint to prevent flash of wrong theme
const themeScript = `(function(){try{var m=localStorage.getItem('om-theme');if(!m)m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-mode',m);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

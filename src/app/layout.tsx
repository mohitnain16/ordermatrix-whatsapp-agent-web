import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ordermatrix — WhatsApp Agent Admin',
  description: 'Admin dashboard for the Ordermatrix WhatsApp AI agent',
};

// Runs synchronously before paint — sets data-mode and registers a live
// OS-preference listener so changing system theme while the tab is open works.
const themeScript = `(function(){
  try{
    var KEY='om-theme';
    function apply(m){document.documentElement.setAttribute('data-mode',m);}
    var stored=localStorage.getItem(KEY);
    apply(stored||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){
      if(!localStorage.getItem(KEY))apply(e.matches?'dark':'light');
    });
  }catch(e){}
})();`;

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

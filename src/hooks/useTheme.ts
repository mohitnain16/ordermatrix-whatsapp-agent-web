'use client';
import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark';

export function useTheme() {
  const [mode, setMode] = useState<Mode>('light');

  useEffect(() => {
    // Read the value already set by the anti-flash inline script
    const attr = document.documentElement.getAttribute('data-mode') as Mode | null;
    if (attr === 'dark' || attr === 'light') {
      setMode(attr);
    }
  }, []);

  function toggle() {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    document.documentElement.setAttribute('data-mode', next);
    try { localStorage.setItem('om-theme', next); } catch (_) {}
  }

  return { mode, toggle };
}

'use client';
import { useCallback, useEffect, useState } from 'react';

type Mode = 'light' | 'dark';
const KEY = 'om-theme';

function getSystemMode(): Mode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  // Start with whatever the inline script already set — avoids a wrong-icon flash.
  // Initialise to 'light' on the server (no DOM), sync immediately on mount.
  const [mode, setMode] = useState<Mode>('light');

  useEffect(() => {
    // Sync with whatever the blocking inline script put on <html>
    const attr = document.documentElement.getAttribute('data-mode') as Mode | null;
    if (attr === 'dark' || attr === 'light') setMode(attr);

    // Follow OS preference changes live — only when the user has no stored choice
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onSystemChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem(KEY)) {
        // data-mode is already updated by the inline script's own listener;
        // we only need to sync React state here.
        setMode(e.matches ? 'dark' : 'light');
      }
    }
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  const toggle = useCallback(() => {
    // If currently following system, resolve what system currently is
    // so the toggle flips relative to what the user actually sees.
    const current: Mode =
      (document.documentElement.getAttribute('data-mode') as Mode | null) ??
      getSystemMode();
    const next: Mode = current === 'dark' ? 'light' : 'dark';
    setMode(next);
    document.documentElement.setAttribute('data-mode', next);
    try { localStorage.setItem(KEY, next); } catch (_) {}
  }, []);

  // Expose a way to clear the stored preference and go back to following the OS.
  const resetToSystem = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch (_) {}
    const system = getSystemMode();
    setMode(system);
    document.documentElement.setAttribute('data-mode', system);
  }, []);

  return { mode, toggle, resetToSystem };
}

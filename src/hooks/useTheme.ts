'use client';
import { useCallback, useEffect, useState } from 'react';

export type Mode = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

const KEY = 'om-theme';

function getSystemMode(): Mode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch (_) {}
  return 'system';
}

export function useTheme() {
  const [mode, setMode] = useState<Mode>('light');
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    // Sync both states from what the blocking inline script already set on <html>
    const stored = readStoredPreference();
    setPreferenceState(stored);
    const attr = document.documentElement.getAttribute('data-mode') as Mode | null;
    if (attr === 'dark' || attr === 'light') setMode(attr);

    // Live OS-preference tracking — only fires when no explicit stored value
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onSystemChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem(KEY)) {
        // data-mode is already updated by the inline script's own listener
        setMode(e.matches ? 'dark' : 'light');
      }
    }
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  // 3-way setter used by the Settings segmented control
  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    if (pref === 'system') {
      try { localStorage.removeItem(KEY); } catch (_) {}
      const system = getSystemMode();
      setMode(system);
      document.documentElement.setAttribute('data-mode', system);
    } else {
      setMode(pref);
      document.documentElement.setAttribute('data-mode', pref);
      try { localStorage.setItem(KEY, pref); } catch (_) {}
    }
  }, []);

  // Simple 2-state toggle for the topbar icon — always writes an explicit value
  const toggle = useCallback(() => {
    const current: Mode =
      (document.documentElement.getAttribute('data-mode') as Mode | null) ?? getSystemMode();
    const next: Mode = current === 'dark' ? 'light' : 'dark';
    setMode(next);
    setPreferenceState(next);
    document.documentElement.setAttribute('data-mode', next);
    try { localStorage.setItem(KEY, next); } catch (_) {}
  }, []);

  return { mode, preference, toggle, setPreference };
}

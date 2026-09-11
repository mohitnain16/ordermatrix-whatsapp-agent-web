'use client';
import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/useTheme';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const label = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button className={styles.btn} onClick={toggle} title={label} aria-label={label}>
      {mode === 'dark'
        ? <Sun size={16} weight="regular" />
        : <Moon size={16} weight="regular" />
      }
    </button>
  );
}

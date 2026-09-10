'use client';
import styles from './CustomerAvatar.module.css';

// Deterministic 5-slot palette — keyed by sum of phone digits mod 5.
// Using CSS tokens so they automatically follow the design system.
const PALETTES = [
  { bg: 'var(--primary-soft)', color: 'var(--primary-deep)' }, // blue
  { bg: 'var(--accent-soft)',  color: 'var(--accent-deep)'  }, // orange
  { bg: 'var(--green-soft)',   color: 'var(--green)'        }, // green
  { bg: 'var(--amber-soft)',   color: 'var(--amber)'        }, // amber
  { bg: 'var(--surface-3)',    color: 'var(--ink-3)'        }, // neutral
] as const;

function paletteFor(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const sum = digits.split('').reduce((acc, d) => acc + Number(d), 0);
  return PALETTES[sum % PALETTES.length];
}

function initialsFor(name: string | undefined, phone: string): string {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n[0].toUpperCase();
  }
  // Fallback: last 2 digits of phone
  return phone.replace(/\D/g, '').slice(-2);
}

export interface CustomerAvatarProps {
  phone: string;
  name?: string;
  size?: number;    // px; default 36
  blocked?: boolean; // red tint for blocked customers
}

export function CustomerAvatar({ phone, name, size = 36, blocked = false }: CustomerAvatarProps) {
  const palette = blocked
    ? { bg: 'var(--red-soft)', color: 'var(--red)' }
    : paletteFor(phone);
  const initials = initialsFor(name, phone);
  const fontSize = Math.max(10, Math.round(size * 0.35));

  return (
    <div
      className={styles.avatar}
      style={{ width: size, height: size, background: palette.bg, color: palette.color, fontSize }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

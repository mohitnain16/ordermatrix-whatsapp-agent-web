import { clsx } from 'clsx';
import styles from './Badge.module.css';

type Color = 'green' | 'amber' | 'red' | 'blue' | 'accent' | 'neutral';

interface BadgeProps {
  color?: Color;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ color = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[color], className)}>
      {children}
    </span>
  );
}

interface CountBadgeProps {
  count: number;
}

export function CountBadge({ count }: CountBadgeProps) {
  if (count <= 0) return null;
  return (
    <span className={styles.count}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

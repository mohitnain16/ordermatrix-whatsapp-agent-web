'use client';
import { clsx } from 'clsx';
import styles from './Button.module.css';

type Variant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(styles.btn, styles[variant], styles[size], loading && styles.loading, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}

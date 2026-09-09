import { formatDateSeparator } from '@/lib/utils';
import styles from './DateSeparator.module.css';

interface DateSeparatorProps {
  iso: string;
}

export function DateSeparator({ iso }: DateSeparatorProps) {
  return (
    <div className={styles.separator}>
      <span className={styles.label}>{formatDateSeparator(iso)}</span>
    </div>
  );
}

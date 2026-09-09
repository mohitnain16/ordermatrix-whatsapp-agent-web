import { clsx } from 'clsx';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  circle?: boolean;
}

export function Skeleton({ width, height, className, circle }: SkeletonProps) {
  return (
    <span
      className={clsx(styles.skeleton, circle && styles.circle, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function ConversationRowSkeleton() {
  return (
    <div className={styles.rowSkeleton}>
      <Skeleton circle width={36} height={36} />
      <div className={styles.rowText}>
        <div className={styles.rowLine}>
          <Skeleton width="55%" height={13} />
          <Skeleton width={32} height={10} />
        </div>
        <Skeleton width="80%" height={11} />
      </div>
    </div>
  );
}

export function MessageSkeleton({ align }: { align: 'left' | 'right' }) {
  return (
    <div className={clsx(styles.msgSkeleton, align === 'right' && styles.msgRight)}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={14} />
    </div>
  );
}

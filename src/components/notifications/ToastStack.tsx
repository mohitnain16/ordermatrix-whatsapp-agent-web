'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from '@phosphor-icons/react';
import { formatPhone, truncate } from '@/lib/utils';
import type { Toast } from '@/context/NotificationContext';
import { useNotification } from '@/context/NotificationContext';
import styles from './ToastStack.module.css';

const TOAST_TTL_MS = 6000;

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useNotification();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => dismissToast(toast.id), TOAST_TTL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, dismissToast]);

  function handleClick() {
    dismissToast(toast.id);
    router.push(`/conversations/${encodeURIComponent(toast.conversationPhone)}`);
  }

  return (
    <div className={styles.toast} role="alert">
      <button className={styles.toastBody} onClick={handleClick} tabIndex={0}>
        <span className={styles.toastPhone}>{formatPhone(toast.phone)}</span>
        <span className={styles.toastContent}>{truncate(toast.content, 80)}</span>
      </button>
      <button
        className={styles.toastClose}
        onClick={e => { e.stopPropagation(); dismissToast(toast.id); }}
        aria-label="Dismiss"
      >
        <X size={12} weight="bold" />
      </button>
    </div>
  );
}

export function ToastStack() {
  const { toasts } = useNotification();
  if (toasts.length === 0) return null;

  return (
    <div className={styles.stack} aria-live="polite" aria-label="Notifications">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}

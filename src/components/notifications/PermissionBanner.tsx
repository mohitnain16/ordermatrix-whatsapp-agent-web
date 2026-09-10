'use client';
import { useEffect, useState } from 'react';
import { Bell, X } from '@phosphor-icons/react';
import { useNotification } from '@/context/NotificationContext';
import styles from './PermissionBanner.module.css';

const DISMISSED_KEY = 'om_notif_dismissed';

export function PermissionBanner() {
  const { permission, requestPermission } = useNotification();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if the browser supports it and permission hasn't been decided yet.
    if (permission !== 'default') return;
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISSED_KEY) === '1') return;

    // Delay the prompt so it appears after the user has settled in, not on landing.
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [permission]);

  // If the user grants or denies permission from the system prompt, hide the banner.
  useEffect(() => {
    if (permission !== 'default') setVisible(false);
  }, [permission]);

  function handleEnable() {
    setVisible(false);
    requestPermission();
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  }

  if (!visible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-label="Enable notifications">
      <Bell size={14} className={styles.icon} weight="duotone" />
      <span className={styles.text}>
        Get notified when customers send messages, even if this tab is in the background.
      </span>
      <button className={styles.enableBtn} onClick={handleEnable}>
        Enable
      </button>
      <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Dismiss">
        <X size={12} weight="bold" />
      </button>
    </div>
  );
}

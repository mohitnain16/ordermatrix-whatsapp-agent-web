'use client';
import { useRouter } from 'next/navigation';
import { SignOut } from '@phosphor-icons/react';
import { TenantSwitcher } from './TenantSwitcher';
import { useSocket } from '@/context/SocketContext';
import styles from './Topbar.module.css';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const { socket, connected } = useSocket();

  // Only show the indicator once the socket has been initialised (socket != null)
  // but is currently disconnected — so we never alarm users before the first connect.
  const showDisconnected = socket !== null && !connected;

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {/* Logo shown on mobile (sidebar hidden); invisible on desktop */}
        <span className={styles.mobileLogo}>OM</span>
        {title && <h1 className={styles.title}>{title}</h1>}
      </div>
      <div className={styles.right}>
        {showDisconnected && (
          <span className={styles.reconnecting} title="Live updates paused — reconnecting…">
            Reconnecting
          </span>
        )}
        <TenantSwitcher />
        <button className={styles.logout} onClick={handleLogout} title="Sign out">
          <SignOut size={16} />
        </button>
      </div>
    </header>
  );
}

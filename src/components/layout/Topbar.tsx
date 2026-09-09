'use client';
import { useRouter } from 'next/navigation';
import { SignOut } from '@phosphor-icons/react';
import { TenantSwitcher } from './TenantSwitcher';
import styles from './Topbar.module.css';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {title && <h1 className={styles.title}>{title}</h1>}
      </div>
      <div className={styles.right}>
        <TenantSwitcher />
        <button className={styles.logout} onClick={handleLogout} title="Sign out">
          <SignOut size={16} />
        </button>
      </div>
    </header>
  );
}

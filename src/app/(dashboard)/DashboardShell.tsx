'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import { TenantProvider } from '@/context/TenantContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import styles from './DashboardShell.module.css';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TenantProvider>
      <div className={clsx(styles.shell, collapsed && styles.collapsed)}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <div className={styles.main}>
          <Topbar />
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </TenantProvider>
  );
}

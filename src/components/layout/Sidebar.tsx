'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChatCircleText,
  CreditCard,
  Package,
  Gear,
  ArrowLineLeft,
  ArrowLineRight,
} from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { CountBadge } from '@/components/ui/Badge';
import styles from './Sidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  pendingFlags?: number;
}

export function Sidebar({ collapsed, onToggle, pendingFlags = 0 }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/conversations', label: 'Conversations', icon: ChatCircleText },
    { href: '/payment-flags', label: 'Payment Flags', icon: CreditCard, badge: pendingFlags },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/settings', label: 'Settings', icon: Gear },
  ];

  return (
    <aside className={clsx(styles.sidebar, collapsed && styles.collapsed)}>
      <div className={styles.logo}>
        {!collapsed && (
          <span className={styles.logoText}>
            <span className={styles.logoOM}>OM</span>
            <span className={styles.logoSub}>WhatsApp</span>
          </span>
        )}
        {collapsed && <span className={styles.logoIcon}>OM</span>}
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(styles.navItem, active && styles.active)}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} weight={active ? 'fill' : 'regular'} />
              {!collapsed && <span className={styles.navLabel}>{label}</span>}
              {!collapsed && badge != null && badge > 0 && <CountBadge count={badge} />}
              {collapsed && badge != null && badge > 0 && (
                <span className={styles.collapsedDot} />
              )}
            </Link>
          );
        })}
      </nav>

      <button
        className={styles.toggle}
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ArrowLineRight size={16} /> : <ArrowLineLeft size={16} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}

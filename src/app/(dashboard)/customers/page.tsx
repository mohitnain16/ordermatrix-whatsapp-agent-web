'use client';
import { useEffect, useState, useMemo } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import { formatPhone, formatDate } from '@/lib/utils';
import { CustomerProfilePanel } from '@/components/customers/CustomerProfilePanel';
import styles from './page.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerRow {
  _id: string;
  phone: string;
  name: string;
  tags: string[];
  isBlocked: boolean;
  lastActiveAt: string;
  conversationCount: number;
  totalMessages: number;
}

interface ListResponse {
  customers: CustomerRow[];
  total: number;
  limit: number;
  skip: number;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ phone, blocked }: { phone: string; blocked: boolean }) {
  const initials = phone.replace(/\D/g, '').slice(-2);
  return (
    <div className={clsx(styles.avatar, blocked && styles.avatarBlocked)}>
      {initials}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { activeTenant } = useTenant();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    setError('');
    api.get<ListResponse>('customers', {
      tenantId: activeTenant._id,
      limit: '100',
      skip: '0',
    })
      .then(({ customers, total }) => {
        setCustomers(customers);
        setTotal(total);
      })
      .catch(e => setError(e.message || 'Failed to load customers'))
      .finally(() => setLoading(false));
  }, [activeTenant?._id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q)),
    );
  }, [customers, search]);

  function openPanel(c: CustomerRow) {
    setSelectedId(c._id);
    setSelectedPhone(c.phone);
  }

  function closePanel() {
    setSelectedId(null);
    setSelectedPhone(null);
  }

  const displayCount = loading ? null : `${total} customer${total !== 1 ? 's' : ''}`;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Customers</h1>
          {displayCount && <p className={styles.sub}>{displayCount}</p>}
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <MagnifyingGlass size={14} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search by name, phone, or tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Loading skeleton */}
      {loading && (
        <div className={styles.loading}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length === 0 && (
        <div className={styles.empty}>
          {search ? 'No customers match your search.' : 'No customers yet.'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Tags</th>
                <th className={styles.th}>Last active</th>
                <th className={clsx(styles.th, styles.thRight)}>Messages</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c._id}
                  className={clsx(styles.tr, c.isBlocked && styles.trBlocked)}
                  onClick={() => openPanel(c)}
                >
                  <td className={styles.td}>
                    <div className={styles.customerCell}>
                      <Avatar phone={c.phone} blocked={c.isBlocked} />
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>
                          {c.name || formatPhone(c.phone)}
                        </span>
                        <span className={styles.customerPhone}>
                          {formatPhone(c.phone)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {c.tags.length > 0 ? (
                      <div className={styles.tagPills}>
                        {c.tags.map(t => (
                          <span key={t} className={styles.tag}>{t}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td className={clsx(styles.td, styles.monoCell)}>
                    {formatDate(c.lastActiveAt)}
                  </td>
                  <td className={clsx(styles.td, styles.tdRight, styles.monoCell)}>
                    {c.totalMessages ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile panel */}
      {selectedId && selectedPhone && (
        <CustomerProfilePanel
          customerId={selectedId}
          phone={selectedPhone}
          onClose={closePanel}
        />
      )}
    </div>
  );
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { CaretDown } from '@phosphor-icons/react';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatPhone, formatCurrency } from '@/lib/utils';
import styles from './page.module.css';

interface PaymentFlag {
  _id: string;
  customerPhone: string;
  utr: string | null;
  amount: number | null;
  screenshotUrl: string | null;
  rawMessage: string;
  status: 'pending' | 'verified' | 'rejected';
  notes: string;
  createdAt: string;
}

type FilterStatus = 'all' | 'pending' | 'verified' | 'rejected';

const STATUS_COLORS: Record<PaymentFlag['status'], 'amber' | 'green' | 'neutral'> = {
  pending: 'amber',
  verified: 'green',
  rejected: 'neutral',
};

const STATUS_LABELS: Record<PaymentFlag['status'], string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
};

interface FlagRowProps {
  flag: PaymentFlag;
  onUpdate: (id: string, status: 'verified' | 'rejected', notes: string) => Promise<void>;
}

function FlagRow({ flag, onUpdate }: FlagRowProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(flag.notes || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState(false);

  async function handleAction(status: 'verified' | 'rejected') {
    setSaving(true);
    setSaveError('');
    setSaveOk(false);
    try {
      await onUpdate(flag._id, status, notes);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  const rowClass = clsx(
    styles.row,
    flag.status === 'pending' && styles.rowPending,
    flag.status === 'verified' && styles.rowVerified,
    flag.status === 'rejected' && styles.rowRejected,
    open && styles.rowExpanded,
  );

  return (
    <div className={rowClass}>
      <div className={styles.rowSummary} onClick={() => setOpen(o => !o)} role="button" tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}
        aria-expanded={open}>
        <div className={styles.rowPhone}>{formatPhone(flag.customerPhone)}</div>
        <div className={styles.rowMeta}>
          {flag.amount != null && (
            <span className={styles.rowAmount}>{formatCurrency(flag.amount)}</span>
          )}
          {flag.utr && (
            <span className={styles.rowUtr}>UTR: {flag.utr}</span>
          )}
        </div>
        <div className={styles.rowRight}>
          <Badge color={STATUS_COLORS[flag.status]}>{STATUS_LABELS[flag.status]}</Badge>
          <span className={styles.rowDate}>{formatDate(flag.createdAt)}</span>
          <CaretDown size={14} className={clsx(styles.chevron, open && styles.chevronOpen)} />
        </div>
      </div>

      {open && (
        <div className={styles.detail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Customer</span>
              <span className={styles.detailValue}>{flag.customerPhone}</span>
            </div>
            {flag.utr && (
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>UTR / Ref No.</span>
                <span className={styles.detailValue}>{flag.utr}</span>
              </div>
            )}
            {flag.amount != null && (
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Amount</span>
                <span className={styles.detailValue}>{formatCurrency(flag.amount)}</span>
              </div>
            )}
            {flag.screenshotUrl && (
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Screenshot</span>
                <a
                  href={flag.screenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.screenshotLink}
                >
                  View screenshot →
                </a>
              </div>
            )}
            {flag.rawMessage && (
              <div className={`${styles.detailField}`} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.detailLabel}>Customer message</span>
                <span className={styles.detailValueText}>{flag.rawMessage}</span>
              </div>
            )}
          </div>

          {flag.status === 'pending' && (
            <>
              <textarea
                className={styles.notesArea}
                placeholder="Add verification notes (optional)…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
              <div className={styles.detailActions}>
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  onClick={() => handleAction('verified')}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={saving}
                  onClick={() => handleAction('rejected')}
                >
                  Reject
                </Button>
                {saveOk && <span className={styles.successPill}>Saved</span>}
                {saveError && <span className={styles.errorPill}>{saveError}</span>}
              </div>
            </>
          )}

          {flag.status !== 'pending' && flag.notes && (
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Notes</span>
              <span className={styles.detailValueText}>{flag.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
];

export default function PaymentFlagsPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [flags, setFlags] = useState<PaymentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('pending');

  const fetchFlags = useCallback(async (tenantId: string, status: FilterStatus) => {
    try {
      const data = await api.get<{ flags: PaymentFlag[] }>(
        `tenants/${tenantId}/payment-flags`,
        { status },
      );
      setFlags(data.flags);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    fetchFlags(activeTenant._id, filter);
  }, [activeTenant, filter, fetchFlags]);

  const handleUpdate = useCallback(async (
    flagId: string,
    status: 'verified' | 'rejected',
    notes: string,
  ) => {
    await api.patch(`payment-flags/${flagId}`, { status, notes });
    setFlags(prev => prev.map(f =>
      f._id === flagId ? { ...f, status, notes } : f,
    ));
  }, []);

  const counts = {
    all: flags.length,
    pending: flags.filter(f => f.status === 'pending').length,
    verified: flags.filter(f => f.status === 'verified').length,
    rejected: flags.filter(f => f.status === 'rejected').length,
  };

  if (tenantLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          {[1, 2, 3].map(i => <div key={i} className={styles.skeletonRow} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Payment Flags</h1>
          <p className={styles.sub}>UTR and amount claims awaiting verification</p>
        </div>

        <div className={styles.tabs}>
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              className={clsx(styles.tab, filter === value && styles.tabActive)}
              onClick={() => setFilter(value)}
            >
              {label}
              {value === 'pending' && counts.pending > 0 && (
                <span className={styles.tabCount}>{counts.pending}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>
          {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : flags.length === 0 ? (
        <div className={styles.empty}>
          No {filter === 'all' ? '' : filter + ' '}flags found.
        </div>
      ) : (
        <div className={styles.list}>
          {flags.map(flag => (
            <FlagRow key={flag._id} flag={flag} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

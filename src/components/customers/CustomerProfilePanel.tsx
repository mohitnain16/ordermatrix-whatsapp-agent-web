'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CustomerAvatar } from '@/components/ui/CustomerAvatar';
import { formatPhone } from '@/lib/utils';
import styles from './CustomerProfilePanel.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  _id: string;
  phone: string;
  name: string;
  preferredLanguage: string;
  tags: string[];
  notes: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomerStats {
  conversationCount: number;
  totalMessages: number;
  firstContact: string | null;
  lastContact: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAG_PRESETS = ['vip', 'flagged', 'repeat-customer', 'wholesale', 'new-customer'];

function formatAbsDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.statBlock}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export interface CustomerProfilePanelProps {
  customerId: string;
  phone: string;
  onClose: () => void;
}

export function CustomerProfilePanel({ customerId, phone, onClose }: CustomerProfilePanelProps) {
  const { activeTenant } = useTenant();
  const [visible, setVisible] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loadError, setLoadError] = useState('');

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagFocused, setTagFocused] = useState(false);

  // Notes state
  const [notes, setNotes] = useState('');
  const savedNotesRef = useRef('');
  const [notesSaveStatus, setNotesSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Block state
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockState, setBlockState] = useState<'idle' | 'confirming' | 'saving'>('idle');

  // Two-phase mount for transition
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Load customer profile
  useEffect(() => {
    if (!activeTenant) return;
    api.get<{ customer: Customer; stats: CustomerStats }>(
      `customers/${customerId}`,
      { tenantId: activeTenant._id },
    ).then(({ customer, stats }) => {
      setCustomer(customer);
      setStats(stats);
      setTags(customer.tags ?? []);
      setNotes(customer.notes ?? '');
      savedNotesRef.current = customer.notes ?? '';
      setIsBlocked(customer.isBlocked ?? false);
      setLoadError('');
    }).catch(e => {
      setLoadError(e instanceof Error ? e.message : 'Failed to load profile');
    });
  }, [customerId, activeTenant?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // ── PATCH helper ────────────────────────────────────────────────────────────
  const patch = useCallback(async (update: Record<string, unknown>) => {
    if (!activeTenant) return;
    await api.patch(
      `customers/${customerId}?tenantId=${encodeURIComponent(activeTenant._id)}`,
      update,
    );
  }, [customerId, activeTenant?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tags ────────────────────────────────────────────────────────────────────
  async function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed || tags.includes(trimmed)) return;
    const next = [...tags, trimmed];
    setTags(next);
    setTagInput('');
    try { await patch({ tags: next }); } catch { setTags(tags); }
  }

  async function removeTag(tag: string) {
    const next = tags.filter(t => t !== tag);
    setTags(next);
    try { await patch({ tags: next }); } catch { setTags(tags); }
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  // ── Notes autosave ──────────────────────────────────────────────────────────
  async function handleNotesBlur() {
    if (notes === savedNotesRef.current) return;
    setNotesSaveStatus('saving');
    try {
      await patch({ notes });
      savedNotesRef.current = notes;
      setNotesSaveStatus('saved');
      setTimeout(() => setNotesSaveStatus('idle'), 2000);
    } catch {
      setNotesSaveStatus('error');
    }
  }

  // ── Block toggle ─────────────────────────────────────────────────────────────
  async function handleToggleBlock(checked: boolean) {
    if (checked) {
      // Blocking — show confirm first
      setBlockState('confirming');
    } else {
      // Unblocking — immediate, no confirm
      setBlockState('saving');
      try {
        await patch({ isBlocked: false });
        setIsBlocked(false);
      } catch { /* ignore, toggle will snap back visually */ }
      setBlockState('idle');
    }
  }

  async function confirmBlock() {
    setBlockState('saving');
    try {
      await patch({ isBlocked: true });
      setIsBlocked(true);
    } catch { setIsBlocked(false); }
    setBlockState('idle');
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const displayName = customer?.name || formatPhone(phone);
  const availablePresets = TAG_PRESETS.filter(p => !tags.includes(p));

  const panelContent = (
    <>
      {/* Backdrop */}
      <div
        className={clsx(styles.backdrop, visible && styles.backdropVisible)}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div
        className={clsx(styles.panel, visible && styles.panelVisible)}
        role="dialog"
        aria-modal="true"
        aria-label="Customer profile"
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.avatarWrap}>
            <CustomerAvatar phone={phone} name={customer?.name} size={64} blocked={isBlocked} />
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.headerName}>{displayName}</div>
            <div className={styles.headerPhone}>{formatPhone(phone)}</div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close panel">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loadError && (
            <div className={styles.loadError}>{loadError}</div>
          )}

          {!customer && !loadError && (
            <div className={styles.skeleton}>
              {[40, 80, 24, 24, 32].map((h, i) => (
                <div key={i} className={styles.skeletonLine} style={{ height: h }} />
              ))}
            </div>
          )}

          {customer && (
            <>
              {/* Activity stats */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Activity</span>
                <div className={styles.statsRow}>
                  <StatBlock value={stats?.conversationCount ?? '—'} label="Conversations" />
                  <StatBlock value={stats?.totalMessages ?? '—'} label="Messages" />
                  <StatBlock value={formatAbsDate(stats?.firstContact ?? null)} label="First contact" />
                  <StatBlock value={formatAbsDate(stats?.lastContact ?? null)} label="Last contact" />
                </div>
              </div>

              {/* Tags */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Tags</span>
                <div className={styles.tagsWrap}>
                  {tags.length > 0 && (
                    <div className={styles.tagPills}>
                      {tags.map(tag => (
                        <span key={tag} className={styles.tagPill}>
                          {tag}
                          <button
                            className={styles.tagRemove}
                            onClick={() => removeTag(tag)}
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={styles.tagInputRow}>
                    <input
                      className={styles.tagInput}
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={onTagKeyDown}
                      onFocus={() => setTagFocused(true)}
                      onBlur={() => { setTagFocused(false); if (tagInput) addTag(tagInput); }}
                      placeholder="Add tag… (Enter to confirm)"
                    />
                    {(tagFocused || !tags.length) && availablePresets.length > 0 && (
                      <div className={styles.tagPresets}>
                        {availablePresets.map(p => (
                          <button
                            key={p}
                            className={styles.tagPreset}
                            onMouseDown={e => { e.preventDefault(); addTag(p); }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className={styles.section}>
                <div className={styles.notesHeader}>
                  <span className={styles.sectionLabel}>Internal notes</span>
                  <span className={clsx(
                    styles.notesSaveStatus,
                    notesSaveStatus === 'saved' && styles.notesSaveStatusSaved,
                    notesSaveStatus === 'error' && styles.notesSaveStatusError,
                  )}>
                    {notesSaveStatus === 'saving' ? 'Saving…' : notesSaveStatus === 'saved' ? 'Saved' : notesSaveStatus === 'error' ? 'Save failed' : ''}
                  </span>
                </div>
                <div className={styles.notesWrap}>
                  <textarea
                    className={styles.notesTextarea}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Notes about this customer (autosaved on exit)…"
                    rows={4}
                  />
                </div>
              </div>

              {/* Block toggle */}
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Status</span>

                {blockState === 'confirming' ? (
                  <div className={styles.blockConfirm}>
                    <p className={styles.blockConfirmText}>
                      Blocking this customer stops the AI from responding to their messages.
                    </p>
                    <div className={styles.blockConfirmActions}>
                      <Button size="sm" variant="ghost" onClick={() => setBlockState('idle')}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="danger" onClick={confirmBlock}>
                        Block customer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.blockRow}>
                    <div className={styles.blockInfo}>
                      <span className={styles.blockTitle}>
                        {isBlocked ? 'Customer is blocked' : 'Block customer'}
                      </span>
                      <span className={styles.blockDesc}>
                        {isBlocked
                          ? 'The AI will not respond to this customer\'s messages.'
                          : 'AI responses are active. Toggle to stop responding.'}
                      </span>
                    </div>
                    <label className={styles.toggle} aria-label="Block toggle">
                      <input
                        type="checkbox"
                        className={styles.toggleInput}
                        checked={isBlocked}
                        disabled={blockState === 'saving'}
                        onChange={e => handleToggleBlock(e.target.checked)}
                      />
                      <span className={styles.toggleTrack} />
                    </label>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(panelContent, document.body);
}

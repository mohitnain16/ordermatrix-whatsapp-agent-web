'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Bell, BellSlash, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { useTenant } from '@/context/TenantContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

interface BusinessInfo {
  displayName: string;
  address: string;
  gstin: string;
  socialHandles: { instagram: string; website: string };
  description: string;
  returnPolicy: string;
  shippingPolicy: string;
}

interface TenantDetail {
  _id: string;
  name: string;
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
  businessInfo: BusinessInfo;
  tone: string;
  rules: string[];
  active: boolean;
}

function maskId(id: string): string {
  if (!id) return '—';
  if (id.length <= 6) return id;
  return '•'.repeat(id.length - 4) + id.slice(-4);
}

const PERMISSION_LABELS: Record<string, string> = {
  granted: 'Granted — you will receive browser notifications',
  denied: 'Denied — enable in your browser site settings to receive notifications',
  default: 'Not yet requested',
  unsupported: 'Not supported in this browser',
};

export default function SettingsPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const { soundEnabled, setSoundEnabled, permission, requestPermission } = useNotification();
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [tone, setTone] = useState('friendly');
  const [rules, setRules] = useState<string[]>([]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadTenant = useCallback(async (tenantId: string) => {
    try {
      const data = await api.get<{ tenant: TenantDetail }>(`tenants/${tenantId}`);
      const t = data.tenant;
      setDetail(t);
      setName(t.name);
      setDisplayName(t.businessInfo?.displayName ?? '');
      setAddress(t.businessInfo?.address ?? '');
      setGstin(t.businessInfo?.gstin ?? '');
      setInstagram(t.businessInfo?.socialHandles?.instagram ?? '');
      setWebsite(t.businessInfo?.socialHandles?.website ?? '');
      setDescription(t.businessInfo?.description ?? '');
      setReturnPolicy(t.businessInfo?.returnPolicy ?? '');
      setShippingPolicy(t.businessInfo?.shippingPolicy ?? '');
      setTone(t.tone ?? 'friendly');
      setRules(t.rules ?? []);
      setFetchError('');
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    loadTenant(activeTenant._id);
  }, [activeTenant, loadTenant]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenant) return;
    setSaving(true);
    setSaveOk(false);
    setSaveError('');
    try {
      await api.patch(`tenants/${activeTenant._id}`, {
        name: name.trim(),
        businessInfo: {
          displayName: displayName.trim(),
          address: address.trim(),
          gstin: gstin.trim(),
          socialHandles: {
            instagram: instagram.trim(),
            website: website.trim(),
          },
          description: description.trim(),
          returnPolicy: returnPolicy.trim(),
          shippingPolicy: shippingPolicy.trim(),
        },
        tone,
        rules: rules.map(r => r.trim()).filter(Boolean),
      });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function addRule() {
    setRules(r => [...r, '']);
  }

  function updateRule(i: number, value: string) {
    setRules(r => r.map((v, idx) => idx === i ? value : v));
  }

  function removeRule(i: number) {
    setRules(r => r.filter((_, idx) => idx !== i));
  }

  if (tenantLoading || loading) {
    return (
      <div className={styles.page}>
        <div>
          <div className={styles.title}>Tenant Settings</div>
          <p className={styles.sub}>Business info, WhatsApp connection, and prompt configuration</p>
        </div>
        <div className={styles.skeletonSection} />
        <div className={styles.skeletonSection} style={{ height: 160 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Tenant Settings</h1>
        <p className={styles.sub}>Business info, WhatsApp connection, and prompt configuration</p>
      </div>

      {fetchError && <div className={styles.errorBanner}>{fetchError}</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Business Info ─────────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Business Information</span>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Internal name</label>
                <input
                  className={styles.formInput}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Internal identifier"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Display name</label>
                <input
                  className={styles.formInput}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Customer-facing name"
                  required
                />
              </div>

              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label className={styles.formLabel}>Address</label>
                <input
                  className={styles.formInput}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Business address"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>GSTIN</label>
                <input
                  className={styles.formInput}
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Instagram handle</label>
                <input
                  className={styles.formInput}
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  placeholder="@yourbrand"
                />
              </div>

              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label className={styles.formLabel}>Website</label>
                <input
                  className={styles.formInput}
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourbrand.com"
                />
              </div>

              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does your business do? The AI uses this to answer customer questions."
                  rows={3}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Return policy</label>
                <textarea
                  className={styles.formTextarea}
                  value={returnPolicy}
                  onChange={e => setReturnPolicy(e.target.value)}
                  placeholder="e.g. 7-day returns on unused items…"
                  rows={3}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Shipping policy</label>
                <textarea
                  className={styles.formTextarea}
                  value={shippingPolicy}
                  onChange={e => setShippingPolicy(e.target.value)}
                  placeholder="e.g. Ships within 2 days via courier…"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── WhatsApp Connection ────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>WhatsApp Connection</span>
            <span className={styles.sectionSub}>Read-only — contact support to change</span>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Phone number ID</label>
                <div className={styles.readonlyField}>
                  {detail ? maskId(detail.phoneNumberId) : '—'}
                </div>
                <p className={styles.fieldHint}>Partial — for verification only. Never shown in full.</p>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>WABA ID</label>
                <div className={styles.readonlyField}>
                  {detail ? maskId(detail.whatsappBusinessAccountId) : '—'}
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Access token</label>
                <div className={styles.readonlyField}>••••••••••••••••</div>
                <p className={styles.fieldHint}>Never displayed for security.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Configuration ───────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>AI Configuration</span>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.formField} style={{ maxWidth: 240 }}>
              <label className={styles.formLabel}>Response tone</label>
              <select
                className={styles.formSelect}
                value={tone}
                onChange={e => setTone(e.target.value)}
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Behaviour rules</label>
              <p className={styles.fieldHint} style={{ marginBottom: 8, marginTop: 0 }}>
                Instructions the AI follows in every conversation. Be specific.
              </p>
              <div className={styles.rulesList}>
                {rules.map((rule, i) => (
                  <div key={i} className={styles.ruleRow}>
                    <input
                      className={styles.ruleInput}
                      value={rule}
                      onChange={e => updateRule(i, e.target.value)}
                      placeholder={`Rule ${i + 1}…`}
                    />
                    <button
                      type="button"
                      className={styles.ruleRemove}
                      onClick={() => removeRule(i)}
                      aria-label="Remove rule"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button type="button" className={styles.addRuleBtn} onClick={addRule}>
                  <Plus size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Add rule
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Notifications</span>
          </div>
          <div className={styles.sectionBody}>
            {/* Sound toggle */}
            <div className={styles.notifRow}>
              <div>
                <div className={styles.notifLabel}>Notification sound</div>
                <div className={styles.notifSub}>
                  Play a short sound when a new customer message arrives and you are not viewing that conversation.
                </div>
              </div>
              <button
                type="button"
                className={clsx(styles.toggleBtn, soundEnabled && styles.toggleBtnOn)}
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <SpeakerHigh size={15} weight="fill" /> : <SpeakerSlash size={15} />}
                <span>{soundEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>

            {/* Browser notification permission */}
            <div className={styles.notifRow}>
              <div>
                <div className={styles.notifLabel}>Browser notifications</div>
                <div className={styles.notifSub}>
                  {PERMISSION_LABELS[permission] ?? permission}
                </div>
              </div>
              {permission === 'default' && (
                <button
                  type="button"
                  className={clsx(styles.toggleBtn, styles.toggleBtnOn)}
                  onClick={requestPermission}
                >
                  <Bell size={14} />
                  <span>Enable</span>
                </button>
              )}
              {permission === 'granted' && (
                <span className={styles.permGranted}>
                  <Bell size={14} weight="fill" /> Active
                </span>
              )}
              {permission === 'denied' && (
                <span className={styles.permDenied}>
                  <BellSlash size={14} /> Blocked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Save ─────────────────────────────────────────────────────── */}
        <div className={styles.saveRow}>
          <Button type="submit" variant="primary" loading={saving}>
            Save changes
          </Button>
          {saveOk && <span className={styles.saveSuccess}>Saved</span>}
          {saveError && <span className={styles.saveError}>{saveError}</span>}
        </div>
      </form>
    </div>
  );
}

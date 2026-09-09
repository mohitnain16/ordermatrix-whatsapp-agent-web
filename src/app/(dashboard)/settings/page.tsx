import styles from '../payment-flags/page.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tenant Settings</h1>
        <p className={styles.sub}>Business info, WhatsApp connection, and prompt overrides</p>
      </div>
      <div className={styles.placeholder}>
        <p>Tenant settings — coming in V4.</p>
      </div>
    </div>
  );
}

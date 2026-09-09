import styles from './page.module.css';

export default function PaymentFlagsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payment Flags</h1>
        <p className={styles.sub}>Pending UTR/amount claims awaiting verification</p>
      </div>
      <div className={styles.placeholder}>
        <p>Payment flags queue — coming in V2.</p>
      </div>
    </div>
  );
}

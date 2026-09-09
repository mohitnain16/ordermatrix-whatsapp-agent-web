import styles from '../payment-flags/page.module.css';

export default function ProductsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>
        <p className={styles.sub}>Manage product pricing data for the AI pricing tool</p>
      </div>
      <div className={styles.placeholder}>
        <p>Products CRUD — coming in V3.</p>
      </div>
    </div>
  );
}

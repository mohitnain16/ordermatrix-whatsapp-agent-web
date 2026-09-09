'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/conversations');
      } else {
        setError('Invalid password. Try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandOM}>OM</span>
          <span className={styles.brandName}>WhatsApp Agent</span>
          <span className={styles.brandSub}>Admin Dashboard</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Admin password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Enter your admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" loading={loading} className={styles.submit}>
            Sign in
          </Button>
        </form>

        <p className={styles.footer}>
          Ordermatrix &middot; Internal use only
        </p>
      </div>
    </div>
  );
}

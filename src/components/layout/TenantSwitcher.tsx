'use client';
import { useState, useRef, useEffect } from 'react';
import { Buildings, CaretUpDown } from '@phosphor-icons/react';
import { useTenant } from '@/context/TenantContext';
import styles from './TenantSwitcher.module.css';

export function TenantSwitcher() {
  const { tenants, activeTenant, setActiveTenant } = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (tenants.length <= 1) {
    return (
      <div className={styles.single}>
        <Buildings size={14} weight="fill" />
        <span>{activeTenant?.name ?? 'Loading...'}</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <Buildings size={14} weight="fill" />
        <span>{activeTenant?.name ?? 'Select tenant'}</span>
        <CaretUpDown size={12} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          {tenants.map(t => (
            <button
              key={t._id}
              className={styles.option}
              data-active={t._id === activeTenant?._id}
              onClick={() => { setActiveTenant(t); setOpen(false); }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

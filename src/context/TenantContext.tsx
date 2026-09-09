'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Tenant {
  _id: string;
  name: string;
  slug: string;
}

interface TenantContextValue {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  setActiveTenant: (t: Tenant) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenants: [],
  activeTenant: null,
  setActiveTenant: () => {},
  loading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ tenants: Tenant[] }>('tenants')
      .then(({ tenants }) => {
        setTenants(tenants);
        const saved = typeof window !== 'undefined' ? localStorage.getItem('om_wab_tenant') : null;
        const initial = saved
          ? tenants.find(t => t._id === saved) ?? tenants[0]
          : tenants[0];
        if (initial) setActiveTenantState(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setActiveTenant = useCallback((t: Tenant) => {
    setActiveTenantState(t);
    localStorage.setItem('om_wab_tenant', t._id);
  }, []);

  return (
    <TenantContext.Provider value={{ tenants, activeTenant, setActiveTenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);

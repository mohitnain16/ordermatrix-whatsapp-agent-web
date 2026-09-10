'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import { ConversationRow, type ConversationPreview } from './ConversationRow';
import { ConversationRowSkeleton } from '@/components/ui/Skeleton';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  activePhone?: string;
}

export function ConversationList({ activePhone }: ConversationListProps) {
  const { activeTenant } = useTenant();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const fetchConversations = useCallback(() => {
    if (!activeTenant) return;
    api.get<{ conversations: ConversationPreview[] }>('conversations', {
      tenantId: activeTenant._id,
      limit: 50,
    })
      .then(({ conversations }) => setConversations(conversations))
      .catch(() => {});
  }, [activeTenant?._id]);

  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    api.get<{ conversations: ConversationPreview[] }>('conversations', {
      tenantId: activeTenant._id,
      limit: 50,
    })
      .then(({ conversations }) => setConversations(conversations))
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [activeTenant?._id, fetchConversations]);

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase().replace(/\D/g, '');
    return conversations.filter(c =>
      c.customerPhone.replace(/\D/g, '').includes(q)
    );
  }, [conversations, query]);

  return (
    <div className={styles.list}>
      <div className={styles.search}>
        <MagnifyingGlass size={14} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search by phone"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      <div className={styles.rows}>
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <ConversationRowSkeleton key={i} />
        ))}
        {!loading && filtered.length === 0 && (
          <p className={styles.empty}>
            {query ? 'No matches found.' : 'No conversations yet.'}
          </p>
        )}
        {!loading && filtered.map(c => (
          <ConversationRow
            key={c._id}
            conversation={c}
            active={c.customerPhone === activePhone}
          />
        ))}
      </div>
    </div>
  );
}

'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { ConversationRow, type ConversationPreview } from './ConversationRow';
import { ConversationRowSkeleton } from '@/components/ui/Skeleton';
import type { MessageData } from './Message';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  activePhone?: string;
}

export function ConversationList({ activePhone }: ConversationListProps) {
  const { activeTenant } = useTenant();
  const { socket, connected } = useSocket();
  const { setUnreadBulk } = useNotification();
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

  // Initial load (REST) on tenant change.
  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    api.get<{ conversations: ConversationPreview[] }>('conversations', {
      tenantId: activeTenant._id,
      limit: 50,
    })
      .then(({ conversations }) => {
        setConversations(conversations);
        // Seed the global unread map so the tab title is correct from first load.
        setUnreadBulk(conversations.map(c => ({ id: c._id, count: c.unreadCount ?? 0 })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTenant?._id, setUnreadBulk]);

  // Socket: live updates for conversation list.
  useEffect(() => {
    if (!socket) return;

    function onConversationUpdated(data: ConversationPreview) {
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === data._id);
        if (idx === -1) {
          // Unknown conversation — do a full refetch to get all fields.
          fetchConversations();
          return prev;
        }
        const updated = { ...prev[idx], ...data };
        // Bump updated conversation to the top (sorted by lastMessageAt desc).
        return [updated, ...prev.filter(c => c._id !== data._id)];
      });
    }

    function onMessageNew(event: { conversationId: string; message: MessageData }) {
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === event.conversationId);
        if (idx === -1) {
          fetchConversations();
          return prev;
        }
        const updated: ConversationPreview = {
          ...prev[idx],
          lastMessageAt: event.message.timestamp,
          lastMessage: event.message.content,
          role: event.message.direction === 'inbound' ? 'user' : 'assistant',
        };
        return [updated, ...prev.filter(c => c._id !== event.conversationId)];
      });
    }

    socket.on('conversation:updated', onConversationUpdated);
    socket.on('message:new', onMessageNew);
    return () => {
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('message:new', onMessageNew);
    };
  }, [socket, fetchConversations]);

  // Fallback: slow poll when socket is disconnected.
  useEffect(() => {
    if (connected || !activeTenant) return;
    const interval = setInterval(fetchConversations, 30_000);
    return () => clearInterval(interval);
  }, [connected, activeTenant?._id, fetchConversations]);

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

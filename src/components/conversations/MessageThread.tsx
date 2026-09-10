'use client';
import { useEffect, useRef, useState } from 'react';
import { UserCircle } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import { formatPhone } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { CustomerProfilePanel } from '@/components/customers/CustomerProfilePanel';
import { Message, type MessageData } from './Message';
import { DateSeparator } from './DateSeparator';
import { MessageSkeleton } from '@/components/ui/Skeleton';
import type { ConversationPreview } from './ConversationRow';
import styles from './MessageThread.module.css';

interface MessageThreadProps {
  phone: string;
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function MessageThread({ phone }: MessageThreadProps) {
  const { activeTenant } = useTenant();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Step 1: resolve phone → conversationId (and customerId), then load messages
  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    setConversationId(null);
    setCustomerId(null);
    setMessages([]);

    api.get<{ conversations: ConversationPreview[] }>('conversations', {
      tenantId: activeTenant._id,
      customerPhone: phone,
    })
      .then(({ conversations }) => {
        const conv = conversations[0];
        if (!conv) throw new Error('Conversation not found');
        setConversationId(conv._id);
        if (conv.customerId) setCustomerId(conv.customerId);
        return api.get<{ messages: MessageData[] }>(`conversations/${conv._id}/messages`, {
          tenantId: activeTenant._id,
        });
      })
      .then(({ messages }) => setMessages(messages))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone, activeTenant?._id]);

  // Step 2: poll messages every 5s once conversationId is known
  useEffect(() => {
    if (!conversationId || !activeTenant) return;
    const interval = setInterval(() => {
      api.get<{ messages: MessageData[] }>(`conversations/${conversationId}/messages`, {
        tenantId: activeTenant._id,
      })
        .then(({ messages }) => setMessages(messages))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId, activeTenant?._id]);

  // Clear reply state when switching conversations
  useEffect(() => {
    setReplyText('');
    setSendError(null);
    setShowProfile(false);
  }, [phone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  async function handleSend() {
    const text = replyText.trim();
    if (!text || !activeTenant || sending) return;

    setSending(true);
    setSendError(null);

    const optimistic: MessageData = {
      direction: 'outbound',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setReplyText('');

    try {
      await api.post('reply', { phone, tenantId: activeTenant._id, message: text });
    } catch (e) {
      setSendError((e as Error).message);
      setMessages(prev => prev.filter(m => m !== optimistic));
      setReplyText(text);
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const formattedPhone = formatPhone(phone);

  return (
    <div className={styles.thread}>
      <div className={styles.header}>
        <span className={styles.phone}>{formattedPhone}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={styles.count}>
            {!loading && `${messages.length} messages`}
          </span>
          {customerId && (
            <button
              className={styles.profileBtn}
              onClick={() => setShowProfile(true)}
              aria-label="View customer profile"
              title="Customer profile"
            >
              <UserCircle size={18} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.messages}>
        {loading && (
          <>
            <MessageSkeleton align="left" />
            <MessageSkeleton align="right" />
            <MessageSkeleton align="left" />
            <MessageSkeleton align="right" />
            <MessageSkeleton align="right" />
          </>
        )}

        {!loading && error && (
          <div className={styles.error}>
            <p>Failed to load messages: {error}</p>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className={styles.emptyThread}>
            <p>No messages in this conversation.</p>
          </div>
        )}

        {!loading && !error && messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showSeparator = !prev || !isSameDay(msg.timestamp, prev.timestamp);
          const isLast = i === messages.length - 1;
          return (
            <div key={msg._id ?? i}>
              {showSeparator && <DateSeparator iso={msg.timestamp} />}
              <Message message={msg} isLast={isLast} />
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className={styles.replyBar}>
        {sendError && (
          <p className={styles.sendError}>{sendError}</p>
        )}
        <div className={styles.replyRow}>
          <textarea
            ref={inputRef}
            className={styles.replyInput}
            placeholder="Type a message… (Enter to send)"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending || loading}
            aria-label="Reply message"
          />
          <Button
            size="sm"
            loading={sending}
            disabled={!replyText.trim() || loading}
            onClick={handleSend}
          >
            Send
          </Button>
        </div>
      </div>

      {showProfile && customerId && (
        <CustomerProfilePanel
          customerId={customerId}
          phone={phone}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

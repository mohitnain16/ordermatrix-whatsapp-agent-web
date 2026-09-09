'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import { formatPhone } from '@/lib/utils';
import { Message, type MessageData } from './Message';
import { DateSeparator } from './DateSeparator';
import { MessageSkeleton } from '@/components/ui/Skeleton';
import styles from './MessageThread.module.css';

interface MessageThreadProps {
  phone: string;
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function MessageThread({ phone }: MessageThreadProps) {
  const { activeTenant } = useTenant();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    api.get<{ messages: MessageData[] }>(`conversations/${phone}`, {
      tenantId: activeTenant._id,
    })
      .then(({ messages }) => setMessages(messages))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone, activeTenant?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  const formattedPhone = formatPhone(decodeURIComponent(phone));

  return (
    <div className={styles.thread}>
      <div className={styles.header}>
        <span className={styles.phone}>{formattedPhone}</span>
        <span className={styles.count}>
          {!loading && `${messages.length} messages`}
        </span>
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
    </div>
  );
}

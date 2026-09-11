'use client';
import Link from 'next/link';
import { clsx } from 'clsx';
import { formatPhone, formatDate, truncate } from '@/lib/utils';
import { CustomerAvatar } from '@/components/ui/CustomerAvatar';
import styles from './ConversationRow.module.css';

export interface ConversationPreview {
  _id: string;
  customerId?: string;
  customerPhone: string;
  customerName?: string;
  lastMessageAt: string;
  lastMessage?: string;
  role?: 'user' | 'assistant';
  unreadCount?: number;
}

interface ConversationRowProps {
  conversation: ConversationPreview;
  active?: boolean;
}

export function ConversationRow({ conversation, active }: ConversationRowProps) {
  const { _id: _unused, customerPhone, customerName, lastMessage, lastMessageAt, role, unreadCount } = conversation;
  const formattedPhone = formatPhone(customerPhone);
  const preview = truncate(lastMessage ?? '', 52);
  const hasUnread = (unreadCount ?? 0) > 0;

  return (
    <Link
      href={`/conversations/${encodeURIComponent(customerPhone)}`}
      className={clsx(styles.row, active && styles.active, hasUnread && styles.unread)}
      onClick={() => console.log('[DEBUG nav] conversation clicked', { phone: customerPhone, conversationId: conversation._id, unreadCount })}
    >
      <CustomerAvatar phone={customerPhone} name={customerName} size={36} />
      <div className={styles.body}>
        <div className={styles.top}>
          <span className={styles.phone}>{formattedPhone}</span>
          <time className={styles.time} dateTime={lastMessageAt}>
            {formatDate(lastMessageAt)}
          </time>
        </div>
        <p className={clsx(styles.preview, role === 'user' && styles.inbound)}>
          {role === 'assistant' && <span className={styles.aiTag}>AI</span>}
          {preview}
        </p>
      </div>
      {hasUnread && (
        <span className={styles.unreadBadge}>
          {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

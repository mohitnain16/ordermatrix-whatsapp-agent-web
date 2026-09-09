'use client';
import Link from 'next/link';
import { clsx } from 'clsx';
import { formatPhone, formatDate, truncate } from '@/lib/utils';
import styles from './ConversationRow.module.css';

export interface ConversationPreview {
  phone: string;
  lastMessage: string;
  lastMessageAt: string;
  role: 'user' | 'assistant';
  unread?: number;
}

interface ConversationRowProps {
  conversation: ConversationPreview;
  active?: boolean;
}

function PhoneAvatar({ phone }: { phone: string }) {
  const initials = phone.replace(/\D/g, '').slice(-2);
  return <div className={styles.avatar}>{initials}</div>;
}

export function ConversationRow({ conversation, active }: ConversationRowProps) {
  const { phone, lastMessage, lastMessageAt, role, unread } = conversation;
  const formattedPhone = formatPhone(phone);
  const preview = truncate(lastMessage, 52);

  return (
    <Link
      href={`/conversations/${encodeURIComponent(phone)}`}
      className={clsx(styles.row, active && styles.active)}
    >
      <PhoneAvatar phone={phone} />
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
      {unread != null && unread > 0 && (
        <span className={styles.unreadDot} />
      )}
    </Link>
  );
}

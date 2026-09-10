'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { ConversationList } from '@/components/conversations/ConversationList';
import { MessageThread } from '@/components/conversations/MessageThread';
import styles from '../conversations.module.css';

export default function ThreadPage() {
  const params = useParams<{ phone: string }>();
  const phone = decodeURIComponent(params.phone);

  return (
    <div className={`${styles.splitPane} ${styles.threadOnly}`}>
      <div className={styles.listPane}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Conversations</h2>
        </div>
        <ConversationList activePhone={phone} />
      </div>
      <div className={styles.threadPane}>
        {/* Back link — only visible on mobile */}
        <Link href="/conversations" className={styles.mobileBack}>
          <CaretLeft size={15} weight="bold" />
          Conversations
        </Link>
        <MessageThread phone={phone} />
      </div>
    </div>
  );
}

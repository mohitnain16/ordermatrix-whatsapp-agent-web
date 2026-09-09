'use client';
import { useParams } from 'next/navigation';
import { ConversationList } from '@/components/conversations/ConversationList';
import { MessageThread } from '@/components/conversations/MessageThread';
import styles from '../conversations.module.css';

export default function ThreadPage() {
  const params = useParams<{ phone: string }>();
  const phone = params.phone;

  return (
    <div className={styles.splitPane}>
      <div className={styles.listPane}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Conversations</h2>
        </div>
        <ConversationList activePhone={decodeURIComponent(phone)} />
      </div>
      <div className={styles.threadPane}>
        <MessageThread phone={phone} />
      </div>
    </div>
  );
}

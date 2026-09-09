'use client';
import { ConversationList } from '@/components/conversations/ConversationList';
import { EmptyThread } from '@/components/conversations/EmptyThread';
import styles from './conversations.module.css';

export default function ConversationsPage() {
  return (
    <div className={styles.splitPane}>
      <div className={styles.listPane}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Conversations</h2>
        </div>
        <ConversationList />
      </div>
      <div className={styles.threadPane}>
        <EmptyThread />
      </div>
    </div>
  );
}

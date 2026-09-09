import { ChatCircleText } from '@phosphor-icons/react';
import styles from './EmptyThread.module.css';

export function EmptyThread() {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>
        <ChatCircleText size={32} weight="thin" />
      </div>
      <p className={styles.heading}>No conversation selected</p>
      <p className={styles.sub}>Pick a conversation from the list to view the message thread.</p>
    </div>
  );
}

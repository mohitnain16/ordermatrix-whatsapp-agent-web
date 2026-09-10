import { formatTimestamp } from '@/lib/utils';
import { ToolCallBadge, type ToolCall } from './ToolCallBadge';
import styles from './Message.module.css';

export interface MessageData {
  _id?: string;
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: string;
  toolCall?: ToolCall;
}

interface MessageProps {
  message: MessageData;
  isLast: boolean;
}

export function Message({ message, isLast }: MessageProps) {
  const isInbound = message.direction === 'inbound';

  return (
    <div className={isInbound ? styles.inbound : styles.outbound}>
      <div className={styles.bubble}>
        <p className={styles.content}>{message.content}</p>
        {message.toolCall && <ToolCallBadge toolCall={message.toolCall} />}
        <time
          className={styles.time}
          dateTime={message.timestamp}
          data-visible={isLast ? 'true' : undefined}
        >
          {formatTimestamp(message.timestamp)}
        </time>
      </div>
    </div>
  );
}

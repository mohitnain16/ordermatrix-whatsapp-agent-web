import { Wrench } from '@phosphor-icons/react';
import { toolLabel } from '@/lib/utils';
import styles from './ToolCallBadge.module.css';

export interface ToolCall {
  name: string;
  result?: string;
  summary?: string;
}

interface ToolCallBadgeProps {
  toolCall: ToolCall;
}

export function ToolCallBadge({ toolCall }: ToolCallBadgeProps) {
  const label = toolLabel(toolCall.name);
  const detail = toolCall.summary ?? toolCall.result;

  return (
    <div className={styles.badge}>
      <Wrench size={11} weight="fill" className={styles.icon} />
      <span className={styles.label}>{label}</span>
      {detail && <span className={styles.sep}>·</span>}
      {detail && <span className={styles.detail}>{detail}</span>}
    </div>
  );
}

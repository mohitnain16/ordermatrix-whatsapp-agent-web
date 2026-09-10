'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { UserCircle, ArrowDown, PaperPlaneTilt } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import { useSocket } from '@/context/SocketContext';
import { formatPhone } from '@/lib/utils';
import { CustomerAvatar } from '@/components/ui/CustomerAvatar';
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

// Two messages are in the same visual group when they come from the same
// sender and are less than 5 minutes apart.
const GROUP_BREAK_MS = 5 * 60 * 1000;
function isSameGroup(a: MessageData, b: MessageData): boolean {
  if (a.direction !== b.direction) return false;
  return (
    Math.abs(
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ) < GROUP_BREAK_MS
  );
}

// Distance from bottom (px) below which we consider the user "at the bottom".
const NEAR_BOTTOM_PX = 150;

export function MessageThread({ phone }: MessageThreadProps) {
  const { activeTenant } = useTenant();
  const { socket, connected } = useSocket();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);

  // Ref on the scrollable messages container — used to read/set scroll position.
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Tracks message count from the previous render to detect genuine new arrivals.
  const prevMsgCountRef = useRef(0);

  // ── Scroll helpers ────────────────────────────────────────────────────────

  function isNearBottom(): boolean {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  function handleScroll() {
    if (isNearBottom()) setShowNewMsgPill(false);
  }

  // ── Textarea auto-resize ──────────────────────────────────────────────────

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    setConversationId(null);
    setCustomerId(null);
    setCustomerName(undefined);
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
        if (conv.customerName) setCustomerName(conv.customerName);
        return api.get<{ messages: MessageData[] }>(`conversations/${conv._id}/messages`, {
          tenantId: activeTenant._id,
        });
      })
      .then(({ messages }) => setMessages(messages))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone, activeTenant?._id]);

  // Used by both socket path and fallback poll to merge fetched messages.
  const mergeMessages = useCallback((fetched: MessageData[]) => {
    setMessages(prev => {
      const lastFetched = fetched[fetched.length - 1];
      const lastPrev = prev[prev.length - 1];
      const identical =
        fetched.length === prev.length &&
        lastFetched?._id === lastPrev?._id &&
        lastFetched?.deliveryStatus === lastPrev?.deliveryStatus;
      return identical ? prev : fetched;
    });
  }, []);

  // Socket: listen for live message events while the connection is up.
  useEffect(() => {
    if (!socket || !conversationId) return;

    function onMessageNew(data: { conversationId: string; message: MessageData }) {
      if (data.conversationId !== conversationId) return;
      setMessages(prev => {
        // Deduplicate — the server may emit for the same message we already have
        if (data.message._id && prev.some(m => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
    }

    function onMessageStatus(data: { messageId: string; conversationId: string; deliveryStatus: string }) {
      if (data.conversationId !== conversationId) return;
      setMessages(prev =>
        prev.map(m =>
          m._id === data.messageId
            ? { ...m, deliveryStatus: data.deliveryStatus as MessageData['deliveryStatus'] }
            : m
        )
      );
    }

    socket.on('message:new', onMessageNew);
    socket.on('message:status', onMessageStatus);
    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('message:status', onMessageStatus);
    };
  }, [socket, conversationId]);

  // Fallback: slow poll (30 s) when the socket is disconnected so the view
  // doesn't go silently stale while the socket reconnects.
  useEffect(() => {
    if (connected || !conversationId || !activeTenant) return;
    const interval = setInterval(() => {
      api.get<{ messages: MessageData[] }>(`conversations/${conversationId}/messages`, {
        tenantId: activeTenant._id,
      })
        .then(({ messages: fetched }) => mergeMessages(fetched))
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [connected, conversationId, activeTenant?._id, mergeMessages]);

  // Reset UI state when conversation switches.
  useEffect(() => {
    setReplyText('');
    setSendError(null);
    setShowProfile(false);
    setShowNewMsgPill(false);
    prevMsgCountRef.current = 0;
    if (inputRef.current) inputRef.current.style.height = 'auto';
  }, [phone]);

  // ── Scroll-to-bottom logic ────────────────────────────────────────────────

  useEffect(() => {
    const prev = prevMsgCountRef.current;
    const curr = messages.length;
    prevMsgCountRef.current = curr;

    if (curr === 0) return;

    if (prev === 0) {
      scrollToBottom('instant');
      setShowNewMsgPill(false);
      return;
    }

    if (curr > prev) {
      if (isNearBottom()) {
        scrollToBottom('smooth');
        setShowNewMsgPill(false);
      } else {
        setShowNewMsgPill(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // ── Sending ───────────────────────────────────────────────────────────────

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
    if (inputRef.current) inputRef.current.style.height = 'auto';

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
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <CustomerAvatar phone={phone} name={customerName} size={40} />
          <span className={styles.phone}>{formattedPhone}</span>
        </div>
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

      {/* ── Message list ───────────────────────────────────────────────── */}
      <div className={styles.messages} ref={scrollRef} onScroll={handleScroll}>
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
          <div className={styles.stateBox}>
            <p style={{ color: 'var(--red)' }}>Failed to load messages: {error}</p>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className={styles.stateBox}>
            <p>No messages in this conversation.</p>
          </div>
        )}

        {!loading && !error && messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showSeparator = !prev || !isSameDay(msg.timestamp, prev.timestamp);
          const spacingClass = !prev || showSeparator
            ? styles.rowFirst
            : isSameGroup(prev, msg)
              ? styles.rowSame
              : styles.rowDiff;
          return (
            <div key={msg._id ?? i} className={spacingClass}>
              {showSeparator && <DateSeparator iso={msg.timestamp} />}
              <Message message={msg} customerPhone={phone} customerName={customerName} />
            </div>
          );
        })}

        {/* Typing indicator — shown while agent reply is in-flight */}
        {sending && (
          <div className={clsx(styles.rowDiff, styles.typingRow)}>
            <div className={styles.typingBubble}>
              <span className={clsx(styles.dot, styles.dot1)} />
              <span className={clsx(styles.dot, styles.dot2)} />
              <span className={clsx(styles.dot, styles.dot3)} />
            </div>
          </div>
        )}
      </div>

      {/* ── New-message pill ───────────────────────────────────────────── */}
      {showNewMsgPill && (
        <div className={styles.newMsgPillRow}>
          <button
            className={styles.newMsgPill}
            onClick={() => { scrollToBottom('smooth'); setShowNewMsgPill(false); }}
          >
            <ArrowDown size={13} weight="bold" />
            New message
          </button>
        </div>
      )}

      {/* ── Floating pill input ────────────────────────────────────────── */}
      <div className={styles.pillWrap}>
        {sendError && <p className={styles.sendError}>{sendError}</p>}
        <div className={styles.pillOuter}>
          <textarea
            ref={inputRef}
            className={styles.pillTextarea}
            placeholder="Message…"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending || loading}
            aria-label="Reply message"
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!replyText.trim() || sending || loading}
            aria-label="Send message"
          >
            <PaperPlaneTilt size={16} weight="fill" />
          </button>
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

'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSocket } from './SocketContext';
import { formatPhone } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  phone: string;
  content: string;
  conversationPhone: string;
  createdAt: number;
}

type BrowserPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface NotificationContextValue {
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  permission: BrowserPermission;
  requestPermission: () => void;
  totalUnread: number;
  /** Called by ConversationList after initial REST load to seed the unread map. */
  setUnreadBulk: (entries: { id: string; count: number }[]) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  soundEnabled: true,
  setSoundEnabled: () => {},
  permission: 'unsupported',
  requestPermission: () => {},
  totalUnread: 0,
  setUnreadBulk: () => {},
  toasts: [],
  dismissToast: () => {},
});

// ── Sound ─────────────────────────────────────────────────────────────────────

function playNotificationSound() {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio unavailable — silent
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  // ── Sound preference ──────────────────────────────────────────────────────
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('om_sound') !== 'false';
  });
  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    localStorage.setItem('om_sound', v ? 'true' : 'false');
  }, []);

  // ── Browser notification permission ───────────────────────────────────────
  const [permission, setPermission] = useState<BrowserPermission>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission as BrowserPermission;
  });

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as BrowserPermission);
  }, []);

  // ── Unread counts (seeded from REST, kept live via socket) ────────────────
  const [unreadMap, setUnreadMap] = useState<Map<string, number>>(new Map());

  const setUnreadBulk = useCallback((entries: { id: string; count: number }[]) => {
    setUnreadMap(() => {
      const m = new Map<string, number>();
      for (const { id, count } of entries) {
        if (count > 0) m.set(id, count);
      }
      return m;
    });
  }, []);

  const totalUnread = useMemo(
    () => [...unreadMap.values()].reduce((sum, n) => sum + n, 0),
    [unreadMap]
  );

  // ── Tab title ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const base = 'Ordermatrix — WhatsApp Agent Admin';
    document.title = totalUnread > 0 ? `(${totalUnread}) ${base}` : base;
  }, [totalUnread]);

  // ── Toasts ────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => {
      // Cap at 4, bump duplicates to top
      const filtered = prev.filter(t => t.conversationPhone !== toast.conversationPhone);
      return [toast, ...filtered].slice(0, 4);
    });
  }, []);

  // ── Use refs for values read inside socket listener ───────────────────────
  // Avoids re-registering listeners on every state change.
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  const permissionRef = useRef(permission);
  useEffect(() => { permissionRef.current = permission; }, [permission]);

  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    function onConversationUpdated(data: {
      _id: string;
      unreadCount?: number;
    }) {
      if (data.unreadCount !== undefined) {
        setUnreadMap(prev => {
          const next = new Map(prev);
          if (!data.unreadCount) next.delete(data._id);
          else next.set(data._id, data.unreadCount);
          return next;
        });
      }
    }

    function onMessageNew(data: {
      conversationId: string;
      customerPhone: string;
      message: { direction: string; content: string; _id?: string };
    }) {
      if (data.message.direction !== 'inbound') return;

      // Derive the current conversation phone from the URL path.
      const path = pathnameRef.current;
      const currentPhone =
        path.startsWith('/conversations/') && path.length > '/conversations/'.length
          ? decodeURIComponent(path.slice('/conversations/'.length))
          : null;

      // If the user is already viewing this conversation, skip all notifications.
      if (currentPhone && currentPhone === data.customerPhone) return;

      // Update unread count for this conversation.
      setUnreadMap(prev => {
        const next = new Map(prev);
        next.set(data.conversationId, (next.get(data.conversationId) ?? 0) + 1);
        return next;
      });

      // Toast
      addToastRef.current({
        id: data.message._id ?? `${data.conversationId}-${Date.now()}`,
        phone: data.customerPhone,
        content: data.message.content,
        conversationPhone: data.customerPhone,
        createdAt: Date.now(),
      });

      // Browser notification (only when tab is hidden)
      if (
        typeof document !== 'undefined' &&
        document.hidden &&
        permissionRef.current === 'granted' &&
        'Notification' in window
      ) {
        try {
          new Notification(`New message — ${formatPhone(data.customerPhone)}`, {
            body: data.message.content.slice(0, 120),
            icon: '/favicon.ico',
            tag: data.customerPhone, // replaces prior notification for same contact
          });
        } catch {
          // Safari may restrict Notification constructor outside user gesture
        }
      }

      // Sound
      if (soundEnabledRef.current) playNotificationSound();
    }

    socket.on('conversation:updated', onConversationUpdated);
    socket.on('message:new', onMessageNew);
    return () => {
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('message:new', onMessageNew);
    };
  }, [socket]);

  return (
    <NotificationContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        permission,
        requestPermission,
        totalUnread,
        setUnreadBulk,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);

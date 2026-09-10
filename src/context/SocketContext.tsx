'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useTenant } from './TenantContext';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { activeTenant } = useTenant();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const prevTenantRef = useRef<string | null>(null);

  // Connect once on mount using credentials from the session-gated /api/ws-token route.
  useEffect(() => {
    let sock: Socket | null = null;
    let cancelled = false;

    fetch('/api/ws-token')
      .then(r => (r.ok ? r.json() : null))
      .then((data: { token: string; wsUrl: string } | null) => {
        if (!data || cancelled) return;

        sock = io(data.wsUrl, {
          auth: { token: data.token, tenantId: activeTenant?._id },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 30000,
        });

        sock.on('connect', () => { if (!cancelled) setConnected(true); });
        sock.on('disconnect', () => { if (!cancelled) setConnected(false); });

        prevTenantRef.current = activeTenant?._id ?? null;
        if (!cancelled) setSocket(sock);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      sock?.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When the active tenant changes, re-room the existing socket.
  useEffect(() => {
    if (!socket || !activeTenant) return;
    if (prevTenantRef.current === activeTenant._id) return;
    prevTenantRef.current = activeTenant._id;
    socket.emit('join:tenant', activeTenant._id);
  }, [socket, activeTenant?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

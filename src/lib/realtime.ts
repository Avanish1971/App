// Server se live updates (Server-Sent Events). Ek role ke liye ek hi connection, sab screens share karti hain.
import { useEffect, useRef, useState } from 'react';
import { BASE_URL } from './api';
import { getToken, Role } from './auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LiveHandler = (event: string, data: any) => void;

const SERVER_EVENTS = ['hello', 'attendance', 'message', 'message-sent', 'message-read', 'client-visit'];

interface Connection {
  es: EventSource;
  handlers: Set<LiveHandler>;
}
const connections = new Map<Role, Connection>();

function open(role: Role): Connection | null {
  const existing = connections.get(role);
  if (existing) return existing;
  const token = getToken(role);
  if (!token) return null;

  const es = new EventSource(`${BASE_URL}/api/events?token=${encodeURIComponent(token)}`);
  const conn: Connection = { es, handlers: new Set() };
  const emit: LiveHandler = (ev, data) => conn.handlers.forEach((h) => h(ev, data));

  SERVER_EVENTS.forEach((ev) =>
    es.addEventListener(ev, (e) => {
      try {
        emit(ev, JSON.parse((e as MessageEvent).data));
      } catch {
        // kharab data ignore
      }
    })
  );
  let first = true;
  es.onopen = () => {
    // Net toot kar wapas judne par: "reconnected" -> screens apna data dobara le leti hain
    emit(first ? 'online' : 'reconnected', null);
    first = false;
  };
  es.onerror = () => emit('offline', null);

  connections.set(role, conn);
  return conn;
}

// Component me live events sunne ke liye. `true` lautata hai jab connection chalu ho.
export function useLiveEvents(role: Role, enabled: boolean, handler: LiveHandler): boolean {
  const ref = useRef(handler);
  ref.current = handler;
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const conn = open(role);
    if (!conn) return;
    const h: LiveHandler = (ev, data) => {
      if (ev === 'online' || ev === 'reconnected') setOnline(true);
      if (ev === 'offline') setOnline(false);
      ref.current(ev, data);
    };
    conn.handlers.add(h);
    // Connection pehle se khula tha to uski state maan lo
    if (conn.es.readyState === EventSource.OPEN) setOnline(true);
    return () => {
      conn.handlers.delete(h);
      if (conn.handlers.size === 0) {
        conn.es.close();
        connections.delete(role);
      }
      setOnline(false);
    };
  }, [role, enabled]);

  return online;
}

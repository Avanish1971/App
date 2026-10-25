import { useEffect, useRef, useState } from 'react';
import { Bell, X, Megaphone } from 'lucide-react';
import { InboxMessage } from '../../types';
import { getMyMessagesApi, markMyMessagesReadApi } from '../../lib/api';
import { useLiveEvents } from '../../lib/realtime';

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Employee ke phone par: admin ka message turant aata hai (banner + bell par badge)
export function MessageInbox({ enabled }: { enabled: boolean }) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState<InboxMessage | null>(null);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const openRef = useRef(open);
  openRef.current = open;

  const load = () =>
    getMyMessagesApi()
      .then(setMessages)
      .catch(() => {
        // net nahi to baad me
      });

  useEffect(() => {
    if (enabled) load();
  }, [enabled]);

  useLiveEvents('employee', enabled, (event, data) => {
    if (event === 'reconnected') load();
    if (event !== 'message' || !data) return;
    const m = data as InboxMessage;
    if (openRef.current) {
      // Inbox khuli hai: seedha padha hua maano
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [{ ...m, read: true }, ...prev]));
      setFreshIds((prev) => [...prev, m.id]);
      markMyMessagesReadApi().catch(() => {});
    } else {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [m, ...prev]));
      setBanner(m);
      setTimeout(() => setBanner((b) => (b && b.id === m.id ? null : b)), 7000);
      if (navigator.vibrate) navigator.vibrate(200);
    }
  });

  const unread = messages.filter((m) => !m.read).length;

  const openInbox = () => {
    setFreshIds(messages.filter((m) => !m.read).map((m) => m.id));
    setBanner(null);
    setOpen(true);
    if (unread > 0) {
      markMyMessagesReadApi()
        .then(() => setMessages((prev) => prev.map((m) => ({ ...m, read: true }))))
        .catch(() => {});
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* New message banner (upar se) */}
      {banner && !open && (
        <button
          onClick={openInbox}
          className="fixed top-3 left-3 right-3 z-[80] text-left bg-indigo-600 text-white rounded-2xl shadow-2xl p-3.5 flex items-start gap-3"
          style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <Megaphone className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold opacity-80">{banner.fromName} ka naya message</div>
            <div className="text-xs font-semibold line-clamp-2 break-words">{banner.text}</div>
          </div>
        </button>
      )}

      {/* Floating bell (bottom nav ke upar) */}
      <button
        onClick={openInbox}
        aria-label="Messages"
        className="fixed right-4 bottom-20 z-[60] w-12 h-12 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Inbox sheet */}
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-900/40" onClick={() => setOpen(false)}>
          <div
            className="w-full max-h-[80vh] bg-white rounded-t-3xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="font-extrabold text-slate-900 text-sm">Messages</div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2.5">
              {messages.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-10">Abhi koi message nahi hai</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-2xl border p-3.5 space-y-1.5 ${
                      freshIds.includes(m.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold text-indigo-700">
                        {m.fromName}
                        {m.toAll && ' · Sabke liye'}
                      </span>
                      <span className="font-mono">{formatWhen(m.sentAt)}</span>
                    </div>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap break-words">{m.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Employee, AdminMessage } from '../../types';
import { getMessagesApi, sendMessageApi } from '../../lib/api';
import { useLiveEvents } from '../../lib/realtime';
import { Send, Users, User, Search, CheckCheck, Megaphone } from 'lucide-react';

const MAX_LEN = 1000;

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function MessageCenter({ employees }: { employees: Employee[] }) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'ALL' | 'SELECTED'>('ALL');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(() => employees.filter((e) => e.status !== 'INACTIVE'), [employees]);

  const load = () =>
    getMessagesApi()
      .then(setMessages)
      .catch((err) => setError(err instanceof Error ? err.message : 'Messages load nahi hue'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  // Live: kisi ne message padha / doosri admin screen se message gaya
  useLiveEvents('admin', true, (event, data) => {
    if (event === 'message-read' || event === 'reconnected') load();
    if (event === 'message-sent' && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [data, ...prev]));
    }
  });

  const filtered = active.filter((e) => {
    const q = search.trim().toLowerCase();
    return !q || e.fullName.toLowerCase().includes(q) || e.empId.toLowerCase().includes(q) || e.department.toLowerCase().includes(q);
  });

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const canSend = text.trim().length > 0 && !sending && (mode === 'ALL' || selected.length > 0);

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const created = await sendMessageApi(text.trim(), mode === 'ALL' ? [] : selected);
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [created, ...prev]));
      setText('');
      if (mode === 'SELECTED') setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message nahi ja paaya');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
      {/* Compose */}
      <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4 self-start">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Naya Message (संदेश भेजो)</h3>
          <p className="text-xs text-slate-500">Message employee ke phone par turant pahunchta hai</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('ALL')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              mode === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Sabhi Employees ({active.length})
          </button>
          <button
            onClick={() => setMode('SELECTED')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              mode === 'SELECTED' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Chune hue {selected.length > 0 && `(${selected.length})`}
          </button>
        </div>

        {mode === 'SELECTED' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Employee dhundo..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <button onClick={() => setSelected(Array.from(new Set([...selected, ...filtered.map((e) => e.id)])))} className="font-semibold text-indigo-600 hover:underline">
                Sab chuno
              </button>
              <button onClick={() => setSelected([])} className="font-semibold text-slate-500 hover:underline">
                Clear
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-xs text-slate-500 text-center">Koi employee nahi mila</div>
              ) : (
                filtered.map((e) => (
                  <label key={e.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} className="accent-indigo-600" />
                    <img src={e.avatar} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                    <span className="text-xs font-semibold text-slate-900 flex-1 truncate">{e.fullName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{e.empId}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <textarea
            value={text}
            maxLength={MAX_LEN}
            onChange={(e) => setText(e.target.value)}
            placeholder="Yahan message likho..."
            rows={5}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="text-[10px] text-slate-400 text-right font-mono">
            {text.length}/{MAX_LEN}
          </div>
        </div>

        {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</div>}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Bhej raha hai…' : mode === 'ALL' ? 'Sabko Bhejo' : `${selected.length} employee ko bhejo`}
        </button>
      </div>

      {/* History */}
      <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">Bheje hue Messages</h3>
        </div>
        {loading ? (
          <div className="text-xs text-slate-500 py-8 text-center">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-xs text-slate-500 py-10 text-center border border-dashed border-slate-300 rounded-xl">
            Abhi tak koi message nahi bheja
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[34rem] overflow-y-auto pr-1">
            {messages.map((m) => (
              <div key={m.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-0.5">
                    {m.toAll
                      ? 'Sabhi Employees'
                      : m.recipientNames.length <= 2
                      ? m.recipientNames.join(', ')
                      : `${m.recipientNames.slice(0, 2).join(', ')} +${m.recipientNames.length - 2}`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono shrink-0">{formatWhen(m.sentAt)}</div>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap break-words">{m.text}</p>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <CheckCheck className={`w-3.5 h-3.5 ${m.readCount > 0 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>
                    {m.readCount}/{m.totalCount} ne padha
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

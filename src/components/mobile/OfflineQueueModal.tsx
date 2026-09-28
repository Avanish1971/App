import { useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { AttendanceEvent } from '../../types';

interface OfflineQueueModalProps {
  isOffline: boolean;
  onToggleOffline: () => void;
  queuedEvents: AttendanceEvent[];
  onSyncEvents: () => void;
  onClose: () => void;
}

export function OfflineQueueModal({
  isOffline,
  onToggleOffline,
  queuedEvents,
  onSyncEvents,
  onClose,
}: OfflineQueueModalProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      onSyncEvents();
      setSyncing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                isOffline ? 'bg-amber-600/20 text-amber-400' : 'bg-emerald-600/20 text-emerald-400'
              }`}
            >
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Offline Queue & Sync Engine</h3>
              <p className="text-[11px] text-slate-400">Zero data loss in basements or elevators</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Mode Switcher */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Simulate Device Network Mode</div>
              <div className="text-[11px] text-slate-400">
                Current: <span className={isOffline ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{isOffline ? 'OFFLINE (No Internet)' : 'ONLINE (Connected)'}</span>
              </div>
            </div>
            <button
              onClick={onToggleOffline}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                isOffline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isOffline ? 'Switch Online' : 'Simulate Offline'}
            </button>
          </div>

          {/* Explanation */}
          <div className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px]">
            <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Idempotent Queue Architecture</span>
            </p>
            When employees enter parking levels or areas without 4G, attendance events are signed locally in encrypted storage. When online signal is restored, the server processes them without duplicate punches.
          </div>

          {/* Queue List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-400 font-medium">
              <span>Pending Synchronization Queue:</span>
              <span className="font-mono text-white">{queuedEvents.length} Event(s)</span>
            </div>

            {queuedEvents.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 text-center text-slate-500">
                ✓ Queue is clean. All attendance events synchronized with cloud server.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {queuedEvents.map((ev) => (
                  <div key={ev.id} className="bg-slate-800/80 border border-amber-900/40 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-amber-400">{ev.eventType}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.timestamp}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Coords: {ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)} (±{ev.accuracy}m)
                    </div>
                    {ev.note && <div className="text-[11px] text-slate-300">{ev.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action */}
          <button
            onClick={handleSync}
            disabled={queuedEvents.length === 0 || syncing || isOffline}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
              queuedEvents.length > 0 && !isOffline
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isOffline
                ? 'Cannot Sync while Offline'
                : syncing
                ? 'Synchronizing Events with Server...'
                : `Synchronize ${queuedEvents.length} Event(s) Now`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

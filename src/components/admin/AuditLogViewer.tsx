import { AuditLogEntry } from '../../types';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import { useState } from 'react';

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Immutable Security Audit Log</span>
          </h3>
          <p className="text-xs text-slate-500">
            Cryptographically timestamped trail of policy changes, payroll runs, and auto-checkins
          </p>
        </div>

        <input
          type="text"
          placeholder="Search audit trail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-500 w-64 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Details</th>
              <th className="py-3 px-4 font-mono text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{log.actor}</td>
                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{log.role}</td>
                <td className="py-3 px-4 font-mono text-indigo-600 font-medium whitespace-nowrap">
                  {log.action}
                </td>
                <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{log.entity}</td>
                <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.details}>
                  {log.details}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500 text-right whitespace-nowrap">
                  {log.ipAddress}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

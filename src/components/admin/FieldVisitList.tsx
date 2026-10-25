import { useEffect, useState } from 'react';
import { ClientVisit } from '../../types';
import { getClientVisitsApi } from '../../lib/api';
import { useLiveEvents } from '../../lib/realtime';
import { AuthImage } from './AuthImage';
import { MapPin, Phone, User, Clock, ExternalLink, FileText, Building2 } from 'lucide-react';

interface FieldVisitListProps {
  filter: { date?: string; from?: string; to?: string; employeeId?: string };
  showEmployee?: boolean;
}

function formatDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Field work visits ki list: kaha gaya, kyu gaya, client info, live location, selfie aur jagah ki photo
export function FieldVisitList({ filter, showEmployee = true }: FieldVisitListProps) {
  const [visits, setVisits] = useState<ClientVisit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(filter);

  const load = () =>
    getClientVisitsApi(filter)
      .then((d) => {
        setVisits(d);
        setError(null);
      })
      .catch((err) => {
        setVisits([]);
        setError(err instanceof Error ? err.message : 'Visits load nahi hue');
      });

  useEffect(() => {
    setVisits(null);
    load();
  }, [key]);

  // Naya visit aate hi list turant badal jaye
  useLiveEvents('admin', true, (event) => {
    if (event === 'client-visit' || event === 'reconnected') load();
  });

  if (visits === null) return <div className="text-xs text-slate-500 py-6 text-center">Loading…</div>;

  return (
    <div className="space-y-3">
      {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>}
      {visits.length === 0 && !error ? (
        <div className="text-xs text-slate-500 py-10 text-center border border-dashed border-slate-300 rounded-xl">
          Is samay koi field visit nahi hai
        </div>
      ) : (
        visits.map((v) => (
          <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {showEmployee && <span className="font-bold text-slate-900 text-sm">{v.employeeName || v.employeeId}</span>}
                <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" /> {formatDay(v.date)} · {v.time}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">{v.clientName}</div>
                  <div className="text-slate-600">{v.clientLocation}</div>
                </div>
              </div>

              {(v.contactPerson || v.contactPhone) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
                  {v.contactPerson && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {v.contactPerson}
                    </span>
                  )}
                  {v.contactPhone && (
                    <a href={`tel:${v.contactPhone}`} className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                      <Phone className="w-3.5 h-3.5" /> {v.contactPhone}
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-amber-700">Kyu gaya tha</div>
                  <div className="text-slate-800 whitespace-pre-wrap break-words">{v.purpose}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}
                  {v.accuracy ? ` (±${Math.round(v.accuracy)}m)` : ''}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${v.latitude},${v.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Map me dekho
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:self-start">
              <AuthImage visitId={v.id} kind="selfie" label="Selfie" />
              <AuthImage visitId={v.id} kind="site" label="Jagah ki photo" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

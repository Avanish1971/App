import { AttendanceEvent } from '../../types';

// Ek attendance record ke events ki list. Kuch events me location hoti hi nahi
// (jaise "LATE_MARK", "ABSENT_MARK": employee aaya hi nahi), isliye coordinates tabhi dikhate hain jab maujood ho.
export function EventTrail({ events: rawEvents }: { events?: AttendanceEvent[] }) {
  // Purana/adhura data bhi screen na tode: sirf sahi (object) events lo
  const events = Array.isArray(rawEvents) ? rawEvents.filter((e) => e && typeof e === 'object') : [];
  if (events.length === 0) {
    return <div className="text-center py-4 text-slate-500">No events logged for this record</div>;
  }
  return (
    <>
      {events.map((ev, i) => (
        <div key={ev.id || i} className="border-b border-slate-100 pb-1.5 last:border-0">
          <div className="flex justify-between font-mono text-slate-700">
            <span className="font-bold text-indigo-600">{ev.eventType}</span>
            <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
          </div>
          {ev.note && <div className="text-[10px] text-slate-500 mt-0.5">{ev.note}</div>}
          {typeof ev.latitude === 'number' && typeof ev.longitude === 'number' && (
            <div className="text-[9px] text-slate-500 font-mono">
              Coords: {ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)}
              {typeof ev.accuracy === 'number' && ev.accuracy > 0 ? ` (±${ev.accuracy}m)` : ''}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

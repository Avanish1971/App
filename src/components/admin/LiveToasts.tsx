import { CheckCircle2, Clock, LogOut, X } from 'lucide-react';

export interface LiveToast {
  id: number;
  kind: 'present' | 'late' | 'absent';
  title: string;
  detail?: string;
}

const STYLES = {
  present: { box: 'border-emerald-200 bg-emerald-50', icon: 'text-emerald-600', Icon: CheckCircle2 },
  late: { box: 'border-amber-200 bg-amber-50', icon: 'text-amber-600', Icon: Clock },
  absent: { box: 'border-rose-200 bg-rose-50', icon: 'text-rose-600', Icon: LogOut },
};

// Screen ke kone me live notification: "Rahul office me aaya - PRESENT"
export function LiveToasts({ toasts, onDismiss }: { toasts: LiveToast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))]">
      {toasts.map((t) => {
        const { box, icon, Icon } = STYLES[t.kind];
        return (
          <div key={t.id} className={`flex items-start gap-2.5 border rounded-xl p-3 shadow-lg ${box}`}>
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${icon}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900">{t.title}</div>
              {t.detail && <div className="text-[11px] text-slate-600">{t.detail}</div>}
            </div>
            <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

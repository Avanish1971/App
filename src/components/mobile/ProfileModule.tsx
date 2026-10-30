import { useEffect, useState } from 'react';
import { X, User, FileText, Download, Loader2, Briefcase, Building, Phone, Mail, CalendarDays, UserCog, BadgeCheck } from 'lucide-react';
import { Employee, Office, SalarySlip } from '../../types';
import { getMySalarySlipsApi, fetchMySalarySlipBlob, getMySalarySlipLinkApi } from '../../lib/api';
import { saveBlobToDevice, canSaveNatively } from '../../lib/saveFile';
import { useCompany } from '../../lib/useCompany';

interface ProfileModuleProps {
  employee: Employee;
  office: Office;
  onClose: () => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthLabel = (m: string) => {
  const [y, mm] = m.split('-');
  return `${MONTHS[Number(mm) - 1] || mm} ${y}`;
};
const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const extFor = (mime: string) => (mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg');

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{label}</div>
        <div className="text-xs font-semibold text-slate-900 break-words">{value || '—'}</div>
      </div>
    </div>
  );
}

// Profile: 2 tab — Information aur Salary Slip (slip tabhi dikhti hai jab admin upload kare)
export function ProfileModule({ employee, office, onClose }: ProfileModuleProps) {
  const [tab, setTab] = useState<'info' | 'slips'>('info');
  const [slips, setSlips] = useState<SalarySlip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { name: companyName, logoUrl } = useCompany();

  const loadSlips = () =>
    getMySalarySlipsApi()
      .then((d) => {
        setSlips(d);
        setError(null);
      })
      .catch((e) => {
        setSlips([]);
        setError(e instanceof Error ? e.message : 'Salary slips load nahi hui');
      });

  useEffect(() => {
    loadSlips();
  }, []);

  // Phone ke browser me kholo (3 minute ka link) — file-save plugin na ho tab bhi download ho jata hai
  const openInBrowser = async (s: SalarySlip) => {
    const url = await getMySalarySlipLinkApi(s.id);
    window.open(url, '_blank');
  };

  const download = async (s: SalarySlip) => {
    setBusyId(s.id);
    setError(null);
    try {
      if (!canSaveNatively()) {
        // Purana APK: Filesystem/Share plugin nahi hai
        await openInBrowser(s);
        return;
      }
      try {
        const blob = await fetchMySalarySlipBlob(s.id);
        await saveBlobToDevice(blob, `SalarySlip-${s.month}.${extFor(s.mimeType)}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (/not implemented|unimplemented|not available/i.test(msg)) await openInBrowser(s);
        else throw e;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      // Share sheet band kar di to error nahi hai
      if (!/cancel/i.test(msg)) setError(msg || 'Download nahi ho paaya');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="font-extrabold text-slate-900 text-sm">Profile</div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile top */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-blue-50 to-slate-50 flex items-center gap-3">
        <img src={employee.avatar} alt={employee.fullName} className="w-14 h-14 rounded-full border-2 border-blue-400 object-cover" />
        <div className="min-w-0">
          <div className="font-extrabold text-slate-900 text-base truncate">{employee.fullName}</div>
          <div className="text-[11px] text-slate-500 truncate">
            {employee.designation} · <span className="font-mono">{employee.empId}</span>
          </div>
          {companyName && (
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
              {logoUrl && <img src={logoUrl} alt="" className="w-4 h-4 rounded object-contain" />}
              <span className="truncate">{companyName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-xl">
          {(
            [
              { id: 'info', label: 'Information', icon: User },
              { id: 'slips', label: 'Salary Slip', icon: FileText },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-10">
        {tab === 'info' && (
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-1">
            <Row icon={BadgeCheck} label="Employee ID" value={employee.empId} />
            <Row icon={Briefcase} label="Post / Designation" value={employee.designation} />
            <Row icon={Building} label="Department" value={employee.department} />
            <Row icon={Building} label="Branch" value={`${office.name}${office.city ? ` (${office.city})` : ''}`} />
            <Row icon={CalendarDays} label="Joining Date" value={fmtDate(employee.joiningDate)} />
            <Row icon={UserCog} label="Reporting Manager" value={employee.reportingManager} />
            <Row icon={Briefcase} label="Work Type" value={employee.workType === 'FIELD_WORK' ? 'Field Work' : 'WFO (Office)'} />
            {employee.workMode === 'TRAINING' && (
              <Row icon={CalendarDays} label="Training Period" value={`${employee.trainingMonths} mahine · ${fmtDate(employee.trainingEndDate)} tak`} />
            )}
            <Row icon={Phone} label="Phone" value={employee.phone} />
            <Row icon={Mail} label="Email" value={employee.email} />
          </div>
        )}

        {tab === 'slips' && (
          <div className="space-y-2.5">
            {error && <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</div>}
            {slips === null ? (
              <div className="text-xs text-slate-500 text-center py-10">Loading…</div>
            ) : slips.length === 0 ? (
              <div className="text-center bg-white border border-dashed border-slate-300 rounded-2xl py-10 px-5 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <div className="text-xs font-semibold text-slate-700">Abhi koi salary slip nahi hai</div>
                <div className="text-[11px] text-slate-500">Jab HR/Admin aapki salary slip upload karega tabhi yahan dikhegi.</div>
              </div>
            ) : (
              slips.map((s) => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">{monthLabel(s.month)}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Salary Slip · {s.mimeType === 'application/pdf' ? 'PDF' : 'Photo'}
                    </div>
                  </div>
                  <button
                    onClick={() => download(s)}
                    disabled={busyId === s.id}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Download
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

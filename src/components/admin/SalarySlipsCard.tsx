import { useEffect, useState } from 'react';
import { Employee, SalarySlip } from '../../types';
import {
  getEmployeeSalarySlipsApi,
  uploadSalarySlipApi,
  deleteSalarySlipApi,
  fetchEmployeeSalarySlipBlob,
} from '../../lib/api';
import { readFileAsBase64, formatBytes } from '../../lib/files';
import { openBlobInNewTab } from '../../lib/saveFile';
import { FilePicker } from './FilePicker';
import { FileText, Eye, Trash2, Upload, Loader2 } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthLabel = (m: string) => {
  const [y, mm] = m.split('-');
  return `${MONTHS[Number(mm) - 1] || mm} ${y}`;
};
const thisMonth = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);

// Admin yahan se employee ki salary slip upload karta hai. Employee ke app me tabhi dikhti hai jab yahan upload ho.
export function SalarySlipsCard({ employee }: { employee: Employee }) {
  const [slips, setSlips] = useState<SalarySlip[] | null>(null);
  const [month, setMonth] = useState(thisMonth());
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setSlips(null);
    setError(null);
    getEmployeeSalarySlipsApi(employee.id)
      .then((d) => alive && setSlips(d))
      .catch((e) => {
        if (alive) {
          setSlips([]);
          setError(e instanceof Error ? e.message : 'Salary slips load nahi hui');
        }
      });
    return () => {
      alive = false;
    };
  }, [employee.id]);

  const upload = async () => {
    if (!file || !month || busy) return;
    const exists = (slips || []).some((s) => s.month === month);
    if (exists && !window.confirm(`${monthLabel(month)} ki slip pehle se hai. Naye file se badalni hai?`)) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await uploadSalarySlipApi(employee.id, {
        month,
        fileName: file.name,
        mimeType: file.type,
        dataBase64: await readFileAsBase64(file),
      });
      setSlips((prev) => [saved, ...(prev || []).filter((s) => s.month !== month)].sort((a, b) => b.month.localeCompare(a.month)));
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload nahi ho paaya');
    } finally {
      setBusy(false);
    }
  };

  const view = async (s: SalarySlip) => {
    try {
      openBlobInNewTab(await fetchEmployeeSalarySlipBlob(employee.id, s.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'File nahi khul paayi');
    }
  };

  const remove = async (s: SalarySlip) => {
    if (!window.confirm(`${monthLabel(s.month)} ki salary slip hatani hai? Employee ke app se bhi hat jayegi.`)) return;
    try {
      await deleteSalarySlipApi(employee.id, s.id);
      setSlips((prev) => (prev || []).filter((x) => x.id !== s.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete nahi ho paaya');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {slips === null ? (
          <div className="text-xs text-slate-500">Loading…</div>
        ) : slips.length === 0 ? (
          <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl py-4 text-center">
            Abhi koi salary slip upload nahi hui. Upload hone par hi employee ko apne app me dikhegi.
          </div>
        ) : (
          slips.map((s) => (
            <div key={s.id} className="flex items-center gap-3 border border-slate-200 rounded-xl px-3 py-2">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900">{monthLabel(s.month)}</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {s.fileName} · {formatBytes(s.size)}
                </div>
              </div>
              <button onClick={() => view(s)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Dekho" aria-label="View">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => remove(s)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" title="Hatao" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Nayi salary slip upload karo (PDF / photo)</div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="sm:col-span-3 bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
          />
          <div className="sm:col-span-7">
            <FilePicker file={file} onChange={setFile} placeholder="Salary slip file chuno" />
          </div>
          <button
            onClick={upload}
            disabled={!file || !month || busy}
            className="sm:col-span-2 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
          </button>
        </div>
        {error && <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</div>}
      </div>
    </div>
  );
}

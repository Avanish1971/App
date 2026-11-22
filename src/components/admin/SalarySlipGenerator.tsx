import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, History, Plus, X, Download, Pencil, Trash2, Eye, Loader2, CheckCircle2, Search } from 'lucide-react';
import type { Employee, SalarySlip, SlipDetails, SlipLine } from '../../types';
import { uploadSalarySlipApi, getAllSalarySlipsApi, deleteSalarySlipApi, fetchEmployeeSalarySlipBlob } from '../../lib/api';
import { buildSalarySlipPdf, pdfToBase64, monthLabel, money, sumLines, amountInWords, fmtDMY } from '../../utils/salarySlipPdf';

interface Props {
  employees: Employee[];
}

interface FormLine {
  label: string;
  amount: string;
}

interface FormState {
  employeeId: string;
  headerName: string;
  employeeNo: string;
  accountCode: string;
  employeeName: string;
  designation: string;
  branchName: string;
  payslipDate: string;
  pfAccount: string;
  absentDays: string;
  earnings: FormLine[];
  deductions: FormLine[];
}

const DEFAULT_EARNINGS = ['Basic Salary', 'Dearness Allowance', 'House Allowance', 'Medical Allowance', 'Additional Allowance'];
const DEFAULT_DEDUCTIONS = ['Other Deduction', 'Provident Fund', 'ESIC Policy', 'Professional Tax', 'Mediclaim Insurance', 'L.I.C. Deduction'];
const MAX_LINES = 12;

const todayStr = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
const thisMonth = () => todayStr().slice(0, 7);

const blankForm = (): FormState => ({
  employeeId: '',
  headerName: '',
  employeeNo: '',
  accountCode: '',
  employeeName: '',
  designation: '',
  branchName: '',
  payslipDate: todayStr(),
  pfAccount: '',
  absentDays: '0',
  earnings: DEFAULT_EARNINGS.map((label) => ({ label, amount: '' })),
  deductions: DEFAULT_DEDUCTIONS.map((label) => ({ label, amount: '' })),
});

const numStr = (n?: number) => (n && n > 0 ? String(n) : '');
const num = (s: string) => {
  const v = Number(s);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : 0;
};

const baseInput =
  'bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500';
const inputCls = `w-full ${baseInput}`;
const labelCls = 'block text-[11px] font-semibold text-slate-600 mb-1';

function detailsToForm(d: SlipDetails, employeeId: string): FormState {
  return {
    employeeId,
    headerName: d.headerName || '',
    employeeNo: d.employeeNo || '',
    accountCode: d.accountCode || '',
    employeeName: d.employeeName || '',
    designation: d.designation || '',
    branchName: d.branchName || '',
    payslipDate: d.payslipDate || todayStr(),
    pfAccount: d.pfAccount || '',
    absentDays: String(d.absentDays ?? 0),
    earnings: d.earnings.map((l) => ({ label: l.label, amount: l.amount ? String(l.amount) : '' })),
    deductions: d.deductions.map((l) => ({ label: l.label, amount: l.amount ? String(l.amount) : '' })),
  };
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function SalarySlipGenerator({ employees }: Props) {
  const [view, setView] = useState<'generate' | 'history'>('generate');
  const [form, setForm] = useState<FormState>(blankForm);
  const [month, setMonth] = useState(thisMonth());
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(true);
  const [slipsError, setSlipsError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; fileName: string; title: string } | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ url: string; blob: Blob; fileName: string; title: string } | null>(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const sortedEmployees = useMemo(() => [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName)), [employees]);
  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const loadSlips = () => {
    setSlipsError(null);
    return getAllSalarySlipsApi()
      .then(setSlips)
      .catch((e) => setSlipsError(e instanceof Error ? e.message : 'History load nahi ho paayi'))
      .finally(() => setSlipsLoading(false));
  };

  useEffect(() => {
    loadSlips();
  }, []);

  // preview / viewer ke blob URL saaf karo
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  useEffect(() => () => { if (viewer) URL.revokeObjectURL(viewer.url); }, [viewer]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const pickEmployee = (id: string) => {
    const emp = empById.get(id);
    setEditingNote(null);
    setSaved(null);
    if (!emp) {
      setForm({ ...blankForm(), payslipDate: form.payslipDate });
      return;
    }
    const f = blankForm();
    f.payslipDate = form.payslipDate;
    f.employeeId = emp.id;
    f.headerName = emp.branch || '';
    f.employeeNo = emp.empId || '';
    f.accountCode = emp.bankAccount || '';
    f.employeeName = emp.fullName || '';
    f.designation = emp.designation || '';
    f.branchName = emp.branch || '';
    f.earnings[0].amount = numStr(emp.basicMonthly); // Basic Salary
    f.earnings[2].amount = numStr(emp.hraMonthly); // House Allowance
    f.earnings[4].amount = numStr(emp.specialAllowanceMonthly); // Additional Allowance
    setForm(f);
  };

  const setLine = (kind: 'earnings' | 'deductions', i: number, patch: Partial<FormLine>) =>
    setForm((f) => ({ ...f, [kind]: f[kind].map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  const addLine = (kind: 'earnings' | 'deductions') =>
    setForm((f) => (f[kind].length >= MAX_LINES ? f : { ...f, [kind]: [...f[kind], { label: '', amount: '' }] }));
  const removeLine = (kind: 'earnings' | 'deductions', i: number) =>
    setForm((f) => ({ ...f, [kind]: f[kind].filter((_, idx) => idx !== i) }));

  const toLines = (lines: FormLine[]): SlipLine[] =>
    lines.filter((l) => l.label.trim() || num(l.amount)).map((l) => ({ label: l.label.trim() || 'Other', amount: num(l.amount) }));

  const totals = useMemo(() => {
    const te = sumLines(toLines(form.earnings));
    const td = sumLines(toLines(form.deductions));
    return { te, td, net: Math.round((te - td) * 100) / 100 };
  }, [form.earnings, form.deductions]);

  const existing = slips.find((s) => s.employeeId === form.employeeId && s.month === month);

  const handleGenerate = async () => {
    setError(null);
    setSaved(null);
    if (!form.employeeId) return setError('Pehle employee chuno');
    if (!form.employeeName.trim()) return setError('Employee ka naam likho');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return setError('Salary month chuno');
    if (!form.payslipDate) return setError('Payslip date chuno');
    const earnings = toLines(form.earnings);
    const deductions = toLines(form.deductions);
    if (earnings.length === 0 || sumLines(earnings) <= 0) return setError('Kam se kam ek earning ki amount bharo');
    if (totals.net < 0) return setError('Total deduction, total earning se zyada hai');

    const details: SlipDetails = {
      headerName: form.headerName.trim() || form.branchName.trim() || 'PAYSLIP',
      employeeNo: form.employeeNo.trim(),
      accountCode: form.accountCode.trim(),
      employeeName: form.employeeName.trim(),
      designation: form.designation.trim(),
      branchName: form.branchName.trim(),
      payslipDate: form.payslipDate,
      pfAccount: form.pfAccount.trim(),
      absentDays: num(form.absentDays),
      earnings,
      deductions,
      totalEarning: totals.te,
      totalDeduction: totals.td,
      netSalary: totals.net,
    };

    setGenerating(true);
    try {
      const doc = buildSalarySlipPdf(details, month);
      const fileName = `SalarySlip-${(details.employeeNo || details.employeeName).replace(/[^\w-]+/g, '_')}-${month}.pdf`;
      const wasUpdate = Boolean(existing);
      await uploadSalarySlipApi(form.employeeId, {
        month,
        fileName,
        mimeType: 'application/pdf',
        dataBase64: pdfToBase64(doc),
        details,
      });
      const blob = doc.output('blob');
      setPreview({ url: URL.createObjectURL(blob), blob, fileName, title: `${details.employeeName} - ${monthLabel(month)}` });
      setSaved(wasUpdate ? 'Salary slip update ho gayi' : 'Salary slip generate ho gayi');
      setEditingNote(null);
      loadSlips();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Salary slip nahi ban paayi');
    } finally {
      setGenerating(false);
    }
  };

  const openViewer = async (s: SalarySlip) => {
    setBusyId(s.id);
    try {
      const blob = await fetchEmployeeSalarySlipBlob(s.employeeId, s.id);
      const name = empById.get(s.employeeId)?.fullName || s.employeeId;
      setViewer({ url: URL.createObjectURL(blob), blob, fileName: s.fileName || `SalarySlip-${s.month}.pdf`, title: `${name} - ${monthLabel(s.month)}` });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Slip nahi khul paayi');
    } finally {
      setBusyId(null);
    }
  };

  const downloadSlip = async (s: SalarySlip) => {
    setBusyId(s.id);
    try {
      const blob = await fetchEmployeeSalarySlipBlob(s.employeeId, s.id);
      saveBlob(blob, s.fileName || `SalarySlip-${s.month}.pdf`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Download nahi ho paaya');
    } finally {
      setBusyId(null);
    }
  };

  const editSlip = (s: SalarySlip) => {
    if (!s.details) return;
    setForm(detailsToForm(s.details, s.employeeId));
    setMonth(s.month);
    setPreview(null);
    setSaved(null);
    setError(null);
    setEditingNote(`${s.details.employeeName} ki ${monthLabel(s.month)} ki slip edit ho rahi hai. Badlav karke "Update Salary Slip" dabao.`);
    setView('generate');
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const deleteSlip = async (s: SalarySlip) => {
    const name = empById.get(s.employeeId)?.fullName || 'is employee';
    if (!window.confirm(`${name} ki ${monthLabel(s.month)} ki salary slip delete karni hai? Employee ke app se bhi hat jaayegi.`)) return;
    setBusyId(s.id);
    try {
      await deleteSalarySlipApi(s.employeeId, s.id);
      await loadSlips();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete nahi ho paayi');
    } finally {
      setBusyId(null);
    }
  };

  // ---- History ----
  const monthSummary = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const s of slips) {
      const cur = map.get(s.month) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += s.details?.netSalary || 0;
      map.set(s.month, cur);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([m, v]) => ({ month: m, ...v }));
  }, [slips]);

  const filteredSlips = useMemo(() => {
    const q = search.trim().toLowerCase();
    return slips.filter((s) => {
      if (filterMonth && s.month !== filterMonth) return false;
      if (!q) return true;
      const emp = empById.get(s.employeeId);
      return (emp?.fullName || s.details?.employeeName || '').toLowerCase().includes(q) || (emp?.empId || s.details?.employeeNo || '').toLowerCase().includes(q);
    });
  }, [slips, filterMonth, search, empById]);

  const tabBtn = (id: 'generate' | 'history', label: string, Icon: typeof FileText) => (
    <button
      type="button"
      onClick={() => setView(id)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${view === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );

  const lineEditor = (kind: 'earnings' | 'deductions', title: string) => (
    <div className="space-y-2">
      <div className="text-xs font-bold text-slate-700">{title}</div>
      {form[kind].map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={l.label} onChange={(e) => setLine(kind, i, { label: e.target.value })} placeholder="Description" className={`${baseInput} flex-1 min-w-0`} />
          <input type="number" min="0" step="0.01" value={l.amount} onChange={(e) => setLine(kind, i, { amount: e.target.value })} placeholder="0.00" className={`${baseInput} w-28 shrink-0 text-right`} />
          <button type="button" onClick={() => removeLine(kind, i)} className="p-1.5 text-slate-400 hover:text-rose-600" aria-label="Remove row">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {form[kind].length < MAX_LINES && (
        <button type="button" onClick={() => addLine(kind)} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
          <Plus className="w-3.5 h-3.5" /> Add row
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4" ref={topRef}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Salary Slip</h3>
          <p className="text-xs text-slate-500">Details bharo, Generate dabao, PDF slip ban jaayegi. Slip employee ke app me bhi dikhegi.</p>
        </div>
        <div className="inline-flex gap-1 bg-slate-100 p-1 rounded-xl">
          {tabBtn('generate', 'Generate Slip', FileText)}
          {tabBtn('history', `History (${slips.length})`, History)}
        </div>
      </div>

      {view === 'generate' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
            {editingNote && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">{editingNote}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>Employee *</label>
                <select value={form.employeeId} onChange={(e) => pickEmployee(e.target.value)} className={inputCls}>
                  <option value="">Employee chuno…</option>
                  {sortedEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.empId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Salary Month *</label>
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Payslip Date *</label>
                <input type="date" value={form.payslipDate} onChange={(e) => setField('payslipDate', e.target.value)} className={inputCls} />
              </div>
            </div>

            {existing && !editingNote && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                Is employee ki {monthLabel(month)} ki slip pehle se bani hui hai. Generate dabane par wo nayi slip se badal jaayegi.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>Slip ke upar ka naam (Company / Branch)</label>
                <input value={form.headerName} onChange={(e) => setField('headerName', e.target.value)} className={inputCls} placeholder="e.g. SUNDARKHED" />
              </div>
              <div>
                <label className={labelCls}>Employee No.</label>
                <input value={form.employeeNo} onChange={(e) => setField('employeeNo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Account Code</label>
                <input value={form.accountCode} onChange={(e) => setField('accountCode', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Employee Name *</label>
                <input value={form.employeeName} onChange={(e) => setField('employeeName', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Designation</label>
                <input value={form.designation} onChange={(e) => setField('designation', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Branch Name</label>
                <input value={form.branchName} onChange={(e) => setField('branchName', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Provident Fund A/c</label>
                <input value={form.pfAccount} onChange={(e) => setField('pfAccount', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Absent Days</label>
                <input type="number" min="0" step="0.5" value={form.absentDays} onChange={(e) => setField('absentDays', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="space-y-5">
              {lineEditor('earnings', 'Earnings')}
              {lineEditor('deductions', 'Deductions')}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Total Earning</span><span className="font-semibold">{money(totals.te)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Deduction</span><span className="font-semibold">{money(totals.td)}</span></div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5 mt-1.5">
                <span className="font-bold text-slate-800">Net Salary</span>
                <span className={`font-extrabold ${totals.net < 0 ? 'text-rose-600' : 'text-indigo-700'}`}>Rs. {money(totals.net)}</span>
              </div>
              {totals.net > 0 && <div className="text-[11px] text-slate-500 italic">{amountInWords(totals.net)}</div>}
            </div>

            {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">{error}</div>}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {generating ? 'Slip ban rahi hai…' : existing || editingNote ? 'Update Salary Slip' : 'Generate Salary Slip'}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 xl:sticky xl:top-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700">Slip Preview (PDF)</div>
              {preview && (
                <button
                  type="button"
                  onClick={() => saveBlob(preview.blob, preview.fileName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              )}
            </div>
            {saved && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs">
                <CheckCircle2 className="w-4 h-4" /> {saved}. Badlav karna ho to left me edit karke "Update Salary Slip" dabao.
              </div>
            )}
            {preview ? (
              <iframe title="Salary slip preview" src={preview.url} className="w-full h-[640px] border border-slate-200 rounded-xl bg-slate-50" />
            ) : (
              <div className="h-[420px] border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs text-slate-400 text-center px-6">
                Generate dabane ke baad slip yahan PDF me dikhegi
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          {/* Month wise count */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-bold text-slate-700">Mahine ke hisaab se kitni slips bani</div>
            {slipsLoading ? (
              <div className="text-xs text-slate-400">Load ho raha hai…</div>
            ) : monthSummary.length === 0 ? (
              <div className="text-xs text-slate-400">Abhi tak koi salary slip nahi bani.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMonth('')}
                  className={`px-3 py-2 rounded-xl border text-left text-xs ${filterMonth === '' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="font-bold text-slate-800">Sab mahine</div>
                  <div className="text-slate-500">{slips.length} slips</div>
                </button>
                {monthSummary.map((m) => (
                  <button
                    key={m.month}
                    type="button"
                    onClick={() => setFilterMonth(m.month)}
                    className={`px-3 py-2 rounded-xl border text-left text-xs ${filterMonth === m.month ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="font-bold text-slate-800">{monthLabel(m.month)}</div>
                    <div className="text-slate-500">{m.count} slip{m.count > 1 ? 's' : ''}{m.total > 0 ? ` • Rs. ${money(m.total)}` : ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Employee naam ya ID se dhundo" className={`${inputCls} pl-9`} />
              </div>
              <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={`${baseInput} w-auto`} />
              {filterMonth && (
                <button type="button" onClick={() => setFilterMonth('')} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                  Filter hatao
                </button>
              )}
            </div>

            {slipsError && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">{slipsError}</div>}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3 font-semibold">Employee</th>
                    <th className="py-2 pr-3 font-semibold">Month</th>
                    <th className="py-2 pr-3 font-semibold">Payslip Date</th>
                    <th className="py-2 pr-3 font-semibold text-right">Net Salary</th>
                    <th className="py-2 pr-3 font-semibold">Type</th>
                    <th className="py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {slipsLoading ? 'Load ho raha hai…' : 'Koi salary slip nahi mili'}
                      </td>
                    </tr>
                  ) : (
                    filteredSlips.map((s) => {
                      const emp = empById.get(s.employeeId);
                      const busy = busyId === s.id;
                      return (
                        <tr key={s.id} className="border-b border-slate-100">
                          <td className="py-2.5 pr-3">
                            <div className="font-semibold text-slate-800">{emp?.fullName || s.details?.employeeName || s.employeeId}</div>
                            <div className="text-[10px] text-slate-400">{emp?.empId || s.details?.employeeNo || ''}</div>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-700">{monthLabel(s.month)}</td>
                          <td className="py-2.5 pr-3 text-slate-500">{s.details?.payslipDate ? fmtDMY(s.details.payslipDate) : '—'}</td>
                          <td className="py-2.5 pr-3 text-right font-semibold text-slate-800">{s.details ? money(s.details.netSalary) : '—'}</td>
                          <td className="py-2.5 pr-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.generated ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                              {s.generated ? 'Generated' : 'Uploaded'}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button type="button" disabled={busy} onClick={() => openViewer(s)} title="Dekho" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-700 disabled:opacity-40">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button type="button" disabled={busy} onClick={() => downloadSlip(s)} title="Download" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-700 disabled:opacity-40">
                                <Download className="w-4 h-4" />
                              </button>
                              {s.details && (
                                <button type="button" disabled={busy} onClick={() => editSlip(s)} title="Edit" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-700 disabled:opacity-40">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              <button type="button" disabled={busy} onClick={() => deleteSlip(s)} title="Delete" className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Slip viewer */}
      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setViewer(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
              <div className="text-sm font-bold text-slate-800 truncate">{viewer.title}</div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => saveBlob(viewer.blob, viewer.fileName)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-semibold">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button type="button" onClick={() => setViewer(null)} className="p-1.5 text-slate-500 hover:text-slate-900" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe title="Salary slip" src={viewer.url} className="flex-1 w-full bg-slate-50" />
          </div>
        </div>
      )}
    </div>
  );
}

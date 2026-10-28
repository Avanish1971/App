import { useState } from 'react';
import { Employee, Office, Shift } from '../../types';
import { PendingDocument } from '../../lib/files';
import { FilePicker } from './FilePicker';
import { AvatarPicker, PickedPhoto } from './AvatarPicker';
import { useCompany } from '../../lib/useCompany';
import {
  UserPlus,
  X,
  CheckCircle2,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  GraduationCap,
  Landmark,
  IdCard,
  Wallet,
  CalendarDays,
  FolderOpen,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface AddEmployeeModalProps {
  offices: Office[];
  shifts: Shift[];
  employees: Employee[];
  // Employee banao, phir uske documents upload karo. failed = jo documents upload nahi ho paaye.
  onAddEmployee: (newEmployee: Employee, docs: PendingDocument[], photo: PickedPhoto | null) => Promise<{ failed: string[] }>;
  onClose: () => void;
}

interface EducationRow {
  degree: string;
  institute: string;
  year: string;
  file: File | null;
}
interface OtherDocRow {
  label: string;
  file: File | null;
}

const inputCls =
  'w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500';
const labelCls = 'block text-slate-700 font-medium mb-1';

const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-CA');
}

function Section({ icon: Icon, title, children }: { icon: typeof Key; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 font-bold text-slate-900 text-[13px]">
        <Icon className="w-4 h-4 text-indigo-600" />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function AddEmployeeModal({ offices, shifts, employees, onAddEmployee, onClose }: AddEmployeeModalProps) {
  const { code: companyCode, empPrefix } = useCompany();
  // ---- Basic ----
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [department, setDepartment] = useState('Sales');
  const [designation, setDesignation] = useState('');
  const [officeId, setOfficeId] = useState(offices[0]?.id || '');
  const [shiftId, setShiftId] = useState(shifts[0]?.id || '');
  const [reportingManager, setReportingManager] = useState('');
  const [workType, setWorkType] = useState<'IN_OFFICE' | 'FIELD_WORK'>('IN_OFFICE');
  const [joiningDate, setJoiningDate] = useState(todayISO());

  // ---- Joining mode + salary ----
  const [workMode, setWorkMode] = useState<'DIRECT' | 'TRAINING'>('DIRECT');
  const [trainingMonths, setTrainingMonths] = useState(3);
  const [trainingStipend, setTrainingStipend] = useState(10000);
  const [basicMonthly, setBasicMonthly] = useState(30000);

  // ---- Leave quota (saal bhar ki fix leave) ----
  const [casual, setCasual] = useState(12);
  const [sick, setSick] = useState(10);
  const [earned, setEarned] = useState(15);

  // ---- Identity + bank ----
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [pan, setPan] = useState('');
  const [panFile, setPanFile] = useState<File | null>(null);
  const [uan, setUan] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankFile, setBankFile] = useState<File | null>(null);

  // ---- Education + other documents ----
  const [education, setEducation] = useState<EducationRow[]>([{ degree: '', institute: '', year: '', file: null }]);
  const [otherDocs, setOtherDocs] = useState<OtherDocRow[]>([]);

  // ---- Login ----
  const nextNo = Math.max(1000, ...employees.map((e) => parseInt(String(e.empId).replace(/\D/g, ''), 10) || 0)) + 1;
  const generatedLoginId = `${(fullName.trim().split(' ')[0] || 'staff').toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff'}${nextNo}`;
  const [password] = useState(`Pass@${Math.floor(100 + Math.random() * 900)}`);
  const [copied, setCopied] = useState(false);

  // ---- Status ----
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedDocs, setFailedDocs] = useState<string[] | null>(null);

  const hra = Math.round(basicMonthly * 0.5);
  const special = Math.round(basicMonthly * 0.4);
  const grossMonthly = basicMonthly + hra + special;

  const handleCopyCredentials = () => {
    navigator.clipboard?.writeText(`${companyCode ? `Company Code: ${companyCode}\n` : ''}Login ID: ${generatedLoginId}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateEdu = (i: number, patch: Partial<EducationRow>) =>
    setEducation((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const updateOther = (i: number, patch: Partial<OtherDocRow>) =>
    setOtherDocs((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Employee ka naam likho';
    if (!email.trim()) return 'Email likho';
    if (!designation.trim()) return 'Post (Designation) likho';
    if (!officeId) return offices.length === 0 ? 'Pehle sidebar me "Office Locations" me apni office/branch jodo, phir employee add karo' : 'Branch chuno';
    if (!(basicMonthly > 0)) return 'Salary (Basic) 0 se zyada honi chahiye';
    if (workMode === 'TRAINING') {
      if (!(trainingMonths >= 1 && trainingMonths <= 24)) return 'Training 1 se 24 mahine ke beech rakho';
      if (!(trainingStipend >= 0)) return 'Training me milne wali salary sahi likho';
    }
    if (aadhaar && !/^\d{12}$/.test(aadhaar.replace(/\s/g, ''))) return 'Aadhaar number 12 ank ka hona chahiye';
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase())) return 'PAN sahi nahi hai (jaise ABCDE1234F)';
    if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) return 'IFSC code sahi nahi hai (jaise HDFC0001234)';
    if (bankAccount && !/^\d{6,18}$/.test(bankAccount.trim())) return 'Bank account number sahi nahi hai (6-18 ank)';
    if (otherDocs.some((d) => d.file && !d.label.trim())) return 'Har extra document ka naam likho';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);

    const office = offices.find((o) => o.id === officeId) || offices[0];
    const ids = new Set(employees.map((x) => x.id));
    let n = nextNo - 1000;
    while (ids.has(`emp_${String(n).padStart(3, '0')}`)) n += 1;

    const eduClean = education.filter((r) => r.degree.trim() || r.institute.trim() || r.file);
    const newEmp: Employee = {
      id: `emp_${String(n).padStart(3, '0')}`,
      empId: `${empPrefix}-${nextNo}`,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar: `https://images.unsplash.com/photo-${1534528741775 + (employees.length % 10)}?auto=format&fit=crop&w=200&h=200&q=80`,
      department,
      designation: designation.trim(),
      branch: office.city,
      officeId,
      shiftId,
      reportingManager: reportingManager.trim(),
      joiningDate,
      status: 'ACTIVE',
      employmentType: 'FULL_TIME',
      workType,
      loginId: generatedLoginId,
      password,
      ctcAnnual: grossMonthly * 12,
      basicMonthly,
      hraMonthly: hra,
      specialAllowanceMonthly: special,
      bankAccount: bankAccount.trim(),
      bankName: bankName.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      aadhaar: aadhaar.replace(/\s/g, ''),
      uan: uan.trim(),
      education: eduClean.map((r) => ({ degree: r.degree.trim(), institute: r.institute.trim(), year: r.year.trim() })),
      workMode,
      ...(workMode === 'TRAINING'
        ? {
            trainingMonths,
            trainingStipendMonthly: trainingStipend,
            trainingEndDate: addMonths(joiningDate, trainingMonths),
          }
        : {}),
      leaveQuota: { CASUAL: casual, SICK: sick, EARNED: earned },
      currentLat: office.latitude,
      currentLng: office.longitude,
      accuracyMeters: 12,
    };

    const docs: PendingDocument[] = [];
    if (aadhaarFile) docs.push({ type: 'AADHAAR', label: 'Aadhaar Card', file: aadhaarFile });
    if (panFile) docs.push({ type: 'PAN', label: 'PAN Card', file: panFile });
    if (bankFile) docs.push({ type: 'BANK_PROOF', label: 'Bank Passbook / Cancelled Cheque', file: bankFile });
    eduClean.forEach((r) => {
      if (r.file) docs.push({ type: 'EDUCATION', label: [r.degree.trim(), r.year.trim()].filter(Boolean).join(' ') || 'Education', file: r.file });
    });
    otherDocs.forEach((r) => {
      if (r.file) docs.push({ type: 'OTHER', label: r.label.trim(), file: r.file });
    });

    setSaving(true);
    try {
      const { failed } = await onAddEmployee(newEmp, docs, photo);
      if (failed.length === 0) onClose();
      else setFailedDocs(failed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Employee save nahi ho paaya');
    } finally {
      setSaving(false);
    }
  };

  // Employee ban gaya par kuch documents upload nahi hue
  if (failedDocs) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" /> Employee ban gaya, par kuch documents upload nahi hue
          </div>
          <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
            {failedDocs.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="text-slate-500">
            Inhe baad me <strong>Employee Details → Documents</strong> se dobara upload kar sakte ho.
          </p>
          <button onClick={onClose} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">
            Theek hai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">नया कर्मचारी जोड़ें (Add New Employee)</h3>
              <p className="text-[11px] text-slate-500">Profile, salary, documents, bank aur padhai ki sari details ek saath</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 1. Basic */}
          <Section icon={UserPlus} title="1. Basic Details (बुनियादी जानकारी)">
            <AvatarPicker picked={photo} onPick={setPhoto} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>पूरा नाम (Full Name) *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Rahul Sharma" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>ईमेल (Email) *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@company.in" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>फोन नंबर (Phone)</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>जॉइनिंग तारीख (Joining Date)</label>
                <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>पद (Post / Designation) *</label>
                <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Field Executive" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>विभाग (Department)</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls}>
                  <option value="Sales">Sales & Business</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Operations">Operations / Field</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance & Accounts</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>ब्रांच / ऑफिस (Branch) *</label>
                <select value={officeId} onChange={(e) => setOfficeId(e.target.value)} className={inputCls}>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.city})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>शिफ्ट (Shift)</label>
                <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} className={inputCls}>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} – {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>रिपोर्टिंग मैनेजर (Reporting Manager)</label>
                <input type="text" value={reportingManager} onChange={(e) => setReportingManager(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>काम का प्रकार (Work Type)</label>
                <select value={workType} onChange={(e) => setWorkType(e.target.value as 'IN_OFFICE' | 'FIELD_WORK')} className={inputCls}>
                  <option value="IN_OFFICE">In-Office (ऑफिस में)</option>
                  <option value="FIELD_WORK">Field Work (फील्ड में)</option>
                </select>
              </div>
            </div>
          </Section>

          {/* 2. Training / Direct + salary */}
          <Section icon={Wallet} title="2. Joining Mode & Salary (वेतन)">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { v: 'DIRECT', t: 'Direct Working', s: 'Seedha kaam par' },
                  { v: 'TRAINING', t: 'Training Period', s: 'Pehle training, phir working' },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setWorkMode(o.v)}
                  className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                    workMode === o.v ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`font-bold ${workMode === o.v ? 'text-indigo-700' : 'text-slate-800'}`}>{o.t}</div>
                  <div className="text-[10px] text-slate-500">{o.s}</div>
                </button>
              ))}
            </div>

            {workMode === 'TRAINING' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                <div>
                  <label className={labelCls}>Training kitne mahine?</label>
                  <input type="number" min={1} max={24} value={trainingMonths} onChange={(e) => setTrainingMonths(Number(e.target.value))} className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className={labelCls}>Training me salary / stipend (₹ mahina)</label>
                  <input type="number" min={0} value={trainingStipend} onChange={(e) => setTrainingStipend(Number(e.target.value))} className={`${inputCls} font-mono`} />
                </div>
                <div className="flex flex-col justify-end text-[11px] text-amber-800">
                  <span className="font-semibold">Training khatam:</span>
                  <span className="font-mono">{addMonths(joiningDate, trainingMonths || 0)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  {workMode === 'TRAINING' ? 'Training ke baad: Monthly Basic (₹)' : 'Monthly Basic Salary (₹)'}
                </label>
                <input type="number" min={0} value={basicMonthly} onChange={(e) => setBasicMonthly(Number(e.target.value))} className={`${inputCls} font-mono`} />
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-[11px] text-indigo-800 space-y-0.5">
                <div>
                  HRA ₹{hra.toLocaleString('en-IN')} · Special ₹{special.toLocaleString('en-IN')}
                </div>
                <div className="font-bold">
                  Monthly Gross ₹{grossMonthly.toLocaleString('en-IN')} · CTC ₹{(grossMonthly * 12).toLocaleString('en-IN')}/saal
                </div>
              </div>
            </div>
          </Section>

          {/* 3. Leave quota */}
          <Section icon={CalendarDays} title="3. Saal ki Fix Leave (Leave Quota)">
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Casual', v: casual, s: setCasual },
                { l: 'Sick', v: sick, s: setSick },
                { l: 'Earned', v: earned, s: setEarned },
              ].map((q) => (
                <div key={q.l}>
                  <label className={labelCls}>{q.l} Leave (din)</label>
                  <input type="number" min={0} value={q.v} onChange={(e) => q.s(Math.max(0, Number(e.target.value)))} className={`${inputCls} font-mono`} />
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-500">Employee jitni leave leta jayega, utni isme se kam hoti jayegi.</div>
          </Section>

          {/* 4. Identity */}
          <Section icon={IdCard} title="4. Aadhaar / PAN / UAN">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div>
                  <label className={labelCls}>Aadhaar Number</label>
                  <input type="text" inputMode="numeric" maxLength={14} value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} placeholder="12 ank" className={`${inputCls} font-mono`} />
                </div>
                <FilePicker file={aadhaarFile} onChange={setAadhaarFile} placeholder="Aadhaar card upload karo" />
              </div>
              <div className="space-y-2">
                <div>
                  <label className={labelCls}>PAN Number</label>
                  <input type="text" maxLength={10} value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" className={`${inputCls} font-mono`} />
                </div>
                <FilePicker file={panFile} onChange={setPanFile} placeholder="PAN card upload karo" />
              </div>
              <div>
                <label className={labelCls}>UAN (PF Number) — agar hai</label>
                <input type="text" value={uan} onChange={(e) => setUan(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
            </div>
          </Section>

          {/* 5. Bank */}
          <Section icon={Landmark} title="5. Bank Details (बैंक की जानकारी)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Bank ka naam</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Account Number</label>
                <input type="text" inputMode="numeric" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>IFSC Code</label>
                <input type="text" maxLength={11} value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="HDFC0001234" className={`${inputCls} font-mono`} />
              </div>
            </div>
            <FilePicker file={bankFile} onChange={setBankFile} placeholder="Passbook / Cancelled cheque upload karo" />
          </Section>

          {/* 6. Education */}
          <Section icon={GraduationCap} title="6. Education (पढ़ाई)">
            <div className="space-y-3">
              {education.map((r, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <input type="text" value={r.degree} onChange={(e) => updateEdu(i, { degree: e.target.value })} placeholder="Degree (B.Com, 12th...)" className={`${inputCls} sm:col-span-3`} />
                  <input type="text" value={r.institute} onChange={(e) => updateEdu(i, { institute: e.target.value })} placeholder="School / College / University" className={`${inputCls} sm:col-span-4`} />
                  <input type="text" inputMode="numeric" maxLength={4} value={r.year} onChange={(e) => updateEdu(i, { year: e.target.value })} placeholder="Saal" className={`${inputCls} sm:col-span-2 font-mono`} />
                  <div className="sm:col-span-3 flex items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      <FilePicker file={r.file} onChange={(f) => updateEdu(i, { file: f })} placeholder="Certificate" />
                    </div>
                    {education.length > 1 && (
                      <button type="button" onClick={() => setEducation((rows) => rows.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-rose-600" aria-label="Remove row">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEducation((rows) => [...rows, { degree: '', institute: '', year: '', file: null }])}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" /> Aur degree / certificate jodo
            </button>
          </Section>

          {/* 7. Other docs */}
          <Section icon={FolderOpen} title="7. Aur Documents (Resume, Offer Letter, Experience Letter...)">
            {otherDocs.map((r, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                <input type="text" value={r.label} onChange={(e) => updateOther(i, { label: e.target.value })} placeholder="Document ka naam" className={`${inputCls} sm:col-span-5`} />
                <div className="sm:col-span-6">
                  <FilePicker file={r.file} onChange={(f) => updateOther(i, { file: f })} />
                </div>
                <button type="button" onClick={() => setOtherDocs((rows) => rows.filter((_, idx) => idx !== i))} className="sm:col-span-1 p-2 text-slate-400 hover:text-rose-600" aria-label="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setOtherDocs((rows) => [...rows, { label: '', file: null }])} className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
              <Plus className="w-3.5 h-3.5" /> Document jodo
            </button>
            <div className="text-[10px] text-slate-500">Har file PDF/JPG/PNG, max 3 MB. Saari files database me save hoti hain.</div>
          </Section>

          {/* Login credentials */}
          <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>ऑटो-जनरेटेड ऐप लॉगिन (Login Credentials)</span>
              </span>
              <button type="button" onClick={handleCopyCredentials} className="px-2.5 py-1 bg-indigo-100 border border-indigo-300 rounded-lg text-indigo-800 text-[10px] font-semibold flex items-center gap-1">
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 font-medium">Company Code</div>
                <div className="font-mono font-bold text-indigo-700 text-xs mt-0.5 tracking-wider">{companyCode || '—'}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 font-medium">Login ID</div>
                <div className="font-mono font-bold text-cyan-700 text-xs mt-0.5">{generatedLoginId}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 font-medium">Password</div>
                <div className="font-mono font-bold text-emerald-700 text-xs mt-0.5">{password}</div>
              </div>
            </div>
          </div>

          {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>}

          <div className="pt-1 flex gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium disabled:opacity-50">
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{saving ? 'Save ho raha hai…' : 'कर्मचारी सुरक्षित करें (Save Employee)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

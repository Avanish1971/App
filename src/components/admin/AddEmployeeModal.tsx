import { useState } from 'react';
import { Employee, Office, Shift } from '../../types';
import { UserPlus, Building, Briefcase, MapPin, X, CheckCircle2, ShieldCheck, Key, Lock, Copy, Check } from 'lucide-react';

interface AddEmployeeModalProps {
  offices: Office[];
  shifts: Shift[];
  existingEmployeesCount: number;
  onAddEmployee: (newEmployee: Employee) => void;
  onClose: () => void;
}

export function AddEmployeeModal({
  offices,
  shifts,
  existingEmployeesCount,
  onAddEmployee,
  onClose,
}: AddEmployeeModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [department, setDepartment] = useState('Sales');
  const [designation, setDesignation] = useState('Senior Enterprise Client Partner');
  const [officeId, setOfficeId] = useState(offices[0].id);
  const [workType, setWorkType] = useState<'IN_OFFICE' | 'FIELD_WORK'>('FIELD_WORK');
  const [basicMonthly, setBasicMonthly] = useState(50000);

  // Auto-generated Login Credentials
  const generatedLoginId = (
    fullName.trim()
      ? `${fullName.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}${1000 + existingEmployeesCount + 1}`
      : `staff${1000 + existingEmployeesCount + 1}`
  );
  const [password] = useState(`Pass@${Math.floor(100 + Math.random() * 900)}`);
  const [copied, setCopied] = useState(false);

  const handleCopyCredentials = () => {
    navigator.clipboard?.writeText(`Login ID: ${generatedLoginId}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const newId = `emp_${String(existingEmployeesCount + 1).padStart(3, '0')}`;
    const newEmpId = `ACME-${1000 + existingEmployeesCount + 1}`;
    const selectedOffice = offices.find((o) => o.id === officeId) || offices[0];

    const hraMonthly = Math.round(basicMonthly * 0.5);
    const specialAllowance = Math.round(basicMonthly * 0.4);
    const ctcAnnual = (basicMonthly + hraMonthly + specialAllowance) * 12;

    const newEmp: Employee = {
      id: newId,
      empId: newEmpId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar: `https://images.unsplash.com/photo-${1534528741775 + (existingEmployeesCount % 10)}?auto=format&fit=crop&w=200&h=200&q=80`,
      department,
      designation,
      branch: selectedOffice.city,
      officeId,
      shiftId: shifts[0].id,
      reportingManager: 'Amitabh Verma (Director Sales)',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      employmentType: 'FULL_TIME',
      workType, // Crucial field requested by user!
      loginId: generatedLoginId,
      password: password,
      ctcAnnual,
      basicMonthly,
      hraMonthly,
      specialAllowanceMonthly: specialAllowance,
      bankAccount: `HDFC000${Math.floor(10000000 + Math.random() * 90000000)}`,
      ifsc: 'HDFC0000240',
      pan: `ABCDE${Math.floor(1000 + Math.random() * 9000)}Z`,
      uan: `101${Math.floor(100000000 + Math.random() * 900000000)}`,
      currentLat: selectedOffice.latitude,
      currentLng: selectedOffice.longitude,
      accuracyMeters: 12,
    };

    onAddEmployee(newEmp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">नया कर्मचारी जोड़ें (Add New Employee)</h3>
              <p className="text-[11px] text-slate-500">
                Configure profile, office assignment & In-Office vs Field Work mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* USER SPECIFIC REQUIREMENT: WORK TYPE SELECTION (FIELD WORK vs IN-OFFICE) */}
          {/* Personal & Designation Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">पूरा नाम (Full Name) *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">ईमेल पता (Email) *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul.sharma@acme.in"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">विभाग (Department)</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Sales">Sales & Business</option>
                <option value="Engineering">Engineering</option>
                <option value="Operations">Operations / Field</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance & Accounts</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">पद (Designation)</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Field Executive"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">बेस ऑफिस (Base Branch)</label>
              <select
                value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">फोन नंबर (Phone)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">मासिक बेसिक सैलरी (Monthly Basic ₹)</label>
              <input
                type="number"
                value={basicMonthly}
                onChange={(e) => setBasicMonthly(Number(e.target.value))}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* USER SPECIFIC REQUIREMENT: AUTOMATIC LOGIN ID & PASSWORD GENERATION */}
          <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>ऑटो-जनरेटेड ऐप लॉगिन विवरण (Auto-Generated Login Credentials)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-100 border border-indigo-300 rounded-lg text-indigo-800 text-[10px] font-semibold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Login Details'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 font-medium">Login ID (लॉगिन आईडी)</div>
                <div className="font-mono font-bold text-cyan-700 text-xs mt-0.5 tracking-wide">
                  {generatedLoginId}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <div className="text-[10px] text-slate-500 font-medium">Password (पासवर्ड)</div>
                <div className="font-mono font-bold text-emerald-700 text-xs mt-0.5 tracking-wider">
                  {password}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 leading-tight">
              💡 यह कर्मचारी मोबाइल ऐप पर इसी <strong>Login ID ({generatedLoginId})</strong> और <strong>Password ({password})</strong> से लॉगिन करेगा।
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-xl font-medium"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>कर्मचारी सुरक्षित करें (Save Employee)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

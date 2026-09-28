import { useState } from 'react';
import { Employee } from '../../types';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, Building2, Briefcase } from 'lucide-react';

interface MobileLoginScreenProps {
  employees: Employee[];
  onLoginSuccess: (employee: Employee) => void;
}

export function MobileLoginScreen({ employees, onLoginSuccess }: MobileLoginScreenProps) {
  const [loginId, setLoginId] = useState('avanish1001');
  const [password, setPassword] = useState('Pass@123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const trimmedId = loginId.trim().toLowerCase();
      // Match by loginId, empId, or email prefix
      const found = employees.find(
        (emp) =>
          emp.loginId?.toLowerCase() === trimmedId ||
          emp.empId.toLowerCase() === trimmedId ||
          emp.email.toLowerCase() === trimmedId
      );

      if (!found) {
        setErrorMsg('गलत लॉगिन आईडी (Login ID not found). कृपया एडमिन द्वारा दिया गया आईडी दर्ज करें।');
        setLoading(false);
        return;
      }

      // USER REQUIREMENT: When employee leaves company, ID is deactivated and login is strictly blocked!
      if (found.status === 'INACTIVE') {
        const reasonText = found.deactivationReason ? ` (कारण: ${found.deactivationReason})` : '';
        setErrorMsg(
          `🚫 खाता निष्क्रिय है (Account Deactivated): कंपनी छोड़ने के कारण आपका ऐप एक्सेस एडमिन द्वारा समाप्त कर दिया गया है${reasonText}। आप ऐप में लॉगिन नहीं कर सकते।`
        );
        setLoading(false);
        return;
      }

      if (found.password && found.password !== password.trim()) {
        setErrorMsg('गलत पासवर्ड (Incorrect Password). कृपया सही पासवर्ड दर्ज करें।');
        setLoading(false);
        return;
      }

      setLoading(false);
      onLoginSuccess(found);
    }, 400);
  };

  const handleQuickSelect = (emp: Employee) => {
    setLoginId(emp.loginId || emp.empId);
    setPassword(emp.password || 'Pass@123');
    setErrorMsg(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 text-slate-100 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 overflow-y-auto">
      {/* Top Branding */}
      <div className="pt-4 text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-indigo-600/40">
          G
        </div>
        <div>
          <h2 className="font-extrabold text-white text-lg tracking-tight">GeoAttend HRMS™</h2>
          <p className="text-[11px] text-slate-400">कर्मचारी मोबाइल पोर्टल (Employee Login)</p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-[10px] text-indigo-300 font-medium">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Zero-Touch Auto Presence Active</span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-3.5 my-auto py-2">
        {errorMsg && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-[11px] leading-tight text-center">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-[11px] text-slate-300 font-medium mb-1">
            लॉगिन आईडी (Login ID / Employee ID)
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. avanish1001, ACME-1001"
              required
              className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-300 font-medium mb-1">
            पासवर्ड (Password)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 mt-1"
        >
          <span>{loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें (Sign In)'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Quick Demo Credential Autofill */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="text-[10px] text-slate-400 font-medium text-center">
            त्वरित परीक्षण (Click to autofill demo employee):
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {employees.slice(0, 6).map((emp) => {
              const isInactive = emp.status === 'INACTIVE';
              return (
                <button
                  type="button"
                  key={emp.id}
                  onClick={() => handleQuickSelect(emp)}
                  className={`p-1.5 rounded-lg border text-left text-[10px] transition-colors truncate ${
                    isInactive
                      ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                      : loginId === (emp.loginId || emp.empId)
                      ? 'bg-indigo-950 border-indigo-600 text-white font-semibold'
                      : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate font-medium flex items-center justify-between gap-1">
                    <span className="truncate flex items-center gap-1">
                      {emp.workType === 'FIELD_WORK' ? (
                        <Briefcase className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                      ) : (
                        <Building2 className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                      )}
                      <span className="truncate">{emp.fullName.split(' ')[0]}</span>
                    </span>
                    {isInactive && (
                      <span className="text-[8px] bg-rose-900 text-rose-200 px-1 py-0.2 rounded uppercase font-bold shrink-0">
                        Blocked
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    ID: {emp.loginId}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </form>

      {/* Security Guarantee Note */}
      <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[10px] text-slate-400 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span className="leading-tight">
          <strong>ऑटोमैटिक उपस्थिति:</strong> ऑफिस में प्रवेश करते ही आपकी हाजिरी अपने आप <strong>PRESENT</strong> लग जाएगी, और बाहर जाते ही ऑटोमैटिक चेक-आउट/लॉगआउट हो जाएगा।
        </span>
      </div>
    </div>
  );
}

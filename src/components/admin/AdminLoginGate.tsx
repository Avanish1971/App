import { useRef, useState, FormEvent } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, Building2, ImagePlus, Copy, Check, KeyRound, CheckCircle2 } from 'lucide-react';
import { adminLoginApi, registerCompanyApi } from '../../lib/api';
import { setToken } from '../../lib/auth';
import { compressLogo } from '../../lib/image';

interface AdminLoginGateProps {
  onLoggedIn: () => void;
}

const inputCls =
  'w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500';

export function AdminLoginGate({ onLoggedIn }: AdminLoginGateProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [logo, setLogo] = useState<{ base64: string; mime: string; previewUrl: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ name: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setErrorMsg(null);
  };

  const pickLogo = async (f: File | undefined) => {
    if (!f) return;
    setErrorMsg(null);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) return setErrorMsg('Logo PNG, JPG ya WEBP hona chahiye');
    try {
      setLogo(await compressLogo(f));
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Logo nahi khul paaya');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup') {
      if (!companyName.trim()) return setErrorMsg('Company ka naam likho');
      if (password.length < 8) return setErrorMsg('Password kam se kam 8 akshar ka rakho');
      if (password !== confirm) return setErrorMsg('Dono password alag hain');
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { token } = await adminLoginApi(email.trim(), password);
        setToken('admin', token);
        onLoggedIn();
      } else {
        const res = await registerCompanyApi({
          companyName: companyName.trim(),
          email: email.trim(),
          password,
          ...(logo ? { logoBase64: logo.base64, logoMime: logo.mime } : {}),
        });
        setToken('admin', res.token);
        // Company Code dikhao, phir portal kholo
        setCreated(res.company);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Nahi ho paaya');
      setLoading(false);
    }
  };

  // Account ban gaya: Company Code dikhao
  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-white to-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Account Ban Gaya!</h2>
            <p className="text-xs text-slate-500 mt-1">{created.name} ke admin ab aap hain</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase font-bold text-indigo-500 tracking-wide">
              <KeyRound className="w-3.5 h-3.5" /> Aapka Company Code
            </div>
            <div className="font-mono font-extrabold text-3xl text-indigo-800 tracking-[0.3em]">{created.code}</div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(created.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 text-[11px] font-semibold inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Employees ko mobile app me login karte waqt ye <strong>Company Code</strong> dena hoga. Ye code baad me bhi upar company ke naam par click karke mil jayega.
          </p>
          <button onClick={onLoggedIn} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2">
            <span>Portal Kholo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-white to-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-indigo-600/30">
            G
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{isSignup ? 'Apni Company Ka Account Banao' : 'Enterprise Admin Portal'}</h2>
            <p className="text-xs text-slate-500">{isSignup ? 'Account banate hi aap apni company ke admin ban jaoge' : 'Admin login karke aage badho'}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isSignup ? 'Aapka data sirf aapko dikhega' : 'Sirf authorized admin'}</span>
          </div>
        </div>

        {/* Login / Signup toggle */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button type="button" onClick={() => switchMode('login')} className={`py-2 rounded-lg transition-colors ${!isSignup ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
            Login
          </button>
          <button type="button" onClick={() => switchMode('signup')} className={`py-2 rounded-lg transition-colors ${isSignup ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
            Naya Account Banao
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center leading-relaxed">{errorMsg}</div>
          )}

          {isSignup && (
            <>
              <div>
                <label className="block text-xs text-slate-700 font-medium mb-1.5">Company ka naam *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={companyName} maxLength={120} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Sharma Traders Pvt Ltd" required className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-medium mb-1.5">Company Logo (optional)</label>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ''; }} />
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-3 border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl px-3 py-2.5 text-xs text-slate-500">
                  {logo ? <img src={logo.previewUrl} alt="Logo" className="h-8 max-w-[80px] object-contain" /> : <ImagePlus className="w-4 h-4" />}
                  <span>{logo ? 'Logo badlo' : 'Logo chuno (PNG / JPG)'}</span>
                </button>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-slate-700 font-medium mb-1.5">{isSignup ? 'Aapki Email (admin login ke liye) *' : 'Admin Email'}</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" autoComplete="username" required className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-medium mb-1.5">Password {isSignup && '(kam se kam 8 akshar) *'}</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs text-slate-700 font-medium mb-1.5">Password dobara likho *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" required className={inputCls} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Ek minute…' : isSignup ? 'Account Banao' : 'Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

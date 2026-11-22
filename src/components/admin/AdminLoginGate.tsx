import { useEffect, useRef, useState, FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, ImagePlus, Copy, Check, KeyRound, CheckCircle2 } from 'lucide-react';
import { adminLoginApi, registerCompanyApi } from '../../lib/api';
import { setToken } from '../../lib/auth';
import { compressLogo } from '../../lib/image';
import illustrationUrl from '../../assets/images/login-illustration.png';

interface AdminLoginGateProps {
  onLoggedIn: () => void;
}

const ORANGE = '#f06426';
const DARK = '#242424';

const inputCls =
  'w-full h-11 px-3.5 bg-[#fafafa] border border-[#e5e5e5] rounded-lg text-[#242424] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#f06426] focus:bg-white transition-colors';
const labelCls = 'block text-sm font-semibold text-[#242424] mb-2';

// Left panel ke text (dots se badalte hain)
const SLIDES = [
  { title: 'Onboarding New Talent with Digital HRMS', sub: 'Everything you need in an easily customizable dashboard' },
  { title: 'Attendance, Leaves & Payroll in One Place', sub: 'Track your whole team in real time, from any device' },
  { title: 'Smart Reports for Smarter Decisions', sub: 'Monthly attendance, shifts and expenses at a glance' },
];

function BrandLogo() {
  return (
    <svg width="76" height="56" viewBox="0 0 76 56" aria-hidden="true">
      <polygon points="22,0 56,0 34,27 0,27" fill={ORANGE} />
      <polygon points="42,29 76,29 54,56 20,56" fill={DARK} />
    </svg>
  );
}

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
  const [slide, setSlide] = useState(0); // sirf design: left panel ke dots

  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f4f5]">
        <div className="w-full max-w-md bg-white border border-[#e5e5e5] rounded-2xl p-8 shadow-sm space-y-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#242424]">Account Ban Gaya!</h2>
            <p className="text-xs text-slate-500 mt-1">{created.name} ke admin ab aap hain</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase font-bold tracking-wide" style={{ color: ORANGE }}>
              <KeyRound className="w-3.5 h-3.5" /> Aapka Company Code
            </div>
            <div className="font-mono font-extrabold text-3xl text-[#242424] tracking-[0.3em]">{created.code}</div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(created.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 text-[#242424]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Employees ko mobile app me login karte waqt ye <strong>Company Code</strong> dena hoga. Ye code baad me bhi upar company ke naam par click karke mil jayega.
          </p>
          <button onClick={onLoggedIn} className="w-full h-11 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 hover:opacity-90" style={{ background: DARK }}>
            <span>Portal Kholo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left: illustration panel */}
      <div className="hidden md:flex w-1/2 bg-[#e7e7e7] flex-col items-center justify-center px-8 py-10 text-center">
        <img src={illustrationUrl} alt="" className="w-full max-w-[455px] h-auto select-none" draggable={false} />
        <div className="mt-6 min-h-[84px]">
          <h2 key={slide} className="text-[22px] leading-snug font-bold text-[#242424]">{SLIDES[slide].title}</h2>
          <p className="text-base text-[#333] mt-1">{SLIDES[slide].sub}</p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className="h-3 rounded-full transition-all"
              style={{ width: i === slide ? 36 : 12, background: i === slide ? ORANGE : '#d6d6d6' }}
            />
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-[350px]">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <div className="text-center mt-4 mb-7">
            <h1 className="text-xl font-bold text-[#242424]">{isSignup ? 'Create Account' : 'Welcome Back !'}</h1>
            <p className="text-xs text-slate-500 mt-1.5">{isSignup ? 'Set up your company account in a minute' : 'Please enter your details'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs text-center leading-relaxed">{errorMsg}</div>
            )}

            {isSignup && (
              <>
                <div>
                  <label className={labelCls}>Company Name *</label>
                  <input type="text" value={companyName} maxLength={120} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Sharma Traders Pvt Ltd" required className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Company Logo (optional)</label>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ''; }} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-3 border border-dashed border-[#d6d6d6] hover:border-[#f06426] rounded-lg px-3.5 h-11 text-sm text-slate-500 bg-[#fafafa]">
                    {logo ? <img src={logo.previewUrl} alt="Logo" className="h-7 max-w-[80px] object-contain" /> : <ImagePlus className="w-4 h-4" />}
                    <span>{logo ? 'Change logo' : 'Choose logo (PNG / JPG)'}</span>
                  </button>
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Email Address{isSignup && ' *'}</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" autoComplete="username" required className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Password{isSignup && ' (min 8 characters) *'}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  className={`${inputCls} pr-11`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Show or hide password">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className={labelCls}>Confirm Password *</label>
                <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" required className={inputCls} />
              </div>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-[#242424] cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-[#f06426]" />
                  Remember me
                </label>
                <span className="text-slate-500">Forgot Password?</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              style={{ background: DARK }}
            >
              <span>{loading ? 'Please wait…' : isSignup ? 'Create Account' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-[#242424] leading-relaxed">
              By {isSignup ? 'creating an account' : 'logging in'}, you agree to our <span className="text-blue-700">Terms of Service</span> and <span className="text-blue-700">Privacy Policy</span>
            </p>

            <p className="text-center text-xs text-slate-600">
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')} className="font-semibold text-blue-700 hover:underline">
                {isSignup ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

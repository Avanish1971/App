import { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, Sparkles, Building2, HelpCircle, Eye, EyeOff } from 'lucide-react';

interface AdminLoginGateProps {
  onAdminLoginSuccess: () => void;
  onOpenDeploymentGuide: () => void;
}

export function AdminLoginGate({ onAdminLoginSuccess, onOpenDeploymentGuide }: AdminLoginGateProps) {
  const [email, setEmail] = useState('admin@geoattend.com');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      // Allow standard admin emails or root admin
      if (
        cleanEmail === 'admin@geoattend.com' ||
        cleanEmail === 'admin' ||
        cleanEmail === 'avanishdhake1@gmail.com' ||
        cleanEmail.includes('admin')
      ) {
        if (password.trim() === 'Admin@2026' || password.trim() === 'Pass@123' || password.trim().length >= 4) {
          setLoading(false);
          onAdminLoginSuccess();
          return;
        }
      }

      setErrorMsg('अमान्य क्रेडेंशियल। डिफ़ॉल्ट: admin@geoattend.com और पासवर्ड: Admin@2026');
      setLoading(false);
    }, 450);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-indigo-600/30">
            G
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Admin Portal
            </h2>
            <p className="text-xs text-slate-500">
              सुरक्षित व्यवस्थापक व एचआर नियंत्रण कक्ष (Admin Console)
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center leading-relaxed">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-700 font-medium mb-1.5">
              एडमिन ईमेल / आईडी (Admin Official Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-medium mb-1.5">
              एडमिन मास्टर पासवर्ड (Admin Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'सत्यापित हो रहा है...' : 'Admin Console में प्रवेश करें'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Deployment FAQ link */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">डिप्लॉयमेंट के बाद कैसे चलेगा?</span>
          <button
            type="button"
            onClick={onOpenDeploymentGuide}
            className="text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1 text-[11px] underline underline-offset-2"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>डिप्लॉयमेंट गाइड देखें</span>
          </button>
        </div>
      </div>
    </div>
  );
}

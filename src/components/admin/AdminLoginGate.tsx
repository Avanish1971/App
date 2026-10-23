import { useState, FormEvent } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { adminLoginApi } from '../../lib/api';
import { setToken } from '../../lib/auth';

interface AdminLoginGateProps {
  onLoggedIn: () => void;
}

export function AdminLoginGate({ onLoggedIn }: AdminLoginGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const { token } = await adminLoginApi(email.trim(), password);
      setToken('admin', token);
      onLoggedIn();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Login nahi ho paaya');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-white to-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-indigo-600/30">
            G
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Enterprise Admin Portal</h2>
            <p className="text-xs text-slate-500">Admin login karke aage badho</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sirf authorized admin</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center leading-relaxed">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-700 font-medium mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                autoComplete="username"
                required
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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
            <span>{loading ? 'Jaanch ho rahi hai…' : 'Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

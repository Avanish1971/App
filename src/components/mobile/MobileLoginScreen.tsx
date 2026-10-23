import { useState, FormEvent } from 'react';
import { Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { employeeLoginApi } from '../../lib/api';
import { setToken } from '../../lib/auth';

interface MobileLoginScreenProps {
  onLoggedIn: () => void;
}

export function MobileLoginScreen({ onLoggedIn }: MobileLoginScreenProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const { token } = await employeeLoginApi(loginId.trim(), password);
      setToken('employee', token);
      onLoggedIn();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Login nahi ho paaya');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 py-8 bg-gradient-to-b from-blue-50 via-white to-slate-50 text-slate-800 font-sans antialiased">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-500/30">
            G
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Employee Login</h1>
          <p className="text-xs text-slate-500">Apni Login ID aur password daalo (HR se milta hai)</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center leading-relaxed">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-700 font-medium mb-1.5">Login ID</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Apni Login ID"
                autoCapitalize="none"
                autoComplete="username"
                required
                className="w-full pl-10 pr-3 py-3 bg-white border border-blue-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-10 py-3 bg-white border border-blue-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-500"
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
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:opacity-90 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-transform active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Jaanch ho rahi hai…' : 'Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

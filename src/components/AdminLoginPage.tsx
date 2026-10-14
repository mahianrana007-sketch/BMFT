import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { AuthService } from '../services/firebase';
import { AppUser } from '../types';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
  onBackToPublic: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToPublic,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('এডমিন আইডি বা ইমেইল প্রদান করুন।');
      return;
    }
    if (!password.trim()) {
      setError('পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.loginAdmin(identifier, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'লগইন ব্যর্থ হয়েছে। সঠিক এডমিন আইডি ও পাসওয়ার্ড নিশ্চিত করুন।');
      }
    } catch {
      setError('লগইন করার সময় নেটওয়ার্ক সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-[#04160d] via-[#020b06] to-[#010804] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Back Link */}
        <button
          onClick={onBackToPublic}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>পাবলিক ওয়েবসাইটে ফিরে যান</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white font-sport tracking-wide">
              এডমিন সিকিউর পোর্টাল
            </h1>
            <p className="text-xs text-slate-400 font-bn mt-1">
              MR Football Club & League ম্যানেজমেন্ট ও সেটিংস অ্যাক্সেস
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bn animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 font-bn">
              এডমিন আইডি বা ইমেইল
            </label>
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="আপনার এডমিন আইডি বা ইমেইল লিখুন"
              className="w-full px-4 py-3 bg-black/60 border border-emerald-950 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 font-bn">
              এডমিন পাসওয়ার্ড
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="গোপন পাসওয়ার্ড প্রদান করুন"
                className="w-full px-4 py-3 pr-11 bg-black/60 border border-emerald-950 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-emerald-400 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 disabled:text-slate-600 text-black text-sm font-black font-sport flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>নিরাপদ প্রবেশ (Login)</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer Note */}
        <div className="pt-2 border-t border-emerald-950/60 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400/80 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Firebase Authentication Security Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

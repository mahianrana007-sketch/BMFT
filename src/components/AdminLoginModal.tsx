import React, { useState } from 'react';
import { Lock, Crown, X, Eye, EyeOff, AlertCircle, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import { AppUser } from '../types';
import { AuthService } from '../services/firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  currentUser: AppUser | null;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  onLogout: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLoginSuccess,
  onLogout,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('এডমিন আইডি বা ইমেইল প্রদান করুন');
      return;
    }
    if (!password.trim()) {
      setError('পাসওয়ার্ড প্রদান করুন');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.loginAdmin(identifier, password);
      if (res.success && res.user) {
        setIdentifier('');
        setPassword('');
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'ভুল এডমিন আইডি বা পাসওয়ার্ড!');
      }
    } catch {
      setError('লগইন প্রক্রিয়াকরণে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-[#07190f] border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {currentUser?.role === 'admin' ? (
              <Crown className="w-6 h-6 text-amber-400" />
            ) : (
              <Lock className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-sport">
              {currentUser?.role === 'admin' ? 'এডমিন অ্যাকাউন্ট প্রোফাইল' : 'এডমিন নিরাপদ লগইন'}
            </h3>
            <p className="text-xs text-slate-400 font-bn">
              {currentUser?.role === 'admin'
                ? 'বর্তমানে আপনি এডমিন হিসেবে লগইন আছেন'
                : 'ক্লাব ও লিগ ম্যানেজমেন্ট নিয়ন্ত্রণের জন্য লগইন করুন'}
            </p>
          </div>
        </div>

        {currentUser?.role === 'admin' ? (
          /* Logged In Status View */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/50 border border-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bn">বর্তমান ব্যবহারকারী:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black uppercase font-mono">
                  এডমিন (Admin)
                </span>
              </div>
              <p className="text-sm font-bold text-white font-sport">{currentUser.name}</p>
              <p className="text-xs text-slate-400 font-mono">ID: {currentUser.userId}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/40 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট (Logout)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        ) : (
          /* Clean Secure Login Form */
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-300 font-bn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-bn">
                এডমিন আইডি বা ইমেইল *
              </label>
              <input
                type="text"
                required
                autoFocus
                autoComplete="username"
                placeholder="এডমিন আইডি লিখুন"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-bn">
                পাসওয়ার্ড *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="গোপন পাসওয়ার্ড প্রদান করুন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 disabled:text-slate-600 text-black font-bold text-xs font-sport flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>নিরাপদ লগইন</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

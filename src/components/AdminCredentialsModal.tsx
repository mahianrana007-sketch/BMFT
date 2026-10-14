import React, { useState, useEffect } from 'react';
import { AppUser, UserAccountConfig } from '../types';
import { getUserAccounts, saveUserAccounts, resetCredentialsToDefault } from '../data/userAccounts';
import { X, Crown, Shield, Eye, EyeOff, Save, AlertCircle, Check, RotateCcw } from 'lucide-react';

interface AdminCredentialsModalProps {
  isOpen: boolean;
  currentUser: AppUser | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export const AdminCredentialsModal: React.FC<AdminCredentialsModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onRefresh,
}) => {
  const [accounts, setAccounts] = useState<UserAccountConfig[]>([]);
  const [revealMap, setRevealMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && currentUser?.role === 'admin') {
      setAccounts(getUserAccounts());
      setError('');
      setSuccess('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const toggleReveal = (userId: string) => {
    setRevealMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleAccountChange = (idx: number, field: 'userId' | 'pass' | 'name', value: string) => {
    const updated = [...accounts];
    updated[idx] = { ...updated[idx], [field]: value };
    setAccounts(updated);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check for empty fields
    for (const acc of accounts) {
      if (!acc.userId.trim() || !acc.pass.trim()) {
        setError(`"${acc.name}" এর ইউজার আইডি এবং পাসওয়ার্ড উভয়ই প্রদান করতে হবে!`);
        return;
      }
    }

    saveUserAccounts(accounts);
    setSuccess('সকল ইউজার আইডি ও পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!');
    if (onRefresh) onRefresh();
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('আপনি কি নির্ধারিত ডিফল্ট ক্রেডেনশিয়াল্সে রিসেট করতে চান?')) {
      const def = resetCredentialsToDefault();
      setAccounts(def);
      setSuccess('ডিফল্ট আইডি ও পাসওয়ার্ডে ফিরিয়ে আনা হয়েছে।');
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#07190f] border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden my-auto relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sport">
                  এডমিন সিকিউরিটি ও ইউজার ক্রেডেনশিয়াল্স
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                এই তথ্য শুধুমাত্র আপনি (এডমিন) দেখতে ও পরিবর্তন করতে পারবেন
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSaveAll} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {accounts.map((acc, idx) => {
            const isAdm = acc.role === 'admin';
            const isRevealed = Boolean(revealMap[acc.userId || idx]);

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isAdm
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-black/50 border-emerald-950 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isAdm ? (
                      <Crown className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Shield className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-bold text-white font-sport">
                      {isAdm ? 'টুর্নামেন্ট এডমিন (Full Control)' : `দল মালিক ${acc.ownerIndex} (${acc.defaultTeamName})`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleReveal(acc.userId || String(idx))}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isRevealed ? 'লুকান' : 'পাসওয়ার্ড দেখুন'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      ইউজার আইডি (User ID)
                    </label>
                    <input
                      type="text"
                      required
                      value={acc.userId}
                      onChange={(e) => handleAccountChange(idx, 'userId', e.target.value)}
                      className="w-full px-3 py-2 bg-black/80 border border-emerald-950 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      পাসওয়ার্ড (Password)
                    </label>
                    <input
                      type={isRevealed ? 'text' : 'password'}
                      required
                      value={acc.pass}
                      onChange={(e) => handleAccountChange(idx, 'pass', e.target.value)}
                      className="w-full px-3 py-2 bg-black/80 border border-emerald-950 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-3 border-t border-emerald-950 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
              title="ডিফল্ট পাসওয়ার্ডে রিসেট করুন"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>ডিফল্টে রিসেট</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>সকল ক্রেডেনশিয়াল্স সংরক্ষণ</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

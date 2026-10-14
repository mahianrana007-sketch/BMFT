import React, { useState, useEffect } from 'react';
import { AppUser, Team } from '../types';
import { updateOwnerCredentials, getOwnerTeam } from '../data/userAccounts';
import { X, Shield, Save, Upload, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getSafeTeamLogo, DEFAULT_TEAM_LOGO } from '../utils/media';

interface OwnerSettingsModalProps {
  isOpen: boolean;
  currentUser: AppUser | null;
  teams: Team[];
  onClose: () => void;
  onUpdateTeam: (team: Team) => void;
  onCredentialsUpdated: (newUserId: string) => void;
}

export const OwnerSettingsModal: React.FC<OwnerSettingsModalProps> = ({
  isOpen,
  currentUser,
  teams,
  onClose,
  onUpdateTeam,
  onCredentialsUpdated,
}) => {
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentTeam = currentUser ? getOwnerTeam(currentUser, teams) : null;

  useEffect(() => {
    if (isOpen && currentUser) {
      if (currentTeam) {
        setTeamName(currentTeam.name);
        setTeamLogo(currentTeam.logoUrl);
      }
      setNewUserId(currentUser.userId);
      setNewPass('');
      setConfirmPass('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, currentUser, currentTeam]);

  if (!isOpen || !currentUser || currentUser.role !== 'owner') return null;

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('ছবির আকার সর্বোচ্চ ৩ মেগাবাইট হতে হবে!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setTeamLogo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!teamName.trim()) {
      setError('দলের নাম খালি রাখা যাবে না');
      return;
    }
    if (!newUserId.trim()) {
      setError('ইউজার আইডি প্রদান করতে হবে');
      return;
    }

    let credentialsUpdated = false;

    // Check if updating password or username
    if (newPass.trim() || newUserId.trim() !== currentUser.userId) {
      if (newPass && newPass !== confirmPass) {
        setError('পাসওয়ার্ড ও নিশ্চিত পাসওয়ার্ড মিলেনি');
        return;
      }
      if (newPass && newPass.length < 3) {
        setError('পাসওয়ার্ড কমপক্ষে ৩ অক্ষরের হতে হবে');
        return;
      }

      const res = updateOwnerCredentials(
        currentUser.userId,
        newUserId.trim(),
        newPass.trim() || '5891',
        teamName.trim()
      );

      if (!res.success) {
        setError(res.error || 'আইডি বা পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে');
        return;
      }
      credentialsUpdated = true;
    }

    // Update Team details
    if (currentTeam) {
      const updatedTeam: Team = {
        ...currentTeam,
        name: teamName.trim(),
        logoUrl: teamLogo.trim() || DEFAULT_TEAM_LOGO,
        ownerUserId: newUserId.trim(),
        ownerName: newUserId.trim(),
      };
      onUpdateTeam(updatedTeam);
    }

    setSuccess('দলের তথ্য ও আইডি/পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');

    if (credentialsUpdated) {
      onCredentialsUpdated(newUserId.trim());
    }

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg bg-[#07190f] border-2 border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden my-auto relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sport">
                ওনার পোর্টাল: দল ও অ্যাকাউন্ট সেটিংস
              </h3>
              <p className="text-xs text-slate-400">
                দলের নাম, লোগো এবং আপনার আইডি ও পাসওয়ার্ড পরিবর্তন করুন
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

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Section 1: Team Name and Logo */}
          <div className="p-4 rounded-xl bg-black/40 border border-emerald-950 space-y-3">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              ১. দলের নাম ও লোগো পরিবর্তন
            </span>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">দলের নাম (Team Name) *</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="যেমন: পদ্মা ওয়ারিয়র্স"
                className="w-full px-3.5 py-2.5 bg-black/70 border border-emerald-950 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-400 bg-slate-900 shrink-0 shadow-md">
                <img
                  src={getSafeTeamLogo(teamLogo)}
                  alt="Team Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                  }}
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>নতুন লোগো আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  placeholder="অথবা অনলাইন ইমেজ লিংক (https://...)"
                  value={teamLogo}
                  onChange={(e) => setTeamLogo(e.target.value)}
                  className="w-full px-3 py-1 bg-black/60 border border-emerald-950 rounded-lg text-white text-[11px] placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Owner ID and Password */}
          <div className="p-4 rounded-xl bg-black/40 border border-emerald-950 space-y-3">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              ২. ওনার আইডি ও পাসওয়ার্ড পরিবর্তন
            </span>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                নতুন ইউজার আইডি (New User ID) *
              </label>
              <input
                type="text"
                required
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="আপনার নতুন আইডি দিন"
                className="w-full px-3.5 py-2.5 bg-black/70 border border-emerald-950 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  নতুন পাসওয়ার্ড (New Password)
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="অপরিবর্তিত রাখতে খালি রাখুন"
                    className="w-full px-3 py-2 bg-black/70 border border-emerald-950 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  পাসওয়ার্ড নিশ্চিত করুন (Confirm)
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="পুনরায় লিখুন"
                  className="w-full px-3 py-2 bg-black/70 border border-emerald-950 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>পরিবর্তন সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

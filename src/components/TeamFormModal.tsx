import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { X, Shield, Check, AlertCircle, Upload } from 'lucide-react';
import { getSafeTeamLogo, DEFAULT_TEAM_LOGO } from '../utils/media';

interface TeamFormModalProps {
  isOpen: boolean;
  editingTeam: Team | null;
  existingTeams: Team[];
  defaultBudget: number;
  onClose: () => void;
  onSave: (team: Team) => void;
}

export const TeamFormModal: React.FC<TeamFormModalProps> = ({
  isOpen,
  editingTeam,
  existingTeams,
  defaultBudget,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Team>>({
    id: '',
    name: '',
    ownerName: '',
    ownerUserId: 'Jobayer',
    logoUrl: DEFAULT_TEAM_LOGO,
    initialBudget: defaultBudget || 10000,
    color: '#10b981',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTeam) {
      setFormData({
        ...editingTeam,
        logoUrl: getSafeTeamLogo(editingTeam.logoUrl),
      });
    } else {
      const nextIdx = existingTeams.length + 1;
      const defaultOwner = nextIdx === 1 ? 'Jobayer' : nextIdx === 2 ? 'Aronno' : nextIdx === 3 ? 'Rayan' : 'tausif';
      setFormData({
        id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: '',
        ownerName: defaultOwner,
        ownerUserId: defaultOwner,
        logoUrl: DEFAULT_TEAM_LOGO,
        initialBudget: defaultBudget || 10000,
        color: nextIdx === 1 ? '#06b6d4' : nextIdx === 2 ? '#3b82f6' : nextIdx === 3 ? '#f59e0b' : '#ec4899',
      });
    }
    setError('');
  }, [editingTeam, isOpen, existingTeams.length, defaultBudget]);

  if (!isOpen) return null;

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('লোগো ফাইলের আকার সর্বোচ্চ ৩ মেগাবাইট হতে হবে!');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('দলের নাম প্রদান করুন!');
      return;
    }
    if (!formData.ownerName?.trim()) {
      setError('দলের মালিকের নাম প্রদান করুন!');
      return;
    }

    // Check duplicate team name
    const isDuplicate = existingTeams.some(
      (t) =>
        t.name.trim().toLowerCase() === formData.name?.trim().toLowerCase() &&
        t.id !== editingTeam?.id
    );
    if (isDuplicate) {
      setError(`"${formData.name}" নামে একটি দল ইতোমধ্যে রয়েছে! ভিন্ন নাম ব্যবহার করুন।`);
      return;
    }

    const teamToSave: Team = {
      id: formData.id || `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: formData.name.trim(),
      ownerName: formData.ownerName.trim(),
      ownerUserId: formData.ownerUserId?.trim() || 'Jobayer',
      logoUrl: getSafeTeamLogo(formData.logoUrl),
      initialBudget: Number(formData.initialBudget) || 10000,
      color: formData.color || '#10b981',
    };

    onSave(teamToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#081810] border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-sport">
              {editingTeam ? 'দলের তথ্য সম্পাদনা (Edit Team)' : 'নতুন দল যুক্ত করুন (Add Team)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs flex-1">
          <div className="p-4 rounded-xl bg-black/50 border border-emerald-950 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              দলের লোগো (Team Logo Upload)
            </label>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-400/80 bg-slate-900 shrink-0 shadow-lg">
                <img
                  src={getSafeTeamLogo(formData.logoUrl)}
                  alt="Team Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                  }}
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 font-bold text-xs cursor-pointer transition-colors shadow-md">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>লোগো ফাইল আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  placeholder="অথবা অনলাইন লোগো লিংক (https://...)"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-1 bg-black/60 border border-emerald-950 rounded-lg text-white text-[11px] placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">দলের নাম (Team Name) *</label>
            <input
              type="text"
              required
              placeholder="যেমন: ঢাকা গ্ল্যাডিয়েটর্স"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">মালিকের নাম *</label>
            <input
              type="text"
              required
              placeholder="যেমন: Jobayer, Aronno, Rayan, tausif"
              value={formData.ownerName || ''}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              মালিকের অ্যাকাউন্ট লিংক (Owner User ID) *
            </label>
            <select
              value={formData.ownerUserId || 'Jobayer'}
              onChange={(e) => setFormData({ ...formData, ownerUserId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#041009] border border-emerald-950 rounded-xl text-white text-xs font-mono"
            >
              <option value="Jobayer">Jobayer (ওনার ১)</option>
              <option value="Aronno">Aronno (ওনার ২)</option>
              <option value="Rayan">Rayan (ওনার ৩)</option>
              <option value="tausif">tausif (ওনার ৪)</option>
            </select>
            <span className="text-[10px] text-slate-400 block mt-1">
              * এই ওনার আইডি দিয়ে লগইন করলে লাইভ নিলামে সরাসরি এই দলের পক্ষে বিড করা যাবে।
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">শুরুর বাজেট (পয়েন্ট) *</label>
              <input
                type="number"
                min="1000"
                step="500"
                required
                value={formData.initialBudget || 10000}
                onChange={(e) => setFormData({ ...formData, initialBudget: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-white font-mono text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">দলের কালার থিম</label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={formData.color || '#10b981'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-9 p-0.5 rounded-lg bg-black/60 border border-emerald-950 cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-300 font-bold">{formData.color}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{editingTeam ? 'আপডেট করুন' : 'দল সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

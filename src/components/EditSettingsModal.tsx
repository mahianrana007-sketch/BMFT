import React, { useState, useEffect } from 'react';
import { AuctionSettings, PlayerCategory } from '../types';
import { Sliders, X, Check, Save, Trophy, Wallet, Flame, Tag } from 'lucide-react';

interface EditSettingsModalProps {
  isOpen: boolean;
  settings: AuctionSettings;
  teamsCount: number;
  categories?: PlayerCategory[];
  isAdmin?: boolean;
  onClose: () => void;
  onSave: (updatedSettings: AuctionSettings) => void;
  onSaveCategories?: (categories: PlayerCategory[]) => void;
}

export const EditSettingsModal: React.FC<EditSettingsModalProps> = ({
  isOpen,
  settings,
  teamsCount,
  categories = [],
  isAdmin = true,
  onClose,
  onSave,
  onSaveCategories,
}) => {
  const [formData, setFormData] = useState<AuctionSettings>({ ...settings });
  const [catBasePrices, setCatBasePrices] = useState<Record<string, number>>({});
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      const map: Record<string, number> = {};
      categories.forEach((c) => {
        map[c.id] = c.basePrice;
      });
      setCatBasePrices(map);
      setSuccessMsg(false);
    }
  }, [isOpen, settings, categories]);

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md bg-[#180808] border-2 border-rose-500/60 rounded-2xl p-6 shadow-2xl relative space-y-4 text-center">
          <h3 className="text-base font-bold text-rose-300 font-sport">অননুমোদিত অ্যাক্সেস (Unauthorized)</h3>
          <p className="text-xs text-slate-300">
            টুর্নামেন্ট সেটিংস পরিবর্তন করার অনুমতি শুধুমাত্র এডমিনের রয়েছে।
          </p>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetPerTeam = Number(formData.initialBudgetPerTeam) || 10000;
    const finalData: AuctionSettings = {
      ...formData,
      tournamentName: formData.tournamentName.trim() || 'MR Football Auction Premier League',
      seasonYear: formData.seasonYear.trim() || '2026',
      initialBudgetPerTeam: budgetPerTeam,
      totalTournamentBudget: teamsCount > 0 ? budgetPerTeam * teamsCount : budgetPerTeam * 4,
      defaultBasePrice: Number(formData.defaultBasePrice) || 200,
      bidIncrement: Number(formData.bidIncrement) || 100,
      maxBidIncrement: Number(formData.maxBidIncrement) || 1000,
      squadLimit: Number(formData.squadLimit) || 7,
      timerSeconds: Number(formData.timerSeconds) || 30,
      soundEnabled: Boolean(formData.soundEnabled),
      allowPlayerSelfRegistration: true,
    };

    onSave(finalData);

    // Also save category base prices if changed
    if (onSaveCategories && categories.length > 0) {
      const updatedCats = categories.map((c) => ({
        ...c,
        basePrice: typeof catBasePrices[c.id] === 'number' ? catBasePrices[c.id] : c.basePrice,
      }));
      onSaveCategories(updatedCats);
    }

    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#08190f] border-2 border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto relative max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-emerald-950 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-sport">
                টুর্নামেন্ট প্যারামিটার সেটিংস এডিট (Admin Only)
              </h3>
              <p className="text-xs text-slate-400">
                টুর্নামেন্টের নাম, বাজেট, স্কোয়াড ক্যাপ ও বিডিং নিয়মাবলী
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>টুর্নামেন্ট সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-black/40 border border-emerald-950 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>১. টুর্নামেন্টের পরিচিতি</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  টুর্নামেন্টের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tournamentName}
                  onChange={(e) => setFormData({ ...formData, tournamentName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  সিজন / বছর *
                </label>
                <input
                  type="text"
                  required
                  value={formData.seasonYear}
                  onChange={(e) => setFormData({ ...formData, seasonYear: e.target.value })}
                  className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-emerald-950 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              <span>২. বাজেট ও স্কোয়াড লিমিট</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  দলপ্রতি পার্স বাজেট (পয়েন্ট) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  required
                  value={formData.initialBudgetPerTeam}
                  onChange={(e) => setFormData({ ...formData, initialBudgetPerTeam: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  সর্বোচ্চ অকশন স্কোয়াড সাইজ (খেলোয়াড় সংখ্যা, সর্বোচ্চ ৭ জন) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="15"
                  required
                  value={formData.squadLimit}
                  onChange={(e) => setFormData({ ...formData, squadLimit: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm font-bold font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-emerald-950 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>৩. নিলাম বিডিং প্যারামিটার</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  বেস প্রাইজ *
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={formData.defaultBasePrice}
                  onChange={(e) => setFormData({ ...formData, defaultBasePrice: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ন্যূনতম বিড বৃদ্ধি *
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={formData.bidIncrement}
                  onChange={(e) => setFormData({ ...formData, bidIncrement: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  কাউন্টডাউন টাইমার (সেকেন্ড) *
                </label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  required
                  value={formData.timerSeconds}
                  onChange={(e) => setFormData({ ...formData, timerSeconds: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* 4. Category Base Prices (Iconic, Category A, Category B) */}
          {categories.length > 0 && (
            <div className="p-4 rounded-xl bg-black/40 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Tag className="w-4 h-4" />
                  <span>৪. প্লেয়ার ক্যাটাগরি অনুযায়ী বেস প্রাইজ (Category Base Prices)</span>
                </div>
                <span className="text-[10px] text-slate-400">এডমিন পরিবর্তনযোগ্য</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-2.5 rounded-lg bg-black/60 border border-emerald-950 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">[{cat.code}]</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={typeof catBasePrices[cat.id] === 'number' ? catBasePrices[cat.id] : cat.basePrice}
                        onChange={(e) =>
                          setCatBasePrices((prev) => ({
                            ...prev,
                            [cat.id]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-[#041208] border border-emerald-950 rounded text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-emerald-950 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

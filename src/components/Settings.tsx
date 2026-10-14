import React, { useState, useEffect } from 'react';
import { AuctionSettings, PlayerCategory } from '../types';
import { 
  Sliders, 
  RotateCcw, Save, Check, RefreshCw, Trash2, Trophy, Wallet, Flame, Crown,
  Share2, Globe, ShieldCheck, Sparkles, ShieldAlert, Tag, Plus, Edit2
} from 'lucide-react';

interface SettingsProps {
  settings: AuctionSettings;
  categories: PlayerCategory[];
  isAdmin: boolean;
  teamsCount: number;
  onUpdateSettings: (settings: AuctionSettings) => void;
  onSaveCategories: (categories: PlayerCategory[]) => void;
  onWipeAllToZero: () => void;
  onResetAuctionProgress: () => void;
  onOpenEditModal: () => void;
  onOpenCategoryModal?: () => void;
  onOpenAdminCredentials?: () => void;
  onOpenShareModal?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  categories,
  isAdmin,
  teamsCount,
  onUpdateSettings,
  onSaveCategories,
  onWipeAllToZero,
  onResetAuctionProgress,
  onOpenEditModal,
  onOpenCategoryModal,
  onOpenAdminCredentials,
  onOpenShareModal,
}) => {
  const [formData, setFormData] = useState<AuctionSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [catBasePrices, setCatBasePrices] = useState<Record<string, number>>({});
  const [catSavedSuccess, setCatSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  useEffect(() => {
    const map: Record<string, number> = {};
    categories.forEach((c) => {
      map[c.id] = c.basePrice;
    });
    setCatBasePrices(map);
  }, [categories]);

  const handleUpdateCatPrice = (catId: string, val: number) => {
    setCatBasePrices((prev) => ({
      ...prev,
      [catId]: Math.max(0, val),
    }));
  };

  const handleSaveAllCategoryPrices = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = categories.map((c) => ({
      ...c,
      basePrice: typeof catBasePrices[c.id] === 'number' ? catBasePrices[c.id] : c.basePrice,
    }));
    onSaveCategories(updated);
    setCatSavedSuccess(true);
    setTimeout(() => setCatSavedSuccess(false), 3000);
  };

  // Strict Security Guard: If not admin, completely block and show access denied!
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-2xl bg-[#140808] border-2 border-rose-500/50 shadow-2xl text-center space-y-4 my-12">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white font-sport">অননুমোদিত অ্যাক্সেস (Access Denied)</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            টুর্নামেন্ট সেটিংস ও ডাটা রিসেট অপশন শুধুমাত্র টুর্নামেন্ট এডমিন (Admin)-এর জন্য সংরক্ষিত।
            সাধারণ ইউজার বা দল মালিকদের এই সেকশনে প্রবেশের অনুমতি নেই।
          </p>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-rose-950 text-xs text-rose-300 font-mono">
          নিরাপত্তা নীতি: এডমিন ভেরিফিকেশন প্রয়োজন
        </div>
      </div>
    );
  }

  const handleSaveSettings = (e: React.FormEvent) => {
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

    onUpdateSettings(finalData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-sport tracking-wide flex items-center gap-2">
            <span>নিয়মাবলী ও টুর্নামেন্ট সেটিংস (Admin Panel)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              এডমিন নিয়ন্ত্রিত
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            টুর্নামেন্টের নাম, বাজেট সীমা, স্কোয়াড ক্যাপ ও বিডিং নিয়মাবলী
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-sport flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>ফ্রি সাইট শেয়ার</span>
            </button>
          )}

          {isAdmin && onOpenAdminCredentials && (
            <button
              onClick={onOpenAdminCredentials}
              className="py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold font-sport flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>আইডি ও পাসওয়ার্ড পরিচালনা</span>
            </button>
          )}

          <button
            onClick={onOpenEditModal}
            className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>পপআপে এডিট</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-[#06180f] border-2 border-emerald-500/40 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sport">
                টুর্নামেন্ট প্যারামিটার সেটিংস
              </h3>
              <p className="text-[11px] text-slate-400">
                যেকোনো ফিল্ডে পরিবর্তন করে নিচের &quot;সংরক্ষণ করুন&quot; বাটনে চাপুন
              </p>
            </div>
          </div>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/50 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>সফলভাবে সংরক্ষিত হয়েছে!</span>
            </span>
          )}
        </div>

        {/* 1. Name & Season */}
        <div className="p-4 rounded-xl bg-black/40 border border-emerald-950 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>১. টুর্নামেন্টের নাম ও সিজন</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                টুর্নামেন্টের নাম *
              </label>
              <input
                type="text"
                required
                value={formData.tournamentName}
                onChange={(e) => setFormData({ ...formData, tournamentName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-black/70 border border-emerald-950 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
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
                className="w-full px-3.5 py-2.5 bg-black/70 border border-emerald-950 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* 2. Budget & Squad */}
        <div className="p-4 rounded-xl bg-black/40 border border-emerald-950 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Wallet className="w-4 h-4" />
            <span>২. পার্স বাজেট ও স্কোয়াড সীমা</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                দলপ্রতি বাজেট (পয়েন্ট) *
              </label>
              <input
                type="number"
                step="500"
                min="500"
                required
                value={formData.initialBudgetPerTeam}
                onChange={(e) => {
                  const perTeam = Number(e.target.value);
                  setFormData({ 
                    ...formData, 
                    initialBudgetPerTeam: perTeam,
                    totalTournamentBudget: teamsCount > 0 ? perTeam * teamsCount : perTeam * 4 
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-black/70 border border-emerald-950 rounded-xl text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400"
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
                className="w-full px-3.5 py-2.5 bg-black/70 border border-emerald-950 rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* 3. Bidding Increments */}
        <div className="p-4 rounded-xl bg-black/40 border border-emerald-950 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>৩. নিলাম বিডিং ইনক্রিমেন্ট ও বেস প্রাইজ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="w-full px-3.5 py-2 bg-black/70 border border-emerald-950 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ন্যূনতম বিড ইনক্রিমেন্ট *
              </label>
              <input
                type="number"
                min="50"
                step="50"
                required
                value={formData.bidIncrement}
                onChange={(e) => setFormData({ ...formData, bidIncrement: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-black/70 border border-emerald-950 rounded-xl text-xs text-emerald-300 font-mono"
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
                className="w-full px-3.5 py-2 bg-black/70 border border-emerald-950 rounded-xl text-xs text-amber-300 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            * যে কোনো পরিবর্তন তাৎক্ষণিকভাবে সংরক্ষিত হবে
          </span>
          <button
            type="submit"
            className="py-3 px-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold font-sport flex items-center gap-2 shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>টুর্নামেন্ট সেটিংস সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>

      {/* 4. DEDICATED CATEGORY BASE PRICE SETTINGS (Iconic, Category A, Category B) */}
      <div className="p-6 rounded-2xl bg-[#06180f] border-2 border-amber-500/40 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-950 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sport">
                  প্লেয়ার ক্যাটাগরি বেস প্রাইজ নির্ধারণ (Category Base Prices)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  এডমিন ইচ্ছামতো পরিবর্তনযোগ্য
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Iconic Player, Category A Player এবং Category B Player-এর বেস প্রাইজ পরিবর্তন করুন। প্লেয়ার যোগ বা এডিট করার সময় এই প্রাইজ স্বয়ংক্রিয়ভাবে বসবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {catSavedSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/90 px-3 py-1.5 rounded-xl border border-emerald-500/50 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Firebase-এ সংরক্ষিত!</span>
              </span>
            )}

            {onOpenCategoryModal && (
              <button
                type="button"
                onClick={onOpenCategoryModal}
                className="py-2 px-3.5 rounded-xl bg-black/60 hover:bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-sport flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>ক্যাটাগরি মোডাল</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const currentPrice = typeof catBasePrices[cat.id] === 'number' ? catBasePrices[cat.id] : cat.basePrice;
            const isIconic = cat.code === 'ICON' || cat.name.toLowerCase().includes('icon');
            const isCatA = cat.code === 'A' || cat.name.toLowerCase().includes('category a') || cat.name.toLowerCase().includes('a category');
            const isCatB = cat.code === 'B' || cat.name.toLowerCase().includes('category b') || cat.name.toLowerCase().includes('b category');

            return (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-black/60 border border-emerald-950 hover:border-emerald-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-sport font-black text-xs border"
                      style={{ backgroundColor: `${cat.color}25`, borderColor: cat.color, color: cat.color }}
                    >
                      {cat.code}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {cat.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {isIconic ? 'আইকন প্লেয়ার' : isCatA ? 'এ ক্যাটাগরি প্লেয়ার' : isCatB ? 'বি ক্যাটাগরি প্লেয়ার' : 'সাধারণ ক্যাটাগরি'}
                      </span>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                    style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}35`, color: cat.color }}
                  >
                    {currentPrice.toLocaleString()} pt
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    বেস প্রাইজ (Base Price pt) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={currentPrice}
                      onChange={(e) => handleUpdateCatPrice(cat.id, Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#041208] border border-emerald-950 rounded-lg text-sm text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                      pt
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">কুইক:</span>
                  {[50, 100, 200, 500].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleUpdateCatPrice(cat.id, currentPrice + step)}
                      className="px-1.5 py-0.5 rounded bg-black/60 hover:bg-emerald-950 border border-emerald-950 text-slate-300 text-[10px] font-mono cursor-pointer"
                    >
                      +{step}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            💡 বেস প্রাইজ পরিবর্তন করে নিচের বাটনে ক্লিক করলে Firebase-এ স্থায়ীভাবে সেভ হবে এবং পেইজ রিফ্রেশ দিলেও অক্ষুণ্ণ থাকবে।
          </p>
          <button
            type="button"
            onClick={handleSaveAllCategoryPrices}
            className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-sport flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>ক্যাটাগরি বেস প্রাইজ সেভ করুন (Save All Prices)</span>
          </button>
        </div>
      </div>

      {/* 100% Free Website & Cloud Architecture Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#031c11] via-[#052818] to-[#031c11] border-2 border-emerald-500/50 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sport">
                  ১০০% ফ্রি ওয়েবসাইট ও ক্লাউড সিঙ্ক
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-black">
                  Zero Cost
                </span>
              </div>
              <p className="text-xs text-slate-300">
                এই ওয়েবসাইটটি সম্পূর্ণ বিনামূল্যে চালানো হচ্ছে, কোনো সাবস্ক্রিপশন বা ফি প্রযোজ্য নয়।
              </p>
            </div>
          </div>

          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>ওয়েবসাইট লিংক দেখুন ও কপি করুন</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-black/50 border border-emerald-950 space-y-1">
            <span className="text-slate-400 font-semibold block">ক্লাউড ডাটাবেজ</span>
            <div className="text-emerald-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Firebase Firestore</span>
            </div>
            <p className="text-[11px] text-slate-400">রিয়েল-টাইম লাইভ সিঙ্ক সম্পূর্ণ বিনামূল্যে</p>
          </div>

          <div className="p-3 rounded-xl bg-black/50 border border-emerald-950 space-y-1">
            <span className="text-slate-400 font-semibold block">হোস্টিং ও ডোমেইন</span>
            <div className="text-emerald-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>ফ্রি লাইভ ক্লাউড হোস্টিং</span>
            </div>
            <p className="text-[11px] text-slate-400">যেকোনো কম্পিউটার বা মোবাইল থেকে সবাই ভিজিট করতে পারবে</p>
          </div>

          <div className="p-3 rounded-xl bg-black/50 border border-emerald-950 space-y-1">
            <span className="text-slate-400 font-semibold block">প্লেয়ার ও টিম ওনারদের ফি</span>
            <div className="text-emerald-300 font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>০ টাকা (No Payment)</span>
            </div>
            <p className="text-[11px] text-slate-400">রেজিস্ট্রেশন ও লাইভ নিলাম সম্পূর্ণ ফ্রি</p>
          </div>
        </div>
      </div>

      {/* Danger Zone (Admin Only) */}
      <div className="p-6 rounded-2xl bg-[#140808] border border-rose-900/60 space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <RotateCcw className="w-5 h-5" />
          <h3 className="text-base font-bold font-sport">ডাটা রিসেট ও ফ্রেশ (Admin Only)</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          নিচের অপশনগুলোর মাধ্যমে আপনি টুর্নামেন্টের ডাটা পরিচালনা করতে পারেন (শুধুমাত্র এডমিন অধিকারপ্রাপ্ত):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('সতর্কতা: এটি সকল প্লেয়ার ও হিস্ট্রি সম্পূর্ণ খালি করবে। আপনি কি নিশ্চিত?')) {
                onWipeAllToZero();
              }
            }}
            className="py-3 px-4 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-300" />
            <span>প্লেয়ার ও হিস্ট্রি ০ (খালি) করুন</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('বর্তমান প্লেয়ার ও দল রেখে সব প্লেয়ারকে আবার Available করতে চান?')) {
                onResetAuctionProgress();
              }
            }}
            className="py-3 px-4 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>নিলাম অগ্রগতি রিসেট</span>
          </button>
        </div>
      </div>
    </div>
  );
};

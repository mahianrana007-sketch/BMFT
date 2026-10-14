import React, { useState, useEffect } from 'react';
import { Player, Position, CareerStats, PlayerCategory, PlayerApprovalStatus, Team } from '../types';
import { X, Upload, AlertCircle, Check, UserPlus, Tag, ShieldCheck, Sparkles, Shield } from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO } from '../utils/media';
import { findCategoryForPlayer } from '../data/initialData';

interface PlayerFormModalProps {
  isOpen: boolean;
  editingPlayer: Player | null;
  existingPlayers: Player[];
  defaultBasePrice: number;
  categories?: PlayerCategory[];
  teams?: Team[];
  onClose: () => void;
  onSave: (player: Player) => void;
}

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  isOpen,
  editingPlayer,
  existingPlayers,
  defaultBasePrice,
  categories = [],
  teams = [],
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Player>>({
    id: '',
    name: '',
    age: 22,
    mobile: '',
    jerseyNumber: 10,
    position: 'MID',
    rating: 8.5,
    experience: 'জেলা লিগ প্লেয়ার',
    basePrice: defaultBasePrice,
    category: categories[0]?.name || 'Icon Player',
    approvalStatus: 'APPROVED',
    status: 'available',
    photoUrl: DEFAULT_PLAYER_PHOTO,
    notes: '',
    bio: '',
    height: '5 ft 10 in',
    weight: '70 kg',
    preferredFoot: 'Right',
  });

  const [careerStats, setCareerStats] = useState<CareerStats>({
    matchesPlayed: 25,
    goals: 12,
    assists: 8,
    cleanSheets: 0,
    yellowCards: 2,
    redCards: 0,
    shotAccuracy: 78,
    passAccuracy: 82,
  });

  const [error, setError] = useState('');
  const [showStatsTab, setShowStatsTab] = useState(false);

  useEffect(() => {
    if (editingPlayer) {
      setFormData(editingPlayer);
      if (editingPlayer.careerStats) {
        setCareerStats(editingPlayer.careerStats);
      }
    } else {
      const maxNum = existingPlayers.reduce((max, p) => {
        const match = p.id.match(/\d+/);
        const num = match ? parseInt(match[0], 10) : 100;
        return num > max ? num : max;
      }, 100);
      const nextIdNum = maxNum + 1;
      const initialCat = categories[0] || null;
      const initialBasePrice = initialCat ? initialCat.basePrice : defaultBasePrice;

      setFormData({
        id: `PL-${nextIdNum}`,
        name: '',
        age: 22,
        mobile: '',
        jerseyNumber: Math.floor(Math.random() * 25) + 1,
        position: 'MID',
        rating: 8.0,
        experience: 'জেলা লিগ প্লেয়ার',
        category: initialCat ? initialCat.name : 'Iconic Player',
        basePrice: initialBasePrice,
        status: 'available',
        approvalStatus: 'APPROVED',
        photoUrl: DEFAULT_PLAYER_PHOTO,
        notes: '',
        bio: '',
        height: '5 ft 10 in',
        weight: '70 kg',
        preferredFoot: 'Right',
      });
      setCareerStats({
        matchesPlayed: 20,
        goals: 8,
        assists: 5,
        cleanSheets: 0,
        yellowCards: 1,
        redCards: 0,
        shotAccuracy: 75,
        passAccuracy: 80,
      });
    }
    setError('');
  }, [editingPlayer, isOpen, existingPlayers.length, defaultBasePrice]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('ছবির আকার সর্বোচ্চ ৩ মেগাবাইট হতে হবে!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('প্লেয়ারের নাম প্রদান করুন!');
      return;
    }
    if (!formData.id?.trim()) {
      setError('প্লেয়ার ID প্রদান করুন!');
      return;
    }

    const isIdDuplicate = existingPlayers.some(
      (p) => p.id.toLowerCase() === formData.id?.trim().toLowerCase() && p.id !== editingPlayer?.id
    );
    if (isIdDuplicate) {
      setError(`এই প্লেয়ার ID (${formData.id}) ইতোমধ্যে ব্যবহৃত হয়েছে।`);
      return;
    }

    const finalPlayer: Player = {
      id: formData.id.trim(),
      name: formData.name.trim(),
      age: Number(formData.age) || 20,
      mobile: formData.mobile?.trim() || '01700-000000',
      jerseyNumber: Number(formData.jerseyNumber) || 10,
      position: (formData.position as Position) || 'MID',
      rating: Math.min(10, Math.max(1, Number(formData.rating) || 8)),
      experience: formData.experience?.trim() || 'জেলা লিগ প্লেয়ার',
      basePrice: Number(formData.basePrice) || defaultBasePrice,
      category: formData.category || (categories[0]?.name || 'Icon Player'),
      approvalStatus: formData.approvalStatus || 'APPROVED',
      status: formData.status || 'available',
      teamId: formData.teamId || null,
      soldPrice: formData.soldPrice || null,
      photoUrl: formData.photoUrl || DEFAULT_PLAYER_PHOTO,
      notes: formData.notes?.trim() || '',
      bio: formData.bio?.trim() || '',
      height: formData.height?.trim() || '5 ft 10 in',
      weight: formData.weight?.trim() || '70 kg',
      preferredFoot: formData.preferredFoot || 'Right',
      careerStats,
      previousTeams: formData.previousTeams || [],
      createdAt: formData.createdAt || new Date().toISOString(),
    };

    onSave(finalPlayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#081810] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto relative max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-emerald-950 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white font-sport">
              {editingPlayer ? 'প্লেয়ার তথ্য সম্পাদনা (Edit Player)' : 'এডমিন ম্যানুয়াল প্লেয়ার এন্ট্রি (Add Player)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-emerald-950 bg-black/20 px-6">
          <button
            type="button"
            onClick={() => setShowStatsTab(false)}
            className={`py-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              !showStatsTab
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            মৌলিক তথ্য ও ছবি
          </button>
          <button
            type="button"
            onClick={() => setShowStatsTab(true)}
            className={`py-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              showStatsTab
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ক্যারিয়ার পরিসংখ্যান ও বায়ো
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!showStatsTab ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-black/40 border border-emerald-950">
                <div className="relative w-24 h-28 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 shrink-0">
                  <img
                    src={getSafePlayerPhoto(formData.photoUrl)}
                    alt="Preview"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                    }}
                  />
                </div>
                <div className="flex-1 w-full space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    প্লেয়ারের ছবি (Photo Upload / URL)
                  </label>
                  <label className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>ফাইল আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={formData.photoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="অনলাইন ছবির লিংক (https://...)"
                    className="w-full px-3 py-1.5 bg-black/60 border border-emerald-950 rounded-lg text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Player ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm font-mono text-emerald-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    প্লেয়ারের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="যেমন: সাকিব চৌধুরী"
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    পজিশন *
                  </label>
                  <select
                    value={formData.position || 'MID'}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as Position })}
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white"
                  >
                    <option value="GK">GK (গোলকিপার)</option>
                    <option value="DEF">DEF (ডিফেন্ডার)</option>
                    <option value="MID">MID (মিডফিল্ডার)</option>
                    <option value="ST">ST (স্ট্রাইকার)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    জার্সি নম্বর
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.jerseyNumber || 10}
                    onChange={(e) => setFormData({ ...formData, jerseyNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    রেটিং (১-১০)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={formData.rating || 8.0}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-amber-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    বয়স *
                  </label>
                  <input
                    type="number"
                    min="14"
                    max="50"
                    value={formData.age || 22}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Category, Auto Base Price & Specific Base Price Override */}
              <div className="p-4 rounded-xl bg-black/50 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Tag className="w-4 h-4" />
                    <span>ক্যাটাগরি ও বেস প্রাইজ (Category & Base Price)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>স্বয়ংক্রিয় প্রাইজ ও ম্যানুয়াল এডিট</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      প্লেয়ার ক্যাটাগরি (Category) *
                    </label>
                    <select
                      value={formData.category || (categories[0]?.name || 'Iconic Player')}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = findCategoryForPlayer(categories, val) || categories.find((c) => c.name === val);
                        setFormData({
                          ...formData,
                          category: val,
                          basePrice: match ? match.basePrice : formData.basePrice,
                        });
                      }}
                      className="w-full px-3 py-2 bg-[#041009] border border-emerald-950 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.code} - বেস {c.basePrice.toLocaleString()} pt)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        নির্ধারিত বেস প্রাইজ (Base Price pt) *
                      </label>
                      {(() => {
                        const matchedCat = findCategoryForPlayer(categories, formData.category) || categories.find((c) => c.name === formData.category);
                        return matchedCat ? (
                          <span className="text-[10px] text-amber-300 font-mono">
                            ক্যাটাগরি ডিফল্ট: {matchedCat.basePrice.toLocaleString()} pt
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        required
                        value={formData.basePrice ?? defaultBasePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-black/70 border border-emerald-500/50 rounded-xl text-sm font-bold text-emerald-300 font-mono focus:border-emerald-400 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">
                        pt
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-slate-300 flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">💡 নোট:</span>
                  <span>
                    ক্যাটাগরি নির্বাচন করলে স্বয়ংক্রিয়ভাবে সেই ক্যাটাগরির বেস প্রাইজ বসে যাবে। তবে এডমিন চাইলে ডানপাশের বক্সে যেকোনো নির্দিষ্ট প্লেয়ারের জন্য আলাদা বেস প্রাইজ নির্ধারণ করতে পারেন।
                  </span>
                </div>
              </div>

              {/* Admin Approval Status */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>এডমিন অনুমোদন স্ট্যাটাস</span>
                </label>
                <select
                  value={formData.approvalStatus || 'APPROVED'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      approvalStatus: e.target.value as PlayerApprovalStatus,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#041009] border border-emerald-950 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="APPROVED">APPROVED (অনুমোদিত - নিলামে অংশগ্রহণযোগ্য)</option>
                  <option value="PENDING">PENDING (অপেক্ষমাণ)</option>
                  <option value="REJECTED">REJECTED (বাতিলকৃত)</option>
                </select>
              </div>

              {/* Team Assignment (দলে অন্তর্ভুক্তি) */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>দলে অ্যাসাইনমেন্ট (Team Assignment)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">ঐচ্ছিক</span>
                </label>
                <select
                  value={formData.teamId || ''}
                  onChange={(e) => {
                    const newTeamId = e.target.value || null;
                    setFormData({
                      ...formData,
                      teamId: newTeamId,
                      status: newTeamId ? 'sold' : (formData.status === 'sold' ? 'available' : formData.status || 'available'),
                    });
                  }}
                  className="w-full px-3 py-2 bg-[#041009] border border-emerald-950 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">কোনো দল নির্ধারিত নেই (Available / Free Agent)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (ম্যানেজার: {t.ownerName || 'টিম ম্যানেজার'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    খেলার অভিজ্ঞতা
                  </label>
                  <input
                    type="text"
                    value={formData.experience || ''}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    পছন্দের পা
                  </label>
                  <select
                    value={formData.preferredFoot || 'Right'}
                    onChange={(e) => setFormData({ ...formData, preferredFoot: e.target.value as 'Right' | 'Left' | 'Both' })}
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-sm text-white"
                  >
                    <option value="Right">ডান পা (Right)</option>
                    <option value="Left">বাম পা (Left)</option>
                    <option value="Both">উভয় পা (Both)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-black/30 border border-emerald-950">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                  ক্যারিয়ার পরিসংখ্যান
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">মোট ম্যাচ</label>
                    <input
                      type="number"
                      min="0"
                      value={careerStats.matchesPlayed}
                      onChange={(e) => setCareerStats({ ...careerStats, matchesPlayed: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-emerald-950 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">মোট গোল</label>
                    <input
                      type="number"
                      min="0"
                      value={careerStats.goals}
                      onChange={(e) => setCareerStats({ ...careerStats, goals: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-emerald-950 rounded-lg text-emerald-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">অ্যাসিস্ট</label>
                    <input
                      type="number"
                      min="0"
                      value={careerStats.assists}
                      onChange={(e) => setCareerStats({ ...careerStats, assists: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-emerald-950 rounded-lg text-cyan-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">ক্লিন শিট</label>
                    <input
                      type="number"
                      min="0"
                      value={careerStats.cleanSheets ?? 0}
                      onChange={(e) => setCareerStats({ ...careerStats, cleanSheets: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-black/60 border border-emerald-950 rounded-lg text-amber-400 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  বায়োগ্রাফি ও স্কাউটিং নোট
                </label>
                <textarea
                  rows={4}
                  value={formData.bio || formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value, notes: e.target.value })}
                  placeholder="প্লেয়ারের বিশেষ খেলার গুণাবলী ও কৌশল লিখুন..."
                  className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white resize-none"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-emerald-950 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>{editingPlayer ? 'আপডেট করুন' : 'ম্যানুয়ালি প্লেয়ার যুক্ত করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

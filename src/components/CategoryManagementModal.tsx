import React, { useState } from 'react';
import { PlayerCategory } from '../types';
import { X, Tag, Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  categories: PlayerCategory[];
  onClose: () => void;
  onSaveCategories: (categories: PlayerCategory[]) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSaveCategories,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [basePrice, setBasePrice] = useState<number>(500);
  const [color, setColor] = useState('#10b981');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setName('');
    setCode('');
    setBasePrice(500);
    setColor('#10b981');
    setDescription('');
    setError('');
  };

  const startEdit = (cat: PlayerCategory) => {
    setIsCreating(false);
    setEditingId(cat.id);
    setName(cat.name);
    setCode(cat.code);
    setBasePrice(cat.basePrice);
    setColor(cat.color || '#10b981');
    setDescription(cat.description || '');
    setError('');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('ক্যাটাগরির নাম প্রদান করুন!');
      return;
    }
    if (!code.trim()) {
      setError('ক্যাটাগরির কোড প্রদান করুন (যেমন: ICON, A, B)!');
      return;
    }
    if (basePrice < 0) {
      setError('বেস প্রাইস ০ বা তার বেশি হতে হবে!');
      return;
    }

    if (isCreating) {
      const newCat: PlayerCategory = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        basePrice: Number(basePrice) || 0,
        color: color || '#10b981',
        description: description.trim(),
      };
      onSaveCategories([...categories, newCat]);
    } else if (editingId) {
      const updated = categories.map((c) => {
        if (c.id === editingId) {
          return {
            ...c,
            name: name.trim(),
            code: code.trim().toUpperCase(),
            basePrice: Number(basePrice) || 0,
            color: color || '#10b981',
            description: description.trim(),
          };
        }
        return c;
      });
      onSaveCategories(updated);
    }

    handleCancelForm();
  };

  const handleDelete = (catId: string, catName: string) => {
    if (categories.length <= 1) {
      alert('কমপক্ষে একটি ক্যাটাগরি থাকা আবশ্যক!');
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিত যে "${catName}" ক্যাটাগরিটি মুছে ফেলতে চান?`)) {
      const filtered = categories.filter((c) => c.id !== catId);
      onSaveCategories(filtered);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-[#081810] border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-sport">
                প্লেয়ার ক্যাটাগরি ব্যবস্থাপনা (Category Management)
              </h3>
              <p className="text-xs text-slate-400">
                এডমিন প্যানেল থেকে ক্যাটাগরি তৈরি, নাম পরিবর্তন ও বেস প্রাইস নির্ধারণ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Category Button */}
        {!isCreating && !editingId && (
          <div className="flex justify-end">
            <button
              onClick={startCreate}
              className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্যাটাগরি যোগ করুন</span>
            </button>
          </div>
        )}

        {/* Create / Edit Form */}
        {(isCreating || editingId) && (
          <form onSubmit={handleSave} className="p-4 rounded-xl bg-black/60 border border-emerald-500/40 space-y-3.5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>{isCreating ? 'নতুন ক্যাটাগরি তৈরি' : 'ক্যাটাগরি সম্পাদনা'}</span>
            </h4>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  ক্যাটাগরির নাম (Category Name) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: Iconic Player, Category A Player, Category B Player"
                  className="w-full px-3 py-2 rounded-lg bg-[#041009] border border-emerald-950 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  সংক্ষিপ্ত কোড (Code) *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="যেমন: ICON, A, B, C"
                  className="w-full px-3 py-2 rounded-lg bg-[#041009] border border-emerald-950 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  ডিফল্ট বেস প্রাইস (Default Base Price pt) *
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  min={0}
                  step={50}
                  className="w-full px-3 py-2 rounded-lg bg-[#041009] border border-emerald-950 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  ব্যাজ কালার (Theme Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-8 rounded border border-emerald-950 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#041009] border border-emerald-950 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                বিবরণ / নোট (Description)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="যেমন: আইকন ও সেরা তারকা প্লেয়ার"
                className="w-full px-3 py-2 rounded-lg bg-[#041009] border border-emerald-950 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="py-1.5 px-3 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="py-1.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>
        )}

        {/* Existing Categories List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            বিদ্যমান ক্যাটাগরি তালিকা ({categories.length} টি)
          </h4>

          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-black/40 border border-emerald-950 hover:border-emerald-500/30 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-sport font-black text-xs text-white shrink-0 shadow-md border"
                    style={{ backgroundColor: `${cat.color}25`, borderColor: cat.color, color: cat.color }}
                  >
                    {cat.code}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-white truncate">{cat.name}</h5>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                        style={{ backgroundColor: `${cat.color}20`, borderColor: `${cat.color}40`, color: cat.color }}
                      >
                        {cat.basePrice.toLocaleString()} pt
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-950 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport cursor-pointer shadow-md"
          >
            সম্পন্ন (Done)
          </button>
        </div>
      </div>
    </div>
  );
};

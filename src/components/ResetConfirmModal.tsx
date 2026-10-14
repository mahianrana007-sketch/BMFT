import React from 'react';
import { RotateCcw, X, Trash2, RefreshCw } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onWipeAllToZero: () => void;
  onResetAuctionProgress: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  isAdmin = true,
  onClose,
  onWipeAllToZero,
  onResetAuctionProgress,
}) => {
  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md bg-[#180808] border-2 border-rose-500/60 rounded-2xl p-6 shadow-2xl relative space-y-4 text-center">
          <h3 className="text-base font-bold text-rose-300 font-sport">অননুমোদিত অ্যাক্সেস (Unauthorized)</h3>
          <p className="text-xs text-slate-300">
            ডাটা রিসেট বা নিলাম রিসেট করার ক্ষমতা শুধুমাত্র টুর্নামেন্ট এডমিনের রয়েছে।
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[#07190f] border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sport">
              টুর্নামেন্ট ডাটা রিসেট ও ব্যবস্থাপনা (Admin Only)
            </h3>
            <p className="text-xs text-slate-400">
              প্রয়োজনীয় রিসেট অপশন বেছে নিন
            </p>
          </div>
        </div>

        {/* Option 1: Clean players & history to zero */}
        <div className="p-4 rounded-xl bg-[#170a0a] border border-rose-500/40 hover:border-rose-500/70 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-bold text-rose-300 font-sport">
                ১. প্লেয়ার ও হিস্ট্রি ০ করুন (Wipe Players to 0)
              </h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 font-semibold">
              ক্লিন স্লেট
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            সকল খেলোয়াড় এবং নিলামের সমস্ত হিস্ট্রি ডিলিট করে নতুন টুর্নামেন্ট শুরুর জন্য সম্পূর্ণ প্রস্তুত করা হবে।
          </p>
          <div className="pt-1.5">
            <button
              onClick={() => {
                onWipeAllToZero();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/60 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-300" />
              <span>প্লেয়ার ও নিলাম হিস্ট্রি খালি করুন</span>
            </button>
          </div>
        </div>

        {/* Option 2: Reset Auction Progress */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950 hover:border-emerald-500/40 transition-all space-y-1.5">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white font-sport">
              ২. শুধু নিলামের অগ্রগতি রিসেট (সকল প্লেয়ার Available)
            </h4>
          </div>
          <p className="text-[11px] text-slate-400">
            বর্তমান প্লেয়ার ও দল তালিকা অক্ষত রেখে সবার স্ট্যাটাস Available এবং দলের ব্যয়িত বাজেট ১০০% ফেরত দেওয়া হবে।
          </p>
          <button
            onClick={() => {
              onResetAuctionProgress();
              onClose();
            }}
            className="w-full mt-1 py-2 px-3 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>নিলাম অগ্রগতি রিসেট করুন</span>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            বাতিল
          </button>
        </div>
      </div>
    </div>
  );
};

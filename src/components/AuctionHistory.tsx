import React, { useState } from 'react';
import { AuctionHistoryItem, Team } from '../types';
import { Search, AlertTriangle } from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO } from '../utils/media';

interface AuctionHistoryProps {
  history: AuctionHistoryItem[];
  teams: Team[];
  isAdmin: boolean;
  onRevertOrCorrectHistory: (
    historyItem: AuctionHistoryItem,
    newStatus: 'sold' | 'unsold' | 'cancelled',
    newTeamId?: string | null,
    newPrice?: number
  ) => void;
}

export const AuctionHistory: React.FC<AuctionHistoryProps> = ({
  history,
  teams,
  isAdmin,
  onRevertOrCorrectHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'sold' | 'unsold' | 'cancelled'>('ALL');
  const [selectedItemForSequence, setSelectedItemForSequence] = useState<AuctionHistoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<AuctionHistoryItem | null>(null);

  const [correctionStatus, setCorrectionStatus] = useState<'sold' | 'unsold' | 'cancelled'>('sold');
  const [correctionTeamId, setCorrectionTeamId] = useState<string>('');
  const [correctionPrice, setCorrectionPrice] = useState<number>(0);
  const [correctionNote, setCorrectionNote] = useState<string>('');

  const filteredHistory = history.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.playerName.toLowerCase().includes(query) ||
      item.playerId.toLowerCase().includes(query) ||
      (item.teamName && item.teamName.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCorrection = (item: AuctionHistoryItem) => {
    setEditingItem(item);
    setCorrectionStatus(item.status);
    setCorrectionTeamId(item.teamId || teams[0]?.id || '');
    setCorrectionPrice(item.winningBid || item.basePrice);
    setCorrectionNote('');
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onRevertOrCorrectHistory(
      editingItem,
      correctionStatus,
      correctionStatus === 'sold' ? correctionTeamId : null,
      correctionStatus === 'sold' ? Number(correctionPrice) : 0
    );
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-sport tracking-wide">
            নিলামের ইতিহাস ও অডিট লগ (Auction History)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            মোট {history.length} টি নিলাম সম্পন্ন বা নিষ্পত্তি হয়েছে
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#06180f] border border-emerald-950 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="প্লেয়ারের নাম বা দল খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'sold', 'unsold', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-black/40 text-slate-400 hover:text-white border border-emerald-950'
              }`}
            >
              {st === 'ALL'
                ? 'সব রেকর্ড'
                : st === 'sold'
                ? 'SOLD (বিক্রিত)'
                : st === 'unsold'
                ? 'UNSOLD (অবিক্রিত)'
                : 'বাতিলকৃত'}
            </button>
          ))}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#06180f] border border-emerald-950">
          <p className="text-xs text-slate-400">কোনো হিস্ট্রি রেকর্ড নেই</p>
        </div>
      ) : (
        <div className="border border-emerald-950 rounded-2xl overflow-hidden bg-[#06180f]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">প্লেয়ার</th>
                  <th className="py-3 px-3">পজিশন</th>
                  <th className="py-3 px-3">স্ট্যাটাস</th>
                  <th className="py-3 px-3">দল</th>
                  <th className="py-3 px-3">চূড়ান্ত দর</th>
                  <th className="py-3 px-3">অপারেটর</th>
                  <th className="py-3 px-3">সময়</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60 bg-black/20">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-950/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getSafePlayerPhoto(item.playerPhoto)}
                          alt={item.playerName}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-500/30"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                          }}
                        />
                        <div>
                          <span className="font-bold text-white block">{item.playerName}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            ID: {item.playerId} • #{item.jerseyNumber}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-black/40 border-emerald-500/30 text-emerald-300">
                        {item.position}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === 'sold'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : item.status === 'unsold'
                            ? 'bg-slate-500/20 text-slate-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-white">
                      {item.teamName || 'অবিক্রিত'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {item.status === 'sold' ? `${item.winningBid} pt` : '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{item.actionBy}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(item.timestamp).toLocaleString('bn-BD', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.bidSequence && item.bidSequence.length > 0 && (
                          <button
                            onClick={() => setSelectedItemForSequence(item)}
                            className="px-2.5 py-1 rounded bg-black/50 hover:bg-emerald-950 text-slate-300 text-[11px] border border-emerald-950 cursor-pointer"
                          >
                            বিড ক্রম ({item.bidSequence.length})
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenCorrection(item)}
                            className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-semibold cursor-pointer"
                          >
                            সংশোধন
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bid Sequence Modal */}
      {selectedItemForSequence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#081810] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <div>
                <h3 className="text-base font-bold text-white font-sport">বিডিং বিস্তারিত টাইমলাইন</h3>
                <p className="text-xs text-slate-400">{selectedItemForSequence.playerName}</p>
              </div>
              <button
                onClick={() => setSelectedItemForSequence(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedItemForSequence.bidSequence.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-black/50 border border-emerald-950/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-white">{step.teamName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300">{step.amount} pt</span>
                    <span className="text-[10px] text-slate-500">{step.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedItemForSequence(null)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Admin Correction Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#081810] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <div>
                <h3 className="text-base font-bold text-white font-sport">ভুল এন্ট্রি সংশোধন ও রিভার্ট</h3>
                <p className="text-xs text-slate-400">
                  {editingItem.playerName} (ID: {editingItem.playerId})
                </p>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white cursor-pointer">
                &times;
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                সংশোধন করলে সংশ্লিষ্ট দলের পার্স বাজেট ও প্লেয়ার রোস্টার স্বয়ংক্রিয়ভাবে সমন্বয় হবে।
              </span>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">স্ট্যাটাস</label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value as 'sold' | 'unsold' | 'cancelled')}
                  className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
                >
                  <option value="sold">SOLD (বিক্রিত)</option>
                  <option value="unsold">UNSOLD (অবিক্রিত)</option>
                  <option value="cancelled">CANCELLED (বাতিল)</option>
                </select>
              </div>

              {correctionStatus === 'sold' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">সঠিক ক্রেতা দল</label>
                    <select
                      value={correctionTeamId}
                      onChange={(e) => setCorrectionTeamId(e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">চূড়ান্ত মূল্য (পয়েন্ট)</label>
                    <input
                      type="number"
                      min="50"
                      value={correctionPrice}
                      onChange={(e) => setCorrectionPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">সংশোধনের কারণ/নোট</label>
                <input
                  type="text"
                  placeholder="যেমন: ভুল দল সিলেক্ট হয়েছিল..."
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold cursor-pointer"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

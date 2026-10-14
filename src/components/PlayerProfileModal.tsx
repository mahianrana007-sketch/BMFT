import React, { useState } from 'react';
import { Player, Team, PlayerMatchPerformance } from '../types';
import { 
  X, Shield, Award, Phone, Star, 
  Activity, User, Footprints, PlayCircle, Download,
  Plus, Edit3, Trash2, Calendar, Clock, CheckCircle2,
  AlertCircle, Eye
} from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO, downloadPlayerPhoto } from '../utils/media';

interface PlayerProfileModalProps {
  player: Player | null;
  teams: Team[];
  isAdmin: boolean;
  performances?: PlayerMatchPerformance[];
  onClose: () => void;
  onEdit?: (player: Player) => void;
  onSelectForAuction?: (player: Player) => void;
  onAddPerformance?: (playerId: string) => void;
  onEditPerformance?: (perf: PlayerMatchPerformance) => void;
  onDeletePerformance?: (perfId: string) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  teams,
  isAdmin,
  performances = [],
  onClose,
  onEdit,
  onSelectForAuction,
  onAddPerformance,
  onEditPerformance,
  onDeletePerformance,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sheet'>('overview');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!player) return null;

  const assignedTeam = player.teamId ? teams.find((t) => t.id === player.teamId) : null;

  // Filter player-specific match logs
  const playerLogs = performances
    .filter((p) => p.playerId === player.id)
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  // Aggregate stats across all matches
  const totalMatches = playerLogs.length > 0 
    ? playerLogs.reduce((acc, curr) => acc + (curr.matchesPlayed ?? 1), 0)
    : (player.careerStats?.matchesPlayed || 0);

  const totalMinutes = playerLogs.reduce((acc, curr) => acc + (curr.minutesPlayed || 0), 0);
  const totalGoals = playerLogs.length > 0
    ? playerLogs.reduce((acc, curr) => acc + (curr.goals || 0), 0)
    : (player.careerStats?.goals || 0);

  const totalAssists = playerLogs.length > 0
    ? playerLogs.reduce((acc, curr) => acc + (curr.assists || 0), 0)
    : (player.careerStats?.assists || 0);

  const totalKeyPasses = playerLogs.reduce((acc, curr) => acc + (curr.keyPasses || 0), 0);
  const totalShotsOnTarget = playerLogs.reduce((acc, curr) => acc + (curr.shotsOnTarget || 0), 0);
  const totalTackles = playerLogs.reduce((acc, curr) => acc + (curr.tackles || 0), 0);
  const totalInterceptions = playerLogs.reduce((acc, curr) => acc + (curr.interceptions || 0), 0);
  const totalClearances = playerLogs.reduce((acc, curr) => acc + (curr.clearances || 0), 0);
  const totalBlocks = playerLogs.reduce((acc, curr) => acc + (curr.blocks || 0), 0);
  const totalCleanSheets = playerLogs.length > 0
    ? playerLogs.reduce((acc, curr) => acc + (curr.cleanSheets || 0), 0)
    : (player.careerStats?.cleanSheets || 0);

  const totalSaves = playerLogs.reduce((acc, curr) => acc + (curr.saves || 0), 0);
  const totalConceded = playerLogs.reduce((acc, curr) => acc + (curr.goalsConceded || 0), 0);
  const totalYellow = playerLogs.length > 0
    ? playerLogs.reduce((acc, curr) => acc + (curr.yellowCards || 0), 0)
    : (player.careerStats?.yellowCards || 0);

  const totalRed = playerLogs.length > 0
    ? playerLogs.reduce((acc, curr) => acc + (curr.redCards || 0), 0)
    : (player.careerStats?.redCards || 0);

  const avgRating = playerLogs.length > 0
    ? Number((playerLogs.reduce((acc, curr) => acc + (curr.rating || 7.0), 0) / playerLogs.length).toFixed(1))
    : player.rating;

  const positionColor = {
    GK: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    MID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    ST: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  }[player.position];

  const statusBadge = {
    available: { label: 'Available (উপলব্ধ)', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    live: { label: 'Live on Auction (নিলামে)', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' },
    sold: { label: 'SOLD (বিক্রিত)', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    unsold: { label: 'Unsold (অবিক্রিত)', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  }[player.status];

  const handleDownloadPhoto = async () => {
    setIsDownloading(true);
    try {
      const ok = await downloadPlayerPhoto(player.photoUrl, player.name, player.id);
      if (ok) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 2500);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#081810] border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto relative max-h-[94vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-emerald-950 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-sport">
                  {player.name}
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  #{player.jerseyNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${positionColor}`}>
                  {player.position}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                প্লেয়ার প্রোফাইল ও পারফরম্যান্স শিট (Individual Performance Sheet)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Admin Photo Download Button */}
            {isAdmin && (
              <button
                onClick={handleDownloadPhoto}
                disabled={isDownloading}
                className="py-1.5 px-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                title="প্লেয়ারের ছবি ডাউনলোড করুন"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ডাউনলোড সফল!</span>
                  </>
                ) : (
                  <>
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                    <span>ছবি ডাউনলোড</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-black/30 border-b border-emerald-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>প্রোফাইল বিবরণী (Overview)</span>
            </button>

            <button
              onClick={() => setActiveTab('sheet')}
              className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'sheet'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>পারফরম্যান্স শিট ({playerLogs.length} ম্যাচ)</span>
            </button>
          </div>

          {isAdmin && onAddPerformance && (
            <button
              onClick={() => onAddPerformance(player.id)}
              className="py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ম্যাচ পারফরম্যান্স যুক্ত করুন</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' ? (
            <>
              {/* Overview Profile Card */}
              <div className="flex flex-col md:flex-row gap-6 items-start bg-black/40 p-5 rounded-2xl border border-emerald-950">
                <div className="relative shrink-0 mx-auto md:mx-0">
                  <div className="w-36 h-44 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl bg-slate-900 relative">
                    <img
                      src={getSafePlayerPhoto(player.photoUrl)}
                      alt={player.name}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                        #{player.jerseyNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${positionColor}`}>
                        {player.position}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-center gap-1.5">
                    <button
                      onClick={handleDownloadPhoto}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="ছবি সংরক্ষণ করুন"
                    >
                      <Download className="w-3 h-3" />
                      <span>ছবি ডাউনলোড</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-2xl font-extrabold text-white font-sport tracking-wide">
                        {player.name}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>আইডি: <strong className="text-emerald-300 font-mono">{player.id}</strong></span>
                        <span>•</span>
                        <span>জার্সি #{player.jerseyNumber}</span>
                        <span>•</span>
                        <span>বয়স: {player.age} বছর</span>
                        {player.height && (
                          <>
                            <span>•</span>
                            <span>উচ্চতা: {player.height}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-sport font-bold text-base">{avgRating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400">/ 10</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-[#05140d] border border-emerald-950">
                      <span className="text-[10px] text-slate-400 block">বর্তমান অবস্থা</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold border ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#05140d] border border-emerald-950">
                      <span className="text-[10px] text-slate-400 block">বেস প্রাইজ</span>
                      <span className="text-sm font-bold text-white font-mono mt-1 block">
                        {player.basePrice} <span className="text-xs text-emerald-400">পয়েন্ট</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#05140d] border border-emerald-950 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block">দল</span>
                      {assignedTeam ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-300 truncate">{assignedTeam.name}</span>
                          {player.soldPrice ? (
                            <span className="text-xs font-mono font-bold text-amber-300">({player.soldPrice} pt)</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 mt-1 block">দল নির্ধারিত হয়নি</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-300 pt-2 border-t border-emerald-950/60">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>মোবাইল: <span className="font-mono text-white">{player.mobile}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                      <span>পছন্দের পা: <strong className="text-white">{player.preferredFoot || 'Right'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>অভিজ্ঞতা: <span className="text-white">{player.experience}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aggregated Performance Summary Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>সামগ্রিক টুর্নামেন্ট পারফরম্যান্স (Tournament Aggregate)</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('sheet')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                  >
                    সম্পূর্ণ শিট দেখুন →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">মোট ম্যাচ</span>
                    <span className="text-xl font-black text-white font-sport mt-0.5 block">
                      {totalMatches}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">খেলার মিনিট</span>
                    <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                      {totalMinutes || (totalMatches * 70)}'
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">⚽ গোল</span>
                    <span className="text-xl font-black text-emerald-400 font-sport mt-0.5 block">
                      {totalGoals}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">👟 অ্যাসিস্ট</span>
                    <span className="text-xl font-black text-cyan-400 font-sport mt-0.5 block">
                      {totalAssists}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">🛡️ ট্যাকল</span>
                    <span className="text-xl font-black text-blue-400 font-sport mt-0.5 block">
                      {totalTackles}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">✨ ক্লিন শিট</span>
                    <span className="text-xl font-black text-amber-400 font-sport mt-0.5 block">
                      {totalCleanSheets}
                    </span>
                  </div>
                </div>
              </div>

              {/* Biography Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>বায়োগ্রাফি ও নোট</span>
                </h4>
                <div className="p-4 rounded-xl bg-black/30 border border-emerald-950/80 text-sm text-slate-300 leading-relaxed">
                  <p>{player.bio || player.notes || 'কোনো বায়োগ্রাফি যোগ করা হয়নি।'}</p>
                </div>
              </div>
            </>
          ) : (
            /* Complete Performance Sheet View */
            <div className="space-y-6">
              {/* Aggregate Totals Grid */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#04160c] via-[#05180f] to-[#020b06] border-2 border-emerald-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-white font-sport flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>{player.name} - সামগ্রিক পারফরম্যান্স পরিসংখ্যান</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      সব ম্যাচের পারফরম্যান্স থেকে স্বয়ংক্রিয়ভাবে হিসাবকৃত পরিসংখ্যান
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>গড় রেটিং: {avgRating.toFixed(1)}/10</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">ম্যাচ</span>
                    <span className="text-lg font-black text-white font-sport mt-0.5 block">{totalMatches}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">মিনিট</span>
                    <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">{totalMinutes}'</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">গোল</span>
                    <span className="text-lg font-black text-emerald-400 font-sport mt-0.5 block">{totalGoals}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">অ্যাসিস্ট</span>
                    <span className="text-lg font-black text-cyan-400 font-sport mt-0.5 block">{totalAssists}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">কি পাস</span>
                    <span className="text-lg font-black text-amber-300 font-sport mt-0.5 block">{totalKeyPasses}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">অন-টার্গেট শট</span>
                    <span className="text-lg font-black text-white font-sport mt-0.5 block">{totalShotsOnTarget}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">ট্যাকল</span>
                    <span className="text-lg font-black text-blue-400 font-sport mt-0.5 block">{totalTackles}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">ইন্টারসেপশন</span>
                    <span className="text-lg font-black text-blue-300 font-sport mt-0.5 block">{totalInterceptions}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">ক্লিয়ারেন্স</span>
                    <span className="text-lg font-black text-slate-200 font-sport mt-0.5 block">{totalClearances}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">ব্লক</span>
                    <span className="text-lg font-black text-slate-300 font-sport mt-0.5 block">{totalBlocks}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">ক্লিন শিট</span>
                    <span className="text-lg font-black text-emerald-400 font-sport mt-0.5 block">{totalCleanSheets}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">সেভ (Saves)</span>
                    <span className="text-lg font-black text-amber-400 font-sport mt-0.5 block">{totalSaves}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">কনসিড গোল</span>
                    <span className="text-lg font-black text-rose-400 font-sport mt-0.5 block">{totalConceded}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-950 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">কার্ড (হলুদ/লাল)</span>
                    <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
                      {totalYellow}/{totalRed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Match Logs Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>ম্যাচভিত্তিক পারফরম্যান্স লগ ({playerLogs.length} টি ম্যাচ এন্ট্রি)</span>
                  </h4>

                  {isAdmin && onAddPerformance && (
                    <button
                      onClick={() => onAddPerformance(player.id)}
                      className="py-1 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন ম্যাচ যোগ করুন</span>
                    </button>
                  )}
                </div>

                {playerLogs.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-black/30 border border-emerald-950/80 text-center space-y-3">
                    <Activity className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">
                      এই খেলোয়াড়ের জন্য এখনও কোনো ম্যাচ পারফরম্যান্স এন্ট্রি যোগ করা হয়নি।
                    </p>
                    {isAdmin && onAddPerformance && (
                      <button
                        onClick={() => onAddPerformance(player.id)}
                        className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        <span>প্রথম ম্যাচ পারফরম্যান্স এন্ট্রি করুন</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-emerald-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#04140a] text-slate-400 border-b border-emerald-950 font-sport uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3.5">তারিখ ও ম্যাচ</th>
                          <th className="py-3 px-2 text-center">মিনিট</th>
                          <th className="py-3 px-2 text-center text-emerald-400">গোল</th>
                          <th className="py-3 px-2 text-center text-cyan-400">অ্যাসিস্ট</th>
                          <th className="py-3 px-2 text-center">কি পাস</th>
                          <th className="py-3 px-2 text-center">ট্যাকল</th>
                          <th className="py-3 px-2 text-center">ক্লিয়ারেন্স</th>
                          <th className="py-3 px-2 text-center">ক্লিন শিট</th>
                          <th className="py-3 px-2 text-center">সেভ</th>
                          <th className="py-3 px-2 text-center">কার্ড</th>
                          <th className="py-3 px-2.5 text-center text-amber-300">রেটিং</th>
                          {isAdmin && <th className="py-3 px-3 text-right">অ্যাকশন</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/60 bg-black/40">
                        {playerLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-emerald-950/30 transition-colors">
                            <td className="py-3 px-3.5">
                              <span className="font-bold text-white block">{log.matchTitle}</span>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                <span>{log.matchDate}</span>
                              </span>
                              {log.notes && (
                                <p className="text-[10px] text-slate-300 italic mt-0.5">
                                  {log.notes}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center font-mono font-bold text-slate-300">
                              {log.minutesPlayed}'
                            </td>
                            <td className="py-3 px-2 text-center font-sport font-black text-emerald-400 text-sm">
                              {log.goals}
                            </td>
                            <td className="py-3 px-2 text-center font-sport font-black text-cyan-400 text-sm">
                              {log.assists}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-slate-300">
                              {log.keyPasses}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-blue-300">
                              {log.tackles}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-slate-300">
                              {log.clearances}
                            </td>
                            <td className="py-3 px-2 text-center font-bold">
                              {log.cleanSheets ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">হ্যাঁ</span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-amber-300">
                              {log.saves || '—'}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {log.yellowCards > 0 || log.redCards > 0 ? (
                                <span className="flex items-center justify-center gap-1">
                                  {log.yellowCards > 0 && (
                                    <span className="px-1 py-0.2 rounded bg-amber-400 text-black font-mono font-bold text-[10px]">
                                      {log.yellowCards}
                                    </span>
                                  )}
                                  {log.redCards > 0 && (
                                    <span className="px-1 py-0.2 rounded bg-rose-500 text-white font-mono font-bold text-[10px]">
                                      {log.redCards}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs">
                                {log.rating.toFixed(1)}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {onEditPerformance && (
                                    <button
                                      onClick={() => onEditPerformance(log)}
                                      className="p-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 transition-colors cursor-pointer"
                                      title="এন্ট্রি এডিট করুন"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {onDeletePerformance && (
                                    <button
                                      onClick={() => onDeletePerformance(log.id)}
                                      className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors cursor-pointer"
                                      title="এন্ট্রি মুছুন"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-emerald-950 flex flex-wrap items-center justify-between gap-3 bg-black/60">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>

          <div className="flex items-center gap-2">
            {isAdmin && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(player);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-900/40 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>প্লেয়ার প্রোফাইল এডিট</span>
              </button>
            )}

            {player.status === 'available' && onSelectForAuction && (
              <button
                onClick={() => {
                  onClose();
                  onSelectForAuction(player);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>নিলামে ডাকুন</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  PlayerLeaderboardItem, Team, TournamentAwardLeaderboard, 
  PlayerMatchPerformance, Player 
} from '../types';
import { 
  Award, Trophy, Search, Star, Shield, Users, ArrowUpDown, 
  Activity, Crown, Download, Plus, Eye, Calendar, Sparkles 
} from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO, downloadPlayerPhoto } from '../utils/media';

interface PlayerStatsViewProps {
  topScorers: PlayerLeaderboardItem[];
  topAssists: PlayerLeaderboardItem[];
  teams: Team[];
  tournamentAwards?: TournamentAwardLeaderboard;
  performances?: PlayerMatchPerformance[];
  players?: Player[];
  isAdmin?: boolean;
  onViewPlayerProfile?: (player: Player) => void;
  onAddPerformance?: (playerId?: string) => void;
}

export const PlayerStatsView: React.FC<PlayerStatsViewProps> = ({
  topScorers,
  topAssists,
  teams,
  tournamentAwards,
  performances = [],
  players = [],
  isAdmin = false,
  onViewPlayerProfile,
  onAddPerformance,
}) => {
  const [activeTab, setActiveTab] = useState<'awards' | 'sheets' | 'scorers' | 'assists'>('awards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('all');

  // Leaders for tournament awards
  const mvpLeader = tournamentAwards?.playerOfTheTournament[0] || null;
  const defenderLeader = tournamentAwards?.bestDefenders[0] || null;
  const gkLeader = tournamentAwards?.bestGoalkeepers[0] || null;
  const goldenBootLeader = topScorers[0] || null;
  const assistLeader = topAssists[0] || null;

  // Filtered performances for sheets tab
  const filteredPerformances = performances.filter((item) => {
    if (selectedTeamId !== 'all' && item.teamId !== selectedTeamId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchP = item.playerName.toLowerCase();
      const matchI = (item.playerId || '').toLowerCase();
      const matchM = item.matchTitle.toLowerCase();
      const matchT = (item.teamName || '').toLowerCase();
      if (!matchP.includes(q) && !matchI.includes(q) && !matchM.includes(q) && !matchT.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Filtered leaderboard for scorers/assists
  const currentLeaderboard = activeTab === 'scorers' ? topScorers : topAssists;
  const filteredLeaderboard = currentLeaderboard.filter((item) => {
    if (selectedTeamId !== 'all' && item.teamId !== selectedTeamId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.playerName.toLowerCase().includes(q) && !(item.teamName || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const activeLeader = filteredLeaderboard[0] || null;

  const handlePlayerClick = (playerId: string) => {
    if (!onViewPlayerProfile) return;
    const p = players.find((item) => item.id === playerId);
    if (p) onViewPlayerProfile(p);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header Bar */}
      <div className="p-6 rounded-3xl bg-[#04160c] border-2 border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-sport">
                টুর্নামেন্ট পরিসংখ্যান ও সেরা পুরস্কার (Tournament Stats & Awards)
              </h2>
              <p className="text-xs text-slate-300 font-bn">
                ম্যাচ পারফরম্যান্স শিটের ভিত্তিতে টুর্নামেন্ট সেরা, সেরা ডিফেন্ডার, সেরা গোলকিপার এবং শীর্ষ খেলোয়াড়দের তালিকা।
              </p>
            </div>
          </div>

          {isAdmin && onAddPerformance && (
            <button
              onClick={() => onAddPerformance()}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ পারফরম্যান্স এন্ট্রি</span>
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-950">
          <button
            onClick={() => setActiveTab('awards')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'awards'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                : 'text-amber-300 hover:text-white bg-black/40'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 টুর্নামেন্ট সেরা পুরস্কার (Awards)</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
                : 'text-emerald-300 hover:text-white bg-black/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>📊 পারফরম্যান্স শিট ({performances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scorers')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scorers'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white bg-black/40'
            }`}
          >
            <span>⚽ শীর্ষ গোলদাতা (Goals)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-emerald-300 font-mono">
              {topScorers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('assists')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'assists'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                : 'text-slate-300 hover:text-white bg-black/40'
            }`}
          >
            <span>👟 শীর্ষ অ্যাসিস্ট (Assists)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-cyan-300 font-mono">
              {topAssists.length}
            </span>
          </button>
        </div>
      </div>

      {/* View 1: Tournament Awards Showcase */}
      {activeTab === 'awards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Player of the Tournament */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#121c08] via-[#09150b] to-[#040e07] border-2 border-amber-500/50 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Player of the Tournament</span>
                </span>
                <span className="text-xl">🌟</span>
              </div>

              {mvpLeader ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={getSafePlayerPhoto(mvpLeader.playerPhoto)}
                      alt={mvpLeader.playerName}
                      className="w-20 h-24 rounded-2xl object-cover object-top border-2 border-amber-400 shadow-xl bg-slate-900 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-black text-white font-sport">
                        {mvpLeader.playerName}
                      </h3>
                      <p className="text-xs text-slate-300 font-bn">
                        {mvpLeader.teamName} {mvpLeader.jerseyNumber ? `• #${mvpLeader.jerseyNumber}` : ''}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        রেটিং: {mvpLeader.averageRating.toFixed(1)}/10
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-black/50 border border-amber-500/20 text-xs font-sport">
                    <div>
                      <span className="text-[10px] text-slate-400 block">গোল</span>
                      <strong className="text-base text-emerald-400 font-black">{mvpLeader.goals}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">অ্যাসিস্ট</span>
                      <strong className="text-base text-cyan-400 font-black">{mvpLeader.assists}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">MVP স্কোর</span>
                      <strong className="text-base text-amber-400 font-black font-mono">{mvpLeader.mvpScore}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handlePlayerClick(mvpLeader.playerId)}
                      className="text-xs text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>সম্পূর্ণ শিট দেখুন</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => downloadPlayerPhoto(mvpLeader.playerPhoto || '', mvpLeader.playerName, mvpLeader.playerId)}
                        className="py-1 px-2.5 rounded-lg bg-black/60 hover:bg-emerald-950 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="ছবি ডাউনলোড করুন"
                      >
                        <Download className="w-3 h-3" />
                        <span>ছবি</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  ম্যাচ পারফরম্যান্স যুক্ত হলে টুর্নামেন্ট সেরা নির্বাচন করা হবে
                </div>
              )}
            </div>

            {/* 2. Best Defender */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#061824] via-[#04121a] to-[#020a0e] border-2 border-blue-500/50 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Best Defender (সেরা ডিফেন্ডার)</span>
                </span>
                <span className="text-xl">🛡️</span>
              </div>

              {defenderLeader ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={getSafePlayerPhoto(defenderLeader.playerPhoto)}
                      alt={defenderLeader.playerName}
                      className="w-20 h-24 rounded-2xl object-cover object-top border-2 border-blue-400 shadow-xl bg-slate-900 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-black text-white font-sport">
                        {defenderLeader.playerName}
                      </h3>
                      <p className="text-xs text-slate-300 font-bn">
                        {defenderLeader.teamName} {defenderLeader.jerseyNumber ? `• #${defenderLeader.jerseyNumber}` : ''}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        পজিশন: {defenderLeader.position}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center p-3 rounded-2xl bg-black/50 border border-blue-500/20 text-xs font-sport">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ট্যাকল</span>
                      <strong className="text-sm text-blue-300 font-black">{defenderLeader.tackles}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ইন্টারসেপশন</span>
                      <strong className="text-sm text-blue-300 font-black">{defenderLeader.interceptions}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ক্লিন শিট</span>
                      <strong className="text-sm text-emerald-400 font-black">{defenderLeader.cleanSheets}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ডিফেন্স স্কোর</span>
                      <strong className="text-sm text-blue-400 font-black font-mono">{defenderLeader.defenseScore}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handlePlayerClick(defenderLeader.playerId)}
                      className="text-xs text-blue-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>সম্পূর্ণ শিট দেখুন</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => downloadPlayerPhoto(defenderLeader.playerPhoto || '', defenderLeader.playerName, defenderLeader.playerId)}
                        className="py-1 px-2.5 rounded-lg bg-black/60 hover:bg-blue-950 border border-blue-500/40 text-blue-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="ছবি ডাউনলোড করুন"
                      >
                        <Download className="w-3 h-3" />
                        <span>ছবি</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  ডিফেন্ডারদের পরিসংখ্যান এন্ট্রি হলে সেরা নির্বাচন করা হবে
                </div>
              )}
            </div>

            {/* 3. Best Goalkeeper */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#1b1708] via-[#141005] to-[#0a0802] border-2 border-yellow-500/50 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="absolute top-0 right-0 w-36 h-36 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Best Goalkeeper (সেরা গোলকিপার)</span>
                </span>
                <span className="text-xl">🧤</span>
              </div>

              {gkLeader ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={getSafePlayerPhoto(gkLeader.playerPhoto)}
                      alt={gkLeader.playerName}
                      className="w-20 h-24 rounded-2xl object-cover object-top border-2 border-yellow-400 shadow-xl bg-slate-900 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-black text-white font-sport">
                        {gkLeader.playerName}
                      </h3>
                      <p className="text-xs text-slate-300 font-bn">
                        {gkLeader.teamName} {gkLeader.jerseyNumber ? `• #${gkLeader.jerseyNumber}` : ''}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        পজিশন: GK
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center p-3 rounded-2xl bg-black/50 border border-yellow-500/20 text-xs font-sport">
                    <div>
                      <span className="text-[10px] text-slate-400 block">সেভ</span>
                      <strong className="text-sm text-yellow-400 font-black">{gkLeader.saves}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ক্লিন শিট</span>
                      <strong className="text-sm text-emerald-400 font-black">{gkLeader.cleanSheets}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">কনসিড</span>
                      <strong className="text-sm text-rose-400 font-black">{gkLeader.goalsConceded}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">GK স্কোর</span>
                      <strong className="text-sm text-yellow-300 font-black font-mono">{gkLeader.gkScore}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handlePlayerClick(gkLeader.playerId)}
                      className="text-xs text-yellow-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>সম্পূর্ণ শিট দেখুন</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => downloadPlayerPhoto(gkLeader.playerPhoto || '', gkLeader.playerName, gkLeader.playerId)}
                        className="py-1 px-2.5 rounded-lg bg-black/60 hover:bg-yellow-950 border border-yellow-500/40 text-yellow-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="ছবি ডাউনলোড করুন"
                      >
                        <Download className="w-3 h-3" />
                        <span>ছবি</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  গোলকিপার সেভ ও ক্লিন শিট যুক্ত হলে সেরা নির্বাচন করা হবে
                </div>
              )}
            </div>
          </div>

          {/* Golden Boot & Playmaker Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goldenBootLeader && (
              <div className="p-4 rounded-2xl bg-[#03150c] border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={getSafePlayerPhoto(goldenBootLeader.playerPhoto)}
                    alt={goldenBootLeader.playerName}
                    className="w-12 h-14 rounded-xl object-cover object-top border border-emerald-500/40"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">⚽ গোল্ডেন বুট (Top Scorer)</span>
                    <strong className="text-white block font-sport text-base">{goldenBootLeader.playerName}</strong>
                    <span className="text-xs text-slate-400">{goldenBootLeader.teamName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono block">{goldenBootLeader.goals}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">গোল</span>
                </div>
              </div>
            )}

            {assistLeader && (
              <div className="p-4 rounded-2xl bg-[#031518] border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={getSafePlayerPhoto(assistLeader.playerPhoto)}
                    alt={assistLeader.playerName}
                    className="w-12 h-14 rounded-xl object-cover object-top border border-cyan-500/40"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">👟 টপ প্লেমেকার (Most Assists)</span>
                    <strong className="text-white block font-sport text-base">{assistLeader.playerName}</strong>
                    <span className="text-xs text-slate-400">{assistLeader.teamName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-cyan-400 font-mono block">{assistLeader.assists}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">অ্যাসিস্ট</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 2: All Performance Sheets Explorer */}
      {activeTab === 'sheets' && (
        <div className="space-y-4">
          {/* Search & Team Filter */}
          <div className="p-4 rounded-2xl bg-[#031109] border border-emerald-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="খেলোয়াড়, দল বা ম্যাচের নাম দিয়ে সার্চ করুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black border border-emerald-950 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="py-2 px-3 rounded-xl bg-black border border-emerald-950 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">সকল দল (All Teams)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredPerformances.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/30 border border-emerald-950 text-center space-y-3">
              <Activity className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">
                {performances.length === 0 ? 'এখনও কোনো ম্যাচ পারফরম্যান্স শিট রেকর্ড নেই।' : 'অনুসন্ধানের সাথে কোনো ম্যাচ পারফরম্যান্স মেলেনি।'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-950 overflow-hidden bg-black/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#03150e] text-slate-400 uppercase text-[10px] border-b border-emerald-950 font-sport tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">খেলোয়াড়</th>
                      <th className="py-3 px-3">দল</th>
                      <th className="py-3 px-3">ম্যাচ ও তারিখ</th>
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
                      <th className="py-3 px-3 text-right">ভিউ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/60">
                    {filteredPerformances.map((perf) => (
                      <tr key={perf.id} className="hover:bg-emerald-950/20 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getSafePlayerPhoto(perf.playerPhoto)}
                              alt={perf.playerName}
                              className="w-9 h-10 rounded-lg object-cover object-top border border-emerald-500/30 shrink-0 bg-slate-900"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                              }}
                            />
                            <div>
                              <strong className="text-white block font-bold text-xs">{perf.playerName}</strong>
                              <span className="text-[10px] text-emerald-400 font-mono">{perf.playerId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-300">{perf.teamName || '—'}</td>

                        <td className="py-3 px-3">
                          <span className="text-white block font-bold text-xs">{perf.matchTitle}</span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-emerald-400" />
                            <span>{perf.matchDate}</span>
                          </span>
                        </td>

                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-300">{perf.minutesPlayed}'</td>
                        <td className="py-3 px-2 text-center font-sport font-black text-emerald-400 text-sm">{perf.goals}</td>
                        <td className="py-3 px-2 text-center font-sport font-black text-cyan-400 text-sm">{perf.assists}</td>
                        <td className="py-3 px-2 text-center font-mono text-slate-300">{perf.keyPasses}</td>
                        <td className="py-3 px-2 text-center font-mono text-blue-300">{perf.tackles}</td>
                        <td className="py-3 px-2 text-center font-mono text-slate-300">{perf.clearances}</td>
                        <td className="py-3 px-2 text-center">
                          {perf.cleanSheets ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">হ্যাঁ</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-amber-300">{perf.saves || '—'}</td>
                        <td className="py-3 px-2 text-center">
                          {perf.yellowCards > 0 || perf.redCards > 0 ? (
                            <span className="flex items-center justify-center gap-1 font-mono text-[10px]">
                              {perf.yellowCards > 0 && <span className="text-amber-400 font-bold">🟨{perf.yellowCards}</span>}
                              {perf.redCards > 0 && <span className="text-rose-400 font-bold">🟥{perf.redCards}</span>}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs">
                            {perf.rating.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => downloadPlayerPhoto(perf.playerPhoto || '', perf.playerName, perf.playerId)}
                                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                                title="ছবি ডাউনলোড করুন"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handlePlayerClick(perf.playerId)}
                              className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                              title="প্লেয়ার প্রোফাইল দেখুন"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 3 & 4: Top Scorers / Top Assists */}
      {(activeTab === 'scorers' || activeTab === 'assists') && (
        <div className="space-y-4">
          {/* Spotlight on leader */}
          {activeLeader && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#051c11] via-[#04160c] to-[#020b06] border-2 border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-5 relative z-10">
                <div className="relative">
                  <img
                    src={getSafePlayerPhoto(activeLeader.playerPhoto)}
                    alt={activeLeader.playerName}
                    className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl object-cover object-top border-2 border-amber-400 shadow-2xl bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                    }}
                  />
                  <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-xs shadow-lg">
                    👑
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    {activeTab === 'scorers' ? 'গোল্ডেন বুট লিডার (Top Scorer)' : 'টপ প্লেমেকার (Most Assists)'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-sport">
                    {activeLeader.playerName}
                  </h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 font-bn">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeLeader.teamName}</span>
                    {activeLeader.jerseyNumber ? ` • #${activeLeader.jerseyNumber}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right relative z-10 p-4 rounded-2xl bg-black/50 border border-amber-500/30">
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono block">
                  {activeTab === 'scorers' ? activeLeader.goals : activeLeader.assists}
                </span>
                <span className="text-xs text-slate-300 uppercase font-sport font-bold block">
                  {activeTab === 'scorers' ? 'মোট গোল (Goals)' : 'মোট অ্যাসিস্ট (Assists)'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                  {activeLeader.matchesPlayed} ম্যাচে
                </span>
              </div>
            </div>
          )}

          {/* Search & Team Filter */}
          <div className="p-4 rounded-2xl bg-[#031109] border border-emerald-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="খেলোয়াড় বা দলের নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black border border-emerald-950 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="py-2 px-3 rounded-xl bg-black border border-emerald-950 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">সকল দল (All Teams)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaderboard Table */}
          {filteredLeaderboard.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/30 border border-emerald-950 text-center text-xs text-slate-400">
              কোনো তথ্য পাওয়া যায়নি।
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-950 overflow-hidden bg-black/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#03150e] text-slate-400 uppercase text-[10px] border-b border-emerald-950 font-sport tracking-wider">
                    <tr>
                      <th className="py-3 px-4 text-center">স্থান</th>
                      <th className="py-3 px-4">খেলোয়াড়</th>
                      <th className="py-3 px-3">দল</th>
                      <th className="py-3 px-3 text-center">ম্যাচ</th>
                      <th className="py-3 px-3 text-center text-emerald-400 font-bold">গোল</th>
                      <th className="py-3 px-3 text-center text-cyan-400 font-bold">অ্যাসিস্ট</th>
                      <th className="py-3 px-4 text-right">প্রোফাইল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/60">
                    {filteredLeaderboard.map((item, index) => (
                      <tr key={item.playerId} className="hover:bg-emerald-950/20 transition-colors">
                        <td className="py-3 px-4 text-center">
                          {index === 0 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-black font-mono text-xs inline-flex items-center justify-center">1</span>
                          ) : index === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-black font-black font-mono text-xs inline-flex items-center justify-center">2</span>
                          ) : index === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black font-mono text-xs inline-flex items-center justify-center">3</span>
                          ) : (
                            <span className="font-mono text-slate-400 font-bold">{index + 1}</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getSafePlayerPhoto(item.playerPhoto)}
                              alt={item.playerName}
                              className="w-9 h-10 rounded-lg object-cover object-top border border-emerald-500/30 bg-slate-900"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                              }}
                            />
                            <div>
                              <strong className="text-white block font-bold text-xs">{item.playerName}</strong>
                              <span className="text-[10px] text-slate-400">
                                #{item.jerseyNumber || '—'} {item.position ? `(${item.position})` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-300 font-semibold">{item.teamName}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{item.matchesPlayed}</td>
                        <td className="py-3 px-3 text-center font-sport font-black text-emerald-400 text-base">{item.goals}</td>
                        <td className="py-3 px-3 text-center font-sport font-black text-cyan-400 text-base">{item.assists}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handlePlayerClick(item.playerId)}
                            className="py-1 px-2.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-xs font-semibold cursor-pointer"
                          >
                            ভিউ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

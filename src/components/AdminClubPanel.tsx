import React, { useState } from 'react';
import { Match, Team, Player, UserSession, AuctionSettings, PlayerCategory, AppUser, PlayerMatchPerformance } from '../types';
import { 
  Calendar, Trophy, Shield, Users, Radio, Settings, Plus,
  Edit3, Trash2, CheckCircle2, XCircle, RefreshCw, Smartphone,
  Laptop, Activity, Star, MapPin, Clock, Search, Upload, Tag, Award,
  Download, Eye
} from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO, downloadPlayerPhoto } from '../utils/media';

interface AdminClubPanelProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  activeSessions: UserSession[];
  settings: AuctionSettings;
  categories: PlayerCategory[];
  currentUser: AppUser | null;
  performances?: PlayerMatchPerformance[];
  onAddMatch: () => void;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onAddTeam: () => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddPlayer: () => void;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onApprovePlayer: (player: Player) => void;
  onRejectPlayer: (player: Player) => void;
  onOpenSettings: () => void;
  onOpenCategoryManager: () => void;
  onRefreshData: () => Promise<void> | void;
  onAddPerformance?: (defaultPlayerId?: string) => void;
  onEditPerformance?: (perf: PlayerMatchPerformance) => void;
  onDeletePerformance?: (perfId: string) => void;
  onViewPlayerProfile?: (player: Player) => void;
}

export const AdminClubPanel: React.FC<AdminClubPanelProps> = ({
  matches,
  teams,
  players,
  activeSessions,
  settings,
  categories,
  currentUser,
  performances = [],
  onAddMatch,
  onEditMatch,
  onDeleteMatch,
  onAddTeam,
  onEditTeam,
  onDeleteTeam,
  onAddPlayer,
  onEditPlayer,
  onDeletePlayer,
  onApprovePlayer,
  onRejectPlayer,
  onOpenSettings,
  onOpenCategoryManager,
  onRefreshData,
  onAddPerformance,
  onEditPerformance,
  onDeletePerformance,
  onViewPlayerProfile,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'matches' | 'teams' | 'players' | 'performances' | 'sessions' | 'settings'>('matches');
  const [searchPlayer, setSearchPlayer] = useState('');
  const [searchPerformance, setSearchPerformance] = useState('');
  const [selectedPerformanceTeam, setSelectedPerformanceTeam] = useState('ALL');
  const [selectedPerformancePlayer, setSelectedPerformancePlayer] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pendingPlayers = players.filter((p) => (p.approvalStatus || 'APPROVED') === 'PENDING');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Evaluate heartbeat freshness: active within last 45 seconds
  const isSessionOnline = (session: UserSession) => {
    if (session.status === 'offline') return false;
    if (!session.lastActive) return false;
    const diffSeconds = (Date.now() - new Date(session.lastActive).getTime()) / 1000;
    return diffSeconds < 45;
  };

  const onlineSessionsCount = activeSessions.filter((s) => isSessionOnline(s)).length;

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return `${diffSec} সেকেন্ড আগে`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} মিনিট আগে`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
      return d.toLocaleDateString('bn-BD');
    } catch {
      return isoString;
    }
  };

  // Filtered performances
  const filteredPerformances = performances.filter((perf) => {
    if (selectedPerformanceTeam !== 'ALL' && perf.teamId !== selectedPerformanceTeam) {
      return false;
    }
    if (selectedPerformancePlayer !== 'ALL' && perf.playerId !== selectedPerformancePlayer) {
      return false;
    }
    if (searchPerformance.trim()) {
      const q = searchPerformance.toLowerCase().trim();
      const matchName = (perf.playerName || '').toLowerCase();
      const matchId = (perf.playerId || '').toLowerCase();
      const matchT = (perf.matchTitle || '').toLowerCase();
      const teamN = (perf.teamName || '').toLowerCase();
      if (!matchName.includes(q) && !matchId.includes(q) && !matchT.includes(q) && !teamN.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Admin Panel Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#071d12] via-[#05180f] to-[#031109] border-2 border-emerald-500/50 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-sport">
                  ক্লাব ও লিগ এডমিন কন্ট্রোল প্যানেল
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black uppercase font-mono">
                  Full Access
                </span>
              </div>
              <p className="text-xs text-slate-300 font-bn">
                ম্যাচ রেজাল্ট, খেলোয়াড়ের ইন্ডিভিজুয়াল পারফরম্যান্স শিট, দল ও লাইভ সেশন পরিচালনা করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="py-2 px-3.5 rounded-xl bg-black/60 hover:bg-black/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ সিঙ্ক</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-950">
          <button
            onClick={() => setActiveAdminTab('matches')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'matches'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white bg-black/40'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>ম্যাচ ও রেজাল্ট ({matches.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('performances')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'performances'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                : 'text-emerald-300 hover:text-white bg-black/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>পারফরম্যান্স শিট ({performances.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('teams')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'teams'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white bg-black/40'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>দল ও লোগো ({teams.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('players')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'players'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white bg-black/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>খেলোয়াড় ও স্কোয়াড ({players.length})</span>
            {pendingPlayers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                {pendingPlayers.length} নতুন
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('sessions')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'sessions'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                : 'text-cyan-300 hover:text-white bg-black/40'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>সেশন হার্টবিট মনিটর ({activeSessions.length})</span>
            {onlineSessionsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'settings'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                : 'text-amber-300 hover:text-white bg-black/40'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>সেটিংস ও নিয়ম</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Matches Management */}
      {activeAdminTab === 'matches' && (
        <div className="p-6 rounded-3xl bg-[#04160c] border-2 border-emerald-500/30 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-950">
            <div>
              <h3 className="text-lg font-bold text-white font-sport flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>টুর্নামেন্ট ফিক্সচার ও ম্যাচ রেজাল্ট পরিচালনা</span>
              </h3>
              <p className="text-xs text-slate-400 font-bn">
                নতুন ম্যাচ সূচি যোগ করুন, লাইভ স্কোর বা সমাপ্ত ফলাফল এন্ট্রি করুন।
              </p>
            </div>

            <button
              onClick={onAddMatch}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ম্যাচ যোগ করুন</span>
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/30 border border-emerald-950 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">কোনো ম্যাচ ফিক্সচার যুক্ত করা হয়নি।</p>
              <button
                onClick={onAddMatch}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>প্রথম ম্যাচ তৈরি করুন</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="p-5 rounded-2xl bg-[#03140a] border border-emerald-950 hover:border-emerald-500/40 transition-all space-y-3.5 relative overflow-hidden group shadow-md"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{match.date} {match.time ? `• ${match.time}` : ''}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      match.status === 'live'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : match.status === 'finished'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {match.status === 'live' ? '● লাইভ' : match.status === 'finished' ? 'সমাপ্ত' : 'আসন্ন'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <div className="flex-1 text-center space-y-1">
                      <strong className="text-sm font-bold text-white block truncate">{match.homeTeamName}</strong>
                    </div>

                    <div className="px-4 py-1.5 rounded-xl bg-black/60 border border-emerald-950 text-center min-w-[70px]">
                      {match.status === 'finished' || match.status === 'live' ? (
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-bold uppercase">VS</span>
                      )}
                    </div>

                    <div className="flex-1 text-center space-y-1">
                      <strong className="text-sm font-bold text-white block truncate">{match.awayTeamName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-950/60 text-xs">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span>{match.venue || 'Faridpur Stadium'}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditMatch(match)}
                        className="py-1 px-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        এডিট রেজাল্ট
                      </button>
                      <button
                        onClick={() => onDeleteMatch(match.id)}
                        className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 cursor-pointer transition-colors"
                        title="ম্যাচ মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Individual Player Performance Sheet Management */}
      {activeAdminTab === 'performances' && (
        <div className="p-6 rounded-3xl bg-[#04160c] border-2 border-emerald-500/30 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-950">
            <div>
              <h3 className="text-lg font-bold text-white font-sport flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>ইন্ডিভিজুয়াল প্লেয়ার পারফরম্যান্স শিট (Performance Sheets)</span>
              </h3>
              <p className="text-xs text-slate-400 font-bn">
                ম্যাচভিত্তিক প্লেয়ার গোল, অ্যাসিস্ট, ট্যাকল, ইন্টারসেপশন, সেভ, কার্ড ও রেটিং এন্ট্রি, এডিট ও ডিলিট করুন।
              </p>
            </div>

            {onAddPerformance && (
              <button
                onClick={() => onAddPerformance()}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন পারফরম্যান্স এন্ট্রি</span>
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="খেলোয়াড়ের নাম, আইডি, দল বা ম্যাচ দিয়ে সার্চ করুন..."
                value={searchPerformance}
                onChange={(e) => setSearchPerformance(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#031109] border border-emerald-950 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPerformanceTeam}
                onChange={(e) => setSelectedPerformanceTeam(e.target.value)}
                className="py-2 px-3 rounded-xl bg-[#031109] border border-emerald-950 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">সকল দল (All Teams)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                value={selectedPerformancePlayer}
                onChange={(e) => setSelectedPerformancePlayer(e.target.value)}
                className="py-2 px-3 rounded-xl bg-[#031109] border border-emerald-950 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">সকল খেলোয়াড় (All Players)</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (#{p.jerseyNumber})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Performances Table */}
          {filteredPerformances.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/30 border border-emerald-950 text-center space-y-3">
              <Activity className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">
                {performances.length === 0 ? 'এখনও কোনো ম্যাচ পারফরম্যান্স এন্ট্রি যোগ করা হয়নি।' : 'অনুসন্ধানের সাথে কোনো রেকর্ড মিলছে না।'}
              </p>
              {onAddPerformance && (
                <button
                  onClick={() => onAddPerformance()}
                  className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>প্রথম পারফরম্যান্স এন্ট্রি করুন</span>
                </button>
              )}
            </div>
          ) : (
            <div className="border border-emerald-950 rounded-2xl overflow-hidden bg-black/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#03150e] text-slate-400 uppercase text-[10px] border-b border-emerald-950 font-sport tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">খেলোয়াড় ও আইডি</th>
                      <th className="py-3 px-3">দল</th>
                      <th className="py-3 px-3">ম্যাচ ও তারিখ</th>
                      <th className="py-3 px-2 text-center">মিনিট</th>
                      <th className="py-3 px-2 text-center text-emerald-400">গোল</th>
                      <th className="py-3 px-2 text-center text-cyan-400">অ্যাসিস্ট</th>
                      <th className="py-3 px-2 text-center">ট্যাকল</th>
                      <th className="py-3 px-2 text-center">ক্লিন শিট</th>
                      <th className="py-3 px-2 text-center">সেভ</th>
                      <th className="py-3 px-2 text-center">কার্ড</th>
                      <th className="py-3 px-2.5 text-center text-amber-300">রেটিং</th>
                      <th className="py-3 px-3 text-right">অ্যাকশন</th>
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

                        <td className="py-3 px-3">
                          <span className="text-slate-300 font-semibold">{perf.teamName || 'দলবিহীন'}</span>
                        </td>

                        <td className="py-3 px-3">
                          <div>
                            <span className="text-white block font-bold text-xs">{perf.matchTitle}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{perf.matchDate}</span>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-300">
                          {perf.minutesPlayed}'
                        </td>

                        <td className="py-3 px-2 text-center font-sport font-black text-emerald-400 text-sm">
                          {perf.goals}
                        </td>

                        <td className="py-3 px-2 text-center font-sport font-black text-cyan-400 text-sm">
                          {perf.assists}
                        </td>

                        <td className="py-3 px-2 text-center font-mono text-blue-300">
                          {perf.tackles}
                        </td>

                        <td className="py-3 px-2 text-center">
                          {perf.cleanSheets ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">হ্যাঁ</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="py-3 px-2 text-center font-mono text-amber-300">
                          {perf.saves || '—'}
                        </td>

                        <td className="py-3 px-2 text-center">
                          {perf.yellowCards > 0 || perf.redCards > 0 ? (
                            <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                              {perf.yellowCards > 0 && <span className="text-amber-400 font-bold">🟨{perf.yellowCards}</span>}
                              {perf.redCards > 0 && <span className="text-rose-400 font-bold">🟥{perf.redCards}</span>}
                            </div>
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
                            {/* Photo download button */}
                            <button
                              type="button"
                              onClick={() => downloadPlayerPhoto(perf.playerPhoto || '', perf.playerName, perf.playerId)}
                              className="p-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                              title="ছবি ডাউনলোড করুন"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {onEditPerformance && (
                              <button
                                onClick={() => onEditPerformance(perf)}
                                className="p-1 rounded-lg bg-black/60 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-emerald-950 transition-colors cursor-pointer"
                                title="এন্ট্রি এডিট করুন"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onDeletePerformance && (
                              <button
                                onClick={() => onDeletePerformance(perf.id)}
                                className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                                title="এন্ট্রি মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Tab 3: Teams Management */}
      {activeAdminTab === 'teams' && (
        <div className="p-6 rounded-3xl bg-[#04160c] border-2 border-emerald-500/30 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-950">
            <div>
              <h3 className="text-lg font-bold text-white font-sport flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>দল ও ক্লাব লোগো পরিচালনা</span>
              </h3>
              <p className="text-xs text-slate-400 font-bn">
                নতুন দল যোগ করুন, লোগো, দলের নাম ও ওনার ইনফরমেশন আপডেট বা ডিলিট করুন।
              </p>
            </div>

            <button
              onClick={onAddTeam}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন দল যুক্ত করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="p-5 rounded-2xl bg-[#03140a] border border-emerald-950 hover:border-emerald-500/40 transition-all space-y-3 relative group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-950 shadow-md"
                  />
                  <div>
                    <strong className="text-base font-bold text-white block">{team.name}</strong>
                    <span className="text-xs text-slate-400 block font-bn">ওনার: {team.ownerName || '—'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-950/60 flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400">
                    স্কোয়াড: {players.filter((p) => p.teamId === team.id).length} জন
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditTeam(team)}
                      className="py-1 px-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold cursor-pointer"
                    >
                      এডিট
                    </button>
                    <button
                      onClick={() => onDeleteTeam(team.id)}
                      className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 cursor-pointer"
                      title="দল মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Players & Squad Management */}
      {activeAdminTab === 'players' && (
        <div className="p-6 rounded-3xl bg-[#04160c] border-2 border-emerald-500/30 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-950">
            <div>
              <h3 className="text-lg font-bold text-white font-sport flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>খেলোয়াড় ও স্কোয়াড পরিচালনা</span>
              </h3>
              <p className="text-xs text-slate-400 font-bn">
                নতুন খেলোয়াড় যোগ, এডিট, দল পরিবর্তন এবং ছবি ডাউনলোড করুন।
              </p>
            </div>

            <button
              onClick={onAddPlayer}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্লেয়ার যোগ করুন</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-950 flex items-center gap-3">
            <Search className="w-4 h-4 text-emerald-500 ml-1" />
            <input
              type="text"
              placeholder="খেলোয়াড়ের নাম বা আইডি দিয়ে সার্চ..."
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <div className="border border-emerald-950 rounded-2xl overflow-hidden bg-black/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#03150e] text-slate-400 uppercase text-[10px] border-b border-emerald-950">
                  <tr>
                    <th className="py-3 px-4">খেলোয়াড়</th>
                    <th className="py-3 px-3">পজিশন</th>
                    <th className="py-3 px-3">জার্সি</th>
                    <th className="py-3 px-3">বর্তমান দল</th>
                    <th className="py-3 px-3">অনুমোদন অবস্থা</th>
                    <th className="py-3 px-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60">
                  {players
                    .filter((p) => !searchPlayer || p.name.toLowerCase().includes(searchPlayer.toLowerCase()) || p.id.toLowerCase().includes(searchPlayer.toLowerCase()))
                    .map((p) => {
                      const t = teams.find((team) => team.id === p.teamId);

                      return (
                        <tr key={p.id} className="hover:bg-emerald-950/20 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={getSafePlayerPhoto(p.photoUrl)}
                                alt={p.name}
                                className="w-8 h-9 rounded-lg object-cover object-top border border-emerald-950 bg-slate-900"
                              />
                              <div>
                                <strong className="text-white block">{p.name}</strong>
                                <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                              {p.position}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">{p.jerseyNumber || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-300">{t?.name || 'দলবিহীন (Free Agent)'}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.approvalStatus === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {p.approvalStatus || 'APPROVED'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Photo download button */}
                              <button
                                type="button"
                                onClick={() => downloadPlayerPhoto(p.photoUrl, p.name, p.id)}
                                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                                title="প্লেয়ারের ছবি ডাউনলোড করুন"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {onAddPerformance && (
                                <button
                                  type="button"
                                  onClick={() => onAddPerformance(p.id)}
                                  className="py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold cursor-pointer"
                                  title="ম্যাচ পারফরম্যান্স এন্ট্রি"
                                >
                                  +পারফরম্যান্স
                                </button>
                              )}

                              {onViewPlayerProfile && (
                                <button
                                  type="button"
                                  onClick={() => onViewPlayerProfile(p)}
                                  className="py-1 px-2 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-[11px] font-semibold cursor-pointer"
                                >
                                  প্রোফাইল
                                </button>
                              )}

                              <button
                                onClick={() => onEditPlayer(p)}
                                className="py-1 px-2.5 rounded-lg bg-black/60 text-slate-200 hover:text-white border border-emerald-950 text-[11px] cursor-pointer"
                              >
                                এডিট
                              </button>
                              <button
                                onClick={() => onDeletePlayer(p.id)}
                                className="py-1 px-2 rounded-lg bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-[11px] cursor-pointer"
                              >
                                মুছুন
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Live Session & Device Heartbeat Monitor */}
      {activeAdminTab === 'sessions' && (
        <div className="p-6 rounded-3xl bg-[#04160d] border-2 border-cyan-500/40 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyan-500/20">
            <div>
              <h3 className="text-lg font-bold text-white font-sport flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <span>লাইভ সেশন ও ডিভাইস হার্টবিট মনিটর (Device Heartbeat Monitor)</span>
              </h3>
              <p className="text-xs text-slate-300 font-bn">
                প্রতিটি ডিভাইসের 'lastActive' হার্টবিট ট্র্যাক করা হয়। গত ৪৫ সেকেন্ডে সক্রিয় ডিভাইসগুলো <strong className="text-emerald-400">অনলাইন</strong> হিসেবে দেখা যায়, আর সংযোগ বিচ্ছিন্ন ডিভাইসগুলো <strong className="text-slate-400">অফলাইন</strong> চিহ্নিত হয়।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-black border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
                অনলাইন ডিভাইস: {onlineSessionsCount} জন
              </span>
            </div>
          </div>

          <div className="border border-cyan-950/80 rounded-2xl overflow-hidden bg-black/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#03150e] text-slate-400 uppercase text-[10px] border-b border-cyan-950">
                  <tr>
                    <th className="py-3.5 px-4">ইউজার / একাউন্ট</th>
                    <th className="py-3.5 px-3">ভূমিকা (Role)</th>
                    <th className="py-3.5 px-3">ডিভাইস / ব্রাউজার</th>
                    <th className="py-3.5 px-3">লগইন সময়</th>
                    <th className="py-3.5 px-3">সর্বশেষ হার্টবিট (Last Active)</th>
                    <th className="py-3.5 px-3">লাইভ স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-950/40">
                  {activeSessions.map((session) => {
                    const online = isSessionOnline(session);

                    return (
                      <tr key={session.id} className="hover:bg-cyan-950/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                              {session.name ? session.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <strong className="text-white block">{session.name}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">{session.userId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            session.role === 'admin'
                              ? 'bg-amber-500 text-black'
                              : session.role === 'owner'
                              ? 'bg-emerald-500 text-black'
                              : 'bg-blue-500 text-white'
                          }`}>
                            {session.role}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            {session.deviceInfo?.includes('Mobile') || session.deviceInfo?.includes('Android') || session.deviceInfo?.includes('iOS') ? (
                              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span>{session.deviceInfo || 'ওয়েব ব্রাউজার'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {formatTimeAgo(session.loginTime)}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                          {formatTimeAgo(session.lastActive)}
                        </td>

                        <td className="py-3 px-3">
                          {online ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span>অনলাইন (Online)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black text-slate-400 border border-slate-800">
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              <span>অফলাইন (Offline)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Settings Management */}
      {activeAdminTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-[#04160d] border-2 border-emerald-500/30 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-950">
            <div>
              <h3 className="text-lg font-bold text-white font-sport flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>টুর্নামেন্ট ও অকশন সেটিংস (Settings)</span>
              </h3>
              <p className="text-xs text-slate-300 font-bn">
                টুর্নামেন্টের নাম, বাজেট, প্লেয়ার ক্যাটাগরি বেস প্রাইজ ও সিস্টেম কনফিগারেশন।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSettings}
                className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer"
              >
                টুর্নামেন্ট সেটিংস এডিট
              </button>
              <button
                onClick={onOpenCategoryManager}
                className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer"
              >
                ক্যাটাগরি প্রাইজ ম্যানেজার
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-black/50 border border-emerald-950 space-y-1">
              <span className="text-slate-400 block">টুর্নামেন্টের নাম:</span>
              <strong className="text-white text-sm block">{settings.tournamentName}</strong>
              <span className="text-slate-500 font-mono">সিজন: {settings.seasonYear}</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-emerald-950 space-y-1">
              <span className="text-slate-400 block">প্রাথমিক টিম বাজেট:</span>
              <strong className="text-emerald-400 text-sm font-mono block">
                {settings.initialBudgetPerTeam?.toLocaleString() || '10,000'} pt
              </strong>
              <span className="text-slate-500 font-mono">স্কোয়াড লিমিট: {settings.squadLimit || 7} জন</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-emerald-950 space-y-1">
              <span className="text-slate-400 block">প্লেয়ার সেলফ-রেজিস্ট্রেশন:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block mt-1">
                {settings.allowPlayerSelfRegistration ? 'উন্মুক্ত (সক্রিয়)' : 'বন্ধ'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Player, Team, AuctionSettings, AuctionHistoryItem, AuctionNotification, AppUser, LiveAuctionState } from '../types';
import { 
  Users, Shield, Wallet, Trophy, 
  Clock, ArrowUpRight, PlayCircle, Activity, Bell,
  Plus, Sliders, Crown, Lock, Key, Link as LinkIcon, Share2
} from 'lucide-react';
import { getSafePlayerPhoto, getSafeTeamLogo, DEFAULT_PLAYER_PHOTO, DEFAULT_TEAM_LOGO } from '../utils/media';

interface DashboardProps {
  players: Player[];
  teams: Team[];
  settings: AuctionSettings;
  history: AuctionHistoryItem[];
  notifications: AuctionNotification[];
  teamPurchases: Record<string, { totalSpent: number; count: number }>;
  isAdmin: boolean;
  currentUser: AppUser | null;
  onNavigateTab: (tab: string) => void;
  onViewProfile: (player: Player) => void;
  onOpenResetModal: () => void;
  onOpenEditSettingsModal: () => void;
  onAddPlayerClick: () => void;
  onAddTeamClick: () => void;
  onOpenLogin: () => void;
  onOpenAdminCredentials?: () => void;
  onOpenOwnerPortal?: () => void;
  onOpenShareModal?: () => void;
  liveAuctionState?: LiveAuctionState;
  isLoading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  players,
  teams,
  settings,
  history,
  notifications,
  teamPurchases,
  isAdmin,
  currentUser,
  onNavigateTab,
  onViewProfile,
  onOpenResetModal,
  onOpenEditSettingsModal,
  onAddPlayerClick,
  onAddTeamClick,
  onOpenLogin,
  onOpenAdminCredentials,
  onOpenOwnerPortal,
  onOpenShareModal,
  liveAuctionState,
  isLoading = false,
}) => {
  const totalPlayers = players.length;
  const approvedPlayers = players.filter((p) => (p.approvalStatus || 'APPROVED') === 'APPROVED');
  const pendingPlayers = players.filter((p) => (p.approvalStatus || 'APPROVED') === 'PENDING');
  const soldPlayers = players.filter((p) => p.status === 'sold');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');
  const availablePlayers = approvedPlayers.filter((p) => p.status === 'available' || p.status === 'live');

  const totalTournamentBudget = teams.reduce((acc, t) => acc + (t.initialBudget || 0), 0);
  const totalPointsSpent = Object.values(teamPurchases).reduce((acc, curr) => acc + curr.totalSpent, 0);
  const remainingTournamentPoints = totalTournamentBudget - totalPointsSpent;

  const positionCounts = {
    GK: players.filter((p) => p.position === 'GK').length,
    DEF: players.filter((p) => p.position === 'DEF').length,
    MID: players.filter((p) => p.position === 'MID').length,
    ST: players.filter((p) => p.position === 'ST').length,
  };

  return (
    <div className="space-y-6">
      {/* Loading Banner if fetching initial Firebase data */}
      {isLoading && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2 animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Firebase ডাটাবেজ থেকে সর্বশেষ ডাটা সিঙ্ক হচ্ছে...</span>
        </div>
      )}

      {/* Pending Approvals Alert Banner */}
      {isAdmin && pendingPlayers.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="text-xs font-bold font-sport">
              অনুমোদন অপেক্ষমাণ: <strong className="text-white font-mono">{pendingPlayers.length}</strong> জন প্লেয়ার অনলাইনে রেজিস্ট্রেশন করেছেন!
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('players')}
            className="py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-sport cursor-pointer shadow-md transition-all shrink-0"
          >
            অনুমোদন করুন (Review & Approve)
          </button>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#041a10] via-[#072417] to-[#041a10] border border-emerald-500/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{settings.seasonYear} সিজন টুর্নামেন্ট</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white font-sport tracking-wide">
              {settings.tournamentName}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              ফুটবল প্লেয়ার অকশন সিস্টেম। ১ এডমিন ও ৪ টিম ওনারের লাইভ বিডিং, প্লেয়ার সেলফ-রেজিস্ট্রেশন এবং রিয়েল-টাইম স্ক্রিন সাপোর্ট।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('live')}
              className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-sport font-bold text-sm shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-5 h-5" />
              <span>লাইভ নিলামে যান</span>
            </button>

            <button
              onClick={() => onNavigateTab('player-register')}
              className="py-2.5 px-4 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-sport font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>প্লেয়ার রেজিস্ট্রেশন পোর্টাল</span>
            </button>

            {isAdmin && (
              <button
                onClick={onAddPlayerClick}
                className="py-2.5 px-4 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-sport font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>প্লেয়ার যোগ</span>
              </button>
            )}

            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-sport font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                title="ওয়েবসাইট লিংক ও QR কোড শেয়ার করুন"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ফ্রি সাইট শেয়ার</span>
              </button>
            )}

            {/* Settings Edit Button: ONLY RENDER FOR ADMIN */}
            {isAdmin && (
              <button
                onClick={onOpenEditSettingsModal}
                className="py-2.5 px-3.5 rounded-xl bg-black/60 hover:bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-sport font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>সেটিংস এডিট</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#07190f] border border-emerald-950/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">নিবন্ধিত প্লেয়ার</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-sport font-black text-2xl md:text-3xl text-white">
            {totalPlayers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            উপলব্ধ (Available): <strong className="text-emerald-400">{availablePlayers.length}</strong> জন
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#07190f] border border-emerald-950/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">মোট টুর্নামেন্ট বাজেট</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-sport font-black text-2xl md:text-3xl text-amber-300">
            {totalTournamentBudget.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            মোট দল: <strong className="text-white">{teams.length}</strong> টি
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#07190f] border border-emerald-950/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">মোট ব্যয়িত পয়েন্ট</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-sport font-black text-2xl md:text-3xl text-cyan-300">
            {totalPointsSpent.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            অবশিষ্ট: <strong className="text-emerald-400">{remainingTournamentPoints.toLocaleString()}</strong> pt
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#07190f] border border-emerald-950/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">বিক্রিত / অবিক্রিত</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-sport font-black text-2xl md:text-3xl text-emerald-300">
            {soldPlayers.length}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {unsoldPlayers.length} Unsold</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            বিক্রির হার: {totalPlayers > 0 ? Math.round((soldPlayers.length / totalPlayers) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* AUTHENTICATION & ROLE ACCESS PANEL */}
      <div className="p-5 rounded-2xl bg-[#06180f] border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              currentUser?.role === 'admin'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : currentUser?.role === 'owner'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-black/40 border-slate-800 text-slate-400'
            }`}>
              {currentUser?.role === 'admin' ? (
                <Crown className="w-5 h-5" />
              ) : currentUser?.role === 'owner' ? (
                <Shield className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>

            <div>
              <h3 className="text-sm md:text-base font-bold text-white font-sport">
                {currentUser?.role === 'admin'
                  ? `এডমিন প্যানেল: ${currentUser.name} (${currentUser.userId})`
                  : currentUser?.role === 'owner'
                  ? `ওনার পোর্টাল: ${currentUser.name} (${currentUser.userId})`
                  : 'টুর্নামেন্ট অথেনটিকেশন পোর্টাল (১ এডমিন ও ৪ ওনার আইডি)'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser?.role === 'admin'
                  ? 'আপনার সকল বিডিং ও নিলাম কার্যক্রমে সম্পূর্ণ নিয়ন্ত্রণ রয়েছে। আপনি সকল আইডি ও পাসওয়ার্ড দেখতে ও বদলাতে পারেন।'
                  : currentUser?.role === 'owner'
                  ? 'আপনি আপনার দলের নাম, ছবি এবং নিজস্ব ইউজার আইডি ও পাসওয়ার্ড পরিবর্তন করতে পারেন।'
                  : 'এডমিন ও ৪ দল মালিকের গোপনীয় আইডি দিয়ে লগইন করুন।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {currentUser?.role === 'admin' && onOpenAdminCredentials && (
              <button
                onClick={onOpenAdminCredentials}
                className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-sport flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Key className="w-3.5 h-3.5" />
                <span>সকল আইডি ও পাসওয়ার্ড দেখুন</span>
              </button>
            )}

            {currentUser?.role === 'owner' && onOpenOwnerPortal && (
              <button
                onClick={onOpenOwnerPortal}
                className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>দলের নাম, ছবি ও পাসওয়ার্ড পরিবর্তন</span>
              </button>
            )}

            {!currentUser && (
              <button
                onClick={onOpenLogin}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>লগইন করুন</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Teams Status Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>প্রতিযোগিতায় দলসমূহ ({teams.length} টি দল)</span>
          </h3>
          <div className="flex items-center gap-3">
            {(isAdmin || currentUser?.role === 'owner') && (
              <button
                onClick={onAddTeamClick}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>দল যোগ</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('teams')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>সকল দল</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#06180f] border-2 border-dashed border-emerald-950/80 flex flex-col items-center justify-center space-y-2">
            <Shield className="w-10 h-10 text-emerald-400/60" />
            <h4 className="text-sm font-bold text-white font-sport">কোনো দল এখনো যুক্ত করা হয়নি</h4>
            <p className="text-xs text-slate-400 max-w-md">
              &apos;দল যোগ&apos; বাটনে ক্লিক করে নতুন দল তৈরি করুন অথবা &apos;দলসমূহ&apos; ট্যাবে যান।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((team) => {
              const purchaseInfo = teamPurchases[team.id] || { totalSpent: 0, count: 0 };
              const percentSpent = Math.min(100, Math.round((purchaseInfo.totalSpent / team.initialBudget) * 100));

              return (
                <div
                  key={team.id}
                  className="p-4 rounded-2xl bg-[#07180f] border border-emerald-950 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={getSafeTeamLogo(team.logoUrl)}
                        alt={team.name}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{team.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate">মালিক: {team.ownerName}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-black/40 border border-emerald-950 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">শুরুর বাজেট:</span>
                        <span className="font-mono text-white">{team.initialBudget.toLocaleString()} pt</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">মোট খরচ:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {purchaseInfo.totalSpent.toLocaleString()} pt
                        </span>
                      </div>
                      {(() => {
                        const isLeading = liveAuctionState?.status === 'bidding' &&
                          (liveAuctionState?.highestBidTeamId === team.id || liveAuctionState?.reservedTeamId === team.id) &&
                          (liveAuctionState?.currentBid || 0) > 0;
                        const reserved = isLeading ? (liveAuctionState?.reservedAmount || liveAuctionState?.currentBid || 0) : 0;
                        const available = Math.max(0, (team.initialBudget || 10000) - purchaseInfo.totalSpent - reserved);

                        return (
                          <>
                            {reserved > 0 && (
                              <div className="flex justify-between text-amber-300">
                                <span className="flex items-center gap-1">🔒 সংরক্ষিত (Reserved):</span>
                                <span className="font-mono font-bold">{reserved.toLocaleString()} pt</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-emerald-950/70">
                              <span className="text-emerald-400 font-semibold">Available Balance:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {available.toLocaleString()} pt
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>ব্যয়িত শতাংশ</span>
                        <span>{percentSpent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-950 flex items-center justify-between text-xs">
                    <span className="text-slate-400">স্কোয়াড প্লেয়ার:</span>
                    <span className="font-mono font-bold text-white">
                      {purchaseInfo.count} / {settings.squadLimit} জন
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Notifications & Activity */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span>লাইভ পপ-আপ নোটিফিকেশন</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">২ সেকেন্ড স্ক্রিনে প্রদর্শিত হয়</span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-black/40 border border-emerald-950/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">{n.title}</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">{n.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>সর্বশেষ নিলাম কার্যকলাপ</span>
              </h4>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                সব দেখুন
              </button>
            </div>

            {history.length > 0 ? (
              <div className="divide-y divide-emerald-950/60">
                {history.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
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
                        <span className="text-[11px] text-slate-400">
                          {item.teamName || 'অবিক্রিত'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-300 block">
                        {item.status === 'sold' ? `${item.winningBid} pt` : 'Unsold'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">কোনো নিলাম রেকর্ড নেই</p>
            )}
          </div>
        </div>

        {/* Right Column: Positions & Available Players */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              পজিশনভিত্তিক প্লেয়ার সংখ্যা
            </h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950">
                <span className="text-[10px] text-amber-400 font-bold block uppercase">গোলকিপার (GK)</span>
                <span className="font-sport font-black text-2xl text-white mt-1 block">
                  {positionCounts.GK} জন
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950">
                <span className="text-[10px] text-blue-400 font-bold block uppercase">ডিফেন্ডার (DEF)</span>
                <span className="font-sport font-black text-2xl text-white mt-1 block">
                  {positionCounts.DEF} জন
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">মিডফিল্ডার (MID)</span>
                <span className="font-sport font-black text-2xl text-white mt-1 block">
                  {positionCounts.MID} জন
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950">
                <span className="text-[10px] text-rose-400 font-bold block uppercase">স্ট্রাইকার (ST)</span>
                <span className="font-sport font-black text-2xl text-white mt-1 block">
                  {positionCounts.ST} জন
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                উপলব্ধ প্লেয়ার ({availablePlayers.length})
              </h4>
              <button
                onClick={() => onNavigateTab('players')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                সব দেখুন
              </button>
            </div>

            {availablePlayers.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">বর্তমানে কোনো প্লেয়ার উপলব্ধ নেই</p>
                <button
                  onClick={() => onNavigateTab('player-register')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline"
                >
                  রেজিস্ট্রেশন লিংক পেতে এখানে ক্লিক করুন
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {availablePlayers.slice(0, 3).map((player) => (
                  <div
                    key={player.id}
                    onClick={() => onViewProfile(player)}
                    className="p-2.5 rounded-xl bg-black/40 border border-emerald-950/80 hover:border-emerald-500/30 flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getSafePlayerPhoto(player.photoUrl)}
                        alt={player.name}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                        }}
                      />
                      <div>
                        <h5 className="text-xs font-bold text-white line-clamp-1">{player.name}</h5>
                        <span className="text-[10px] text-slate-400">
                          {player.position} • রেটিং {player.rating} • #{player.jerseyNumber}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                      {player.basePrice} pt
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

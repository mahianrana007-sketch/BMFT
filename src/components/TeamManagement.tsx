import React, { useState } from 'react';
import { Team, Player, AuctionSettings, AppUser, LiveAuctionState } from '../types';
import { 
  Shield, Users, Edit2, RotateCcw,
  Eye, Plus, Trash2, Sliders
} from 'lucide-react';
import { getSafePlayerPhoto, getSafeTeamLogo, DEFAULT_PLAYER_PHOTO, DEFAULT_TEAM_LOGO } from '../utils/media';

interface TeamManagementProps {
  teams: Team[];
  players: Player[];
  settings: AuctionSettings;
  isAdmin: boolean;
  currentUser: AppUser | null;
  onAddTeamClick: () => void;
  onEditTeamClick: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onReleasePlayer: (player: Player) => void;
  onViewProfile: (player: Player) => void;
  onOpenOwnerPortal: () => void;
  teamPurchases: Record<string, { totalSpent: number; count: number }>;
  liveAuctionState?: LiveAuctionState;
  isLoading?: boolean;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  teams,
  players,
  settings,
  isAdmin,
  currentUser,
  onAddTeamClick,
  onEditTeamClick,
  onDeleteTeam,
  onReleasePlayer,
  onViewProfile,
  onOpenOwnerPortal,
  teamPurchases,
  liveAuctionState,
  isLoading = false,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');

  const currentTeam = teams.find((t) => t.id === selectedTeamId) || teams[0] || null;

  const squadPlayers = currentTeam 
    ? players.filter((p) => p.teamId === currentTeam.id && p.status === 'sold')
    : [];

  const positionSummary = {
    GK: squadPlayers.filter((p) => p.position === 'GK'),
    DEF: squadPlayers.filter((p) => p.position === 'DEF'),
    MID: squadPlayers.filter((p) => p.position === 'MID'),
    ST: squadPlayers.filter((p) => p.position === 'ST'),
  };

  const spent = currentTeam ? (teamPurchases[currentTeam.id]?.totalSpent || 0) : 0;
  const isCurrentTeamReserved = currentTeam && liveAuctionState?.status === 'bidding' &&
    (liveAuctionState?.highestBidTeamId === currentTeam.id || liveAuctionState?.reservedTeamId === currentTeam.id) &&
    (liveAuctionState?.currentBid || 0) > 0;
  const currentTeamReserved = isCurrentTeamReserved ? (liveAuctionState?.reservedAmount || liveAuctionState?.currentBid || 0) : 0;
  const availableBalance = currentTeam ? Math.max(0, (currentTeam.initialBudget || 10000) - spent - currentTeamReserved) : 0;

  const isCurrentTeamOwner = currentUser?.role === 'owner' && (
    currentTeam?.ownerUserId?.toLowerCase() === currentUser.userId.toLowerCase() ||
    (currentUser.ownerIndex && teams[currentUser.ownerIndex - 1]?.id === currentTeam?.id)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-sport tracking-wide">
            দল ও স্কোয়াড পর্যালোচনা (Team Management)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            মোট {teams.length} টি দল স্থায়ীভাবে সংরক্ষিত রয়েছে
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser?.role === 'owner' && (
            <button
              onClick={onOpenOwnerPortal}
              className="py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
            >
              <Sliders className="w-4 h-4" />
              <span>আমার দলের নাম, ছবি ও পাসওয়ার্ড পরিবর্তন</span>
            </button>
          )}

          {(isAdmin || currentUser?.role === 'owner') && (
            <button
              onClick={onAddTeamClick}
              className="py-2.5 px-4 rounded-xl text-xs font-bold font-sport flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন দল যুক্ত করুন</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-[#06180f] border border-emerald-950 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-emerald-300 font-semibold">Firebase থেকে দলের তথ্য লোড হচ্ছে...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#06180f] border-2 border-dashed border-emerald-950 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white font-sport">বর্তমানে কোনো দল নিবন্ধিত নেই</h3>
          <p className="text-xs text-slate-400 max-w-md">
            &quot;নতুন দল যুক্ত করুন&quot; বোতামে ক্লিক করে নতুন দল তৈরি করুন। দলের সমস্ত তথ্য Firebase-এ স্থায়ীভাবে সংরক্ষিত থাকবে।
          </p>
          {(isAdmin || currentUser?.role === 'owner') && (
            <button
              onClick={onAddTeamClick}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport cursor-pointer"
            >
              প্রথম দল যুক্ত করুন
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Team Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {teams.map((team) => {
              const isSelected = team.id === (currentTeam?.id || '');
              const info = teamPurchases[team.id] || { totalSpent: 0, count: 0 };
              const teamRemaining = team.initialBudget - info.totalSpent;
              const isSquadFull = info.count >= (settings.squadLimit || 7);

              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden ${
                    isSelected
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                      : 'bg-[#06180f] border-emerald-950/80 hover:border-emerald-500/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <img
                    src={getSafeTeamLogo(team.logoUrl)}
                    alt={team.name}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/40 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-white truncate">{team.name}</h4>
                      {isSquadFull && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 border border-rose-500/40 text-rose-300 shrink-0 animate-pulse">
                          FULL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-0.5">
                      <span className="text-slate-300 font-mono font-medium">
                        {info.count}/{settings.squadLimit || 7} জন
                      </span>
                      <span className="font-mono font-bold text-emerald-400">{teamRemaining.toLocaleString()} pt</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      মোট {info.count + 1}/8 (ওনারসহ)
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {currentTeam && (
            <div className="space-y-6">
              {/* Active Team Hero */}
              <div className="p-6 rounded-2xl bg-[#06180f] border border-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <img
                    src={getSafeTeamLogo(currentTeam.logoUrl)}
                    alt={currentTeam.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-white font-sport">{currentTeam.name}</h3>
                      {(isAdmin || isCurrentTeamOwner) && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            onClick={() => onEditTeamClick(currentTeam)}
                            className="p-1.5 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                            title="দলের তথ্য এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm(`আপনি কি নিশ্চিত যে "${currentTeam.name}" দলটিকে মুছে ফেলতে চান?`)) {
                                  onDeleteTeam(currentTeam.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="দলটি মুছে ফেলুন (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      টিম ওনার: <strong className="text-slate-200">{currentTeam.ownerName}</strong>
                      {isCurrentTeamOwner && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          আপনার দল
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Financial Stats */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 bg-black/40 p-4 rounded-xl border border-emerald-950">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">শুরুর বাজেট</span>
                    <span className="text-sm font-mono font-bold text-white">
                      {currentTeam.initialBudget.toLocaleString()} pt
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">মোট খরচ (Final Spent)</span>
                    <span className="text-sm font-mono font-bold text-amber-300">
                      {spent.toLocaleString()} pt
                    </span>
                  </div>
                  {currentTeamReserved > 0 && (
                    <div>
                      <span className="text-[10px] text-amber-400 block uppercase">লাইভ সংরক্ষিত (Reserved)</span>
                      <span className="text-sm font-mono font-bold text-amber-300 flex items-center gap-1">
                        🔒 {currentTeamReserved.toLocaleString()} pt
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-emerald-400 block uppercase">Available Balance</span>
                    <span className="text-base font-mono font-black text-emerald-400">
                      {availableBalance.toLocaleString()} pt
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">স্কোয়াড সংখ্যা</span>
                    <span className="text-sm font-mono font-bold text-cyan-300">
                      {squadPlayers.length} / {settings.squadLimit || 7} জন
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      মোট {squadPlayers.length + 1}/8 (১ ওনারসহ)
                    </span>
                    {squadPlayers.length >= (settings.squadLimit || 7) && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse">
                        SQUAD FULL
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Position Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>পজিশনভিত্তিক স্কোয়াড পর্যালোচনা</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[11px] font-bold text-amber-400 block uppercase">গোলকিপার (GK)</span>
                    <span className="text-2xl font-sport font-black text-white mt-1 block">
                      {positionSummary.GK.length} জন
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[11px] font-bold text-blue-400 block uppercase">ডিফেন্ডার (DEF)</span>
                    <span className="text-2xl font-sport font-black text-white mt-1 block">
                      {positionSummary.DEF.length} জন
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[11px] font-bold text-emerald-400 block uppercase">মিডফিল্ডার (MID)</span>
                    <span className="text-2xl font-sport font-black text-white mt-1 block">
                      {positionSummary.MID.length} জন
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950 text-center">
                    <span className="text-[11px] font-bold text-rose-400 block uppercase">স্ট্রাইকার (ST)</span>
                    <span className="text-2xl font-sport font-black text-white mt-1 block">
                      {positionSummary.ST.length} জন
                    </span>
                  </div>
                </div>
              </div>

              {/* Squad Players List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>দলের খেলোয়াড় রোস্টার ({squadPlayers.length} জন)</span>
                </h4>

                {squadPlayers.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#06180f] border border-emerald-950">
                    <p className="text-xs text-slate-400">
                      এই দলে এখনও কোনো প্লেয়ার কেনা হয়নি। লাইভ নিলাম থেকে প্লেয়ার কেনা হলে এখানে প্রদর্শিত হবে।
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {squadPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="p-3.5 rounded-2xl bg-black/40 border border-emerald-950 hover:border-emerald-500/40 flex items-start justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getSafePlayerPhoto(player.photoUrl)}
                            alt={player.name}
                            className="w-12 h-14 rounded-xl object-cover border border-emerald-500/30"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-1 rounded">
                                {player.id}
                              </span>
                              <span className="text-[10px] font-bold text-slate-300">
                                #{player.jerseyNumber} • {player.position}
                              </span>
                            </div>
                            <h5 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{player.name}</h5>
                            <p className="text-xs text-amber-300 font-mono font-bold mt-0.5">
                              ক্রয়মূল্য: {player.soldPrice} pt
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => onViewProfile(player)}
                            className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold cursor-pointer"
                            title="প্রোফাইল দেখুন"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `${player.name}-কে রিলিজ করে দলের বাজেট ফেরত (${player.soldPrice} pt) দিতে চান?`
                                  )
                                ) {
                                  onReleasePlayer(player);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 text-xs cursor-pointer"
                              title="প্লেয়ার বাতিল/রিলিজ করুন (Admin Only)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

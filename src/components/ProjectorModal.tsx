import React, { useEffect } from 'react';
import { Player, Team } from '../types';
import { X, Star, Timer, Trophy } from 'lucide-react';
import { getSafePlayerPhoto, getSafeTeamLogo, DEFAULT_PLAYER_PHOTO, DEFAULT_TEAM_LOGO } from '../utils/media';

interface ProjectorModalProps {
  isOpen: boolean;
  currentPlayer: Player | null;
  currentBid: number;
  highestBidTeam: Team | null;
  teams: Team[];
  timer: number;
  isTimerRunning: boolean;
  onClose: () => void;
}

export const ProjectorModal: React.FC<ProjectorModalProps> = ({
  isOpen,
  currentPlayer,
  currentBid,
  highestBidTeam,
  teams,
  timer,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentPlayer) return null;

  const positionColor = {
    GK: 'bg-amber-500/30 text-amber-300 border-amber-400',
    DEF: 'bg-blue-500/30 text-blue-300 border-blue-400',
    MID: 'bg-emerald-500/30 text-emerald-300 border-emerald-400',
    ST: 'bg-rose-500/30 text-rose-300 border-rose-400',
  }[currentPlayer.position];

  return (
    <div className="fixed inset-0 z-50 bg-[#020905] text-white flex flex-col p-6 md:p-10 select-none overflow-hidden animate-in fade-in">
      <div className="absolute inset-0 bg-pitch-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Projector Bar */}
      <div className="relative z-10 flex items-center justify-between pb-6 border-b border-emerald-950">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
          <h1 className="font-sport text-xl md:text-3xl font-extrabold tracking-wider text-emerald-400 uppercase">
            MR Football Auction • Official Live Screen
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-6 py-2 rounded-2xl border font-mono font-bold text-2xl md:text-3xl ${
              timer <= 5
                ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-bounce'
                : 'bg-black/60 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <Timer className="w-7 h-7" />
            <span>00:{timer.toString().padStart(2, '0')}</span>
          </div>

          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="স্ক্রিন বন্ধ করুন (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Projector Body */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-72 md:w-96 h-96 md:h-[480px] rounded-3xl overflow-hidden border-4 border-emerald-500/60 shadow-2xl shadow-emerald-950/80 bg-slate-900">
            <img
              src={getSafePlayerPhoto(currentPlayer.photoUrl)}
              alt={currentPlayer.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

            <div className="absolute top-4 right-4 font-sport text-6xl font-black text-white/30">
              #{currentPlayer.jerseyNumber}
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className={`px-4 py-1.5 rounded-xl border text-sm font-extrabold ${positionColor}`}>
                {currentPlayer.position}
              </span>

              <div className="flex items-center gap-1.5 bg-black/80 px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-300">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-sport font-black text-lg">{currentPlayer.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <span className="px-5 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/40 font-mono font-bold text-sm text-emerald-300">
              PLAYER ID: {currentPlayer.id}
            </span>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold tracking-widest uppercase text-emerald-400">
                Official Auction Pool
              </span>
              {currentPlayer.category && (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
                  🏷️ {currentPlayer.category}
                </span>
              )}
              <span className="text-slate-500">•</span>
              <span className="text-sm text-slate-300 font-medium">
                জার্সি #{currentPlayer.jerseyNumber} • বয়স: {currentPlayer.age} বছর
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white font-sport tracking-wide mt-1">
              {currentPlayer.name}
            </h2>

            <p className="text-base text-slate-300 mt-2 font-medium">
              অভিজ্ঞতা: <span className="text-emerald-300">{currentPlayer.experience}</span>
              {currentPlayer.bio && ` • ${currentPlayer.bio.slice(0, 90)}...`}
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/50 border border-emerald-950 max-w-md">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              বেস প্রাইজ:
            </span>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {currentPlayer.basePrice} <span className="text-sm font-normal text-slate-400">পয়েন্ট</span>
            </span>
          </div>

          <div className="p-6 md:p-8 rounded-3xl bg-[#03140c] border-2 border-emerald-500/70 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Trophy className="w-32 h-32 text-emerald-400" />
            </div>

            <div className="relative z-10 space-y-4">
              <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-emerald-400 block">
                বর্তমান সর্বোচ্চ ডাক (Current Highest Bid)
              </span>

              <div className="flex items-baseline gap-3">
                <span className="font-sport font-black text-5xl md:text-7xl text-amber-300 tracking-tight">
                  {currentBid.toLocaleString()}
                </span>
                <span className="text-lg md:text-2xl font-bold text-slate-300 uppercase">
                  পয়েন্ট (Points)
                </span>
              </div>

              <div className="pt-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                  ডাককারী দল:
                </span>
                {highestBidTeam ? (
                  <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 shadow-lg">
                    <img
                      src={getSafeTeamLogo(highestBidTeam.logoUrl)}
                      alt={highestBidTeam.name}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-400"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                      }}
                    />
                    <div>
                      <h4 className="text-lg md:text-xl font-black text-white">
                        {highestBidTeam.name}
                      </h4>
                      <p className="text-xs text-slate-400">মালিক: {highestBidTeam.ownerName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-base text-slate-400 italic">
                    এখনও কোনো ডাক ওঠেনি
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-4 border-t border-emerald-950 grid grid-cols-2 md:grid-cols-4 gap-3">
        {teams.map((t) => (
          <div
            key={t.id}
            className={`p-3 rounded-2xl border transition-all ${
              highestBidTeam?.id === t.id
                ? 'bg-emerald-950/80 border-emerald-400 shadow-md'
                : 'bg-black/40 border-emerald-950/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <img
                src={getSafeTeamLogo(t.logoUrl)}
                alt={t.name}
                className="w-7 h-7 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                }}
              />
              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-bold text-white truncate">{t.name}</h5>
                <p className="text-[11px] font-mono text-emerald-400">
                  বাজেট: {t.initialBudget.toLocaleString()} pt
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { Player, Team } from '../types';
import { Star, Phone, Edit2, Trash2, PlayCircle, Eye, Download } from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO, downloadPlayerPhoto } from '../utils/media';

interface PlayerCardProps {
  player: Player;
  teams: Team[];
  isAdmin: boolean;
  onViewProfile: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (playerId: string) => void;
  onAuctionSelect: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  teams,
  isAdmin,
  onViewProfile,
  onEdit,
  onDelete,
  onAuctionSelect,
}) => {
  const assignedTeam = player.teamId ? teams.find((t) => t.id === player.teamId) : null;

  const positionColor = {
    GK: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    MID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    ST: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  }[player.position];

  const statusBadge = {
    available: { label: 'Available', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    live: { label: 'Live Bid', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' },
    sold: { label: 'SOLD', class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    unsold: { label: 'Unsold', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  }[player.status];

  return (
    <div className="group relative bg-[#07170f] border border-emerald-950 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/50 flex flex-col">
      {/* Top Image Banner */}
      <div className="relative h-56 overflow-hidden bg-slate-900">
        <img
          src={getSafePlayerPhoto(player.photoUrl)}
          alt={player.name}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07170f] via-transparent to-black/60" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold bg-black/75 backdrop-blur-sm text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
              {player.id}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${positionColor} backdrop-blur-sm`}>
              {player.position}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPlayerPhoto(player.photoUrl, player.name, player.id);
                }}
                className="p-1 rounded-md bg-black/80 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/30 cursor-pointer transition-colors shadow-sm"
                title="প্লেয়ারের ছবি ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-center gap-1 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded-md border border-amber-500/30 text-amber-300">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-sport font-bold text-xs">{player.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Jersey Number */}
        <div className="absolute bottom-2 right-3 font-sport text-4xl font-extrabold text-white/30 drop-shadow-md select-none">
          #{player.jerseyNumber}
        </div>

        {/* Status Pill */}
        <div className="absolute bottom-2 left-3 flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-sm ${statusBadge.class}`}>
            {statusBadge.label}
          </span>
          {player.approvalStatus === 'PENDING' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-yellow-500/30 text-yellow-300 border-yellow-500/50 backdrop-blur-sm animate-pulse">
              অপেক্ষমাণ
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="font-bold text-base text-white hover:text-emerald-300 transition-colors line-clamp-1">
              {player.name}
            </h3>
            {player.category && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                {player.category}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-1 line-clamp-1 flex items-center gap-1.5">
            <span>বয়স: {player.age} বছর</span>
            <span>•</span>
            <span className="text-slate-300">{player.experience}</span>
          </p>

          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <Phone className="w-3 h-3 text-emerald-400" />
            <span>{player.mobile}</span>
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">বেস প্রাইজ:</span>
            <span className="font-mono font-bold text-white">
              {player.basePrice} <span className="text-[10px] text-emerald-400">পয়েন্ট</span>
            </span>
          </div>
          {player.status === 'sold' && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-950/60">
              <span className="text-slate-400 truncate max-w-[100px]">
                {assignedTeam?.name || 'দল'}
              </span>
              <span className="font-mono font-bold text-amber-300">
                {player.soldPrice} <span className="text-[10px]">পয়েন্ট</span>
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-1 flex items-center gap-1.5">
          <button
            onClick={() => onViewProfile(player)}
            className="flex-1 py-2 px-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="বিস্তারিত দেখুন"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>প্রোফাইল</span>
          </button>

          {player.status === 'available' && (
            <button
              onClick={() => onAuctionSelect(player)}
              className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="নিলাম শুরু করুন"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>নিলাম</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => downloadPlayerPhoto(player.photoUrl, player.name, player.id)}
                className="p-2 rounded-xl bg-black/60 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 border border-emerald-950 transition-colors cursor-pointer"
                title="প্লেয়ারের ছবি ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit(player)}
                className="p-2 rounded-xl bg-black/60 hover:bg-slate-800 text-slate-300 border border-emerald-950 transition-colors cursor-pointer"
                title="এডিট"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(player.id)}
                className="p-2 rounded-xl bg-black/60 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-emerald-950 transition-colors cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

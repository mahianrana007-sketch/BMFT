import React, { useState } from 'react';
import { Match, Team, Player } from '../types';
import { 
  Calendar, Clock, MapPin, Trophy, Star, Plus, 
  Search, Filter, Edit3, Trash2, CheckCircle2, 
  AlertCircle, ChevronRight, PlayCircle, Shield
} from 'lucide-react';

interface MatchesViewProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  isAdmin: boolean;
  onAddMatchClick: () => void;
  onEditMatchClick: (match: Match) => void;
  onDeleteMatchClick: (matchId: string) => void;
  onOpenAdminLogin: () => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  teams,
  players,
  isAdmin,
  onAddMatchClick,
  onEditMatchClick,
  onDeleteMatchClick,
  onOpenAdminLogin,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'live' | 'finished'>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMatches = matches.filter((m) => {
    if (filterStatus === 'upcoming' && m.status !== 'upcoming') return false;
    if (filterStatus === 'live' && m.status !== 'live') return false;
    if (filterStatus === 'finished' && m.status !== 'finished') return false;

    if (selectedTeamId !== 'all') {
      if (m.homeTeamId !== selectedTeamId && m.awayTeamId !== selectedTeamId) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.homeTeamName} ${m.awayTeamName} ${m.venue} ${m.round || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#04160c] border-2 border-emerald-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-sport">
                ম্যাচ ও ফিক্সচার (Matches & Fixtures)
              </h2>
              <p className="text-xs text-slate-300 font-bn">
                টুর্নামেন্টের সকল আসন্ন ফিক্সচার, লাইভ ম্যাচ ও অফিসিয়াল ম্যাচের ফলাফল।
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <button
              onClick={onAddMatchClick}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ম্যাচ যুক্ত করুন</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="py-2 px-3.5 rounded-xl bg-black/60 hover:bg-black/90 border border-amber-500/40 text-amber-300 text-xs font-bold font-sport transition-all cursor-pointer"
            >
              এডমিন লগইন (স্কোর এডিট)
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="p-4 rounded-2xl bg-[#031109] border border-emerald-950 flex flex-wrap items-center justify-between gap-3">
        {/* Status Tab Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white bg-black/40'
            }`}
          >
            সকল ({matches.length})
          </button>
          <button
            onClick={() => setFilterStatus('upcoming')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'upcoming'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white bg-black/40'
            }`}
          >
            আসন্ন ({matches.filter((m) => m.status === 'upcoming').length})
          </button>
          <button
            onClick={() => setFilterStatus('live')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'live'
                ? 'bg-emerald-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white bg-black/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>লাইভ ({matches.filter((m) => m.status === 'live').length})</span>
          </button>
          <button
            onClick={() => setFilterStatus('finished')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'finished'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white bg-black/40'
            }`}
          >
            সমাপ্ত ({matches.filter((m) => m.status === 'finished').length})
          </button>
        </div>

        {/* Team Dropdown & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {teams.length > 0 && (
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-black border border-emerald-950 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">সকল দল</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ম্যাচ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-1.5 pl-8 pr-3 rounded-xl bg-black border border-emerald-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Matches Grid List */}
      {filteredMatches.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#04120a] border border-dashed border-emerald-950 p-6 space-y-3">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">কোনো ম্যাচ পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            নির্বাচিত ফিল্টারে কোনো ম্যাচ তালিকাভুক্ত নেই। নতুন ম্যাচ যোগ করতে এডমিন প্যানেলে লগইন করুন।
          </p>
          {isAdmin && (
            <button
              onClick={onAddMatchClick}
              className="py-2 px-4 rounded-xl bg-emerald-500 text-black text-xs font-bold cursor-pointer"
            >
              + এখনই ম্যাচ তৈরি করুন
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMatches.map((match) => {
            const isFinished = match.status === 'finished';
            const isLive = match.status === 'live';
            const isUpcoming = match.status === 'upcoming';
            const isPostponed = match.status === 'postponed';

            return (
              <div
                key={match.id}
                className="p-5 rounded-3xl bg-[#04160d] border-2 border-emerald-500/30 hover:border-emerald-500/60 shadow-xl space-y-4 transition-all relative overflow-hidden"
              >
                {/* Status & Round Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-emerald-950/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300 font-sport">
                      {match.round || 'ম্যাচডে'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{match.date} {match.time ? `• ${match.time}` : ''}</span>
                    </span>
                  </div>

                  <div>
                    {isLive && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>LIVE</span>
                      </span>
                    )}
                    {isFinished && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        FT (সমাপ্ত)
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        আসন্ন (Upcoming)
                      </span>
                    )}
                    {isPostponed && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
                        স্থগিত
                      </span>
                    )}
                  </div>
                </div>

                {/* Scorecard Main Section */}
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/60 border border-emerald-950">
                  {/* Home Team */}
                  <div className="flex-1 text-center space-y-1.5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-[#031008] border border-emerald-500/30 p-1.5 flex items-center justify-center">
                      {match.homeTeamLogo ? (
                        <img src={match.homeTeamLogo} alt={match.homeTeamName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl">🛡️</span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">{match.homeTeamName}</h4>
                  </div>

                  {/* Score or VS Badge */}
                  <div className="shrink-0 text-center px-4 py-2 rounded-2xl bg-[#03150b] border border-emerald-500/40">
                    {isFinished || isLive ? (
                      <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider">
                        <span className={Number(match.homeScore) > Number(match.awayScore) ? 'text-emerald-400' : 'text-white'}>
                          {match.homeScore ?? 0}
                        </span>
                        <span className="text-slate-500 mx-2">-</span>
                        <span className={Number(match.awayScore) > Number(match.homeScore) ? 'text-emerald-400' : 'text-white'}>
                          {match.awayScore ?? 0}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-base font-black text-emerald-400 font-sport">VS</span>
                        <span className="text-[10px] font-mono block text-slate-400">{match.time || 'সময় TBA'}</span>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 text-center space-y-1.5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-[#031008] border border-emerald-500/30 p-1.5 flex items-center justify-center">
                      {match.awayTeamLogo ? (
                        <img src={match.awayTeamLogo} alt={match.awayTeamName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl">⚔️</span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">{match.awayTeamName}</h4>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{match.venue || 'MR স্টেডিয়াম'}</span>
                  </div>
                  {match.notes && (
                    <span className="text-[11px] text-slate-500 truncate max-w-[150px] italic">
                      {match.notes}
                    </span>
                  )}
                </div>

                {/* Goalscorers & Assists Breakdown (if finished or live) */}
                {(isFinished || isLive) && match.goals && match.goals.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950 space-y-1 text-xs">
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="text-xs">⚽</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                        {match.goals.map((g, idx) => (
                          <span key={idx}>
                            <strong className="text-white">{g.playerName}</strong> {g.minute ? `(${g.minute}')` : ''}
                            {g.assistPlayerName && (
                              <span className="text-slate-400 ml-1 text-[10px]">
                                [অ্যাসিস্ট: {g.assistPlayerName}]
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {match.manOfTheMatchName && (
                      <div className="flex items-center gap-1.5 text-amber-300 pt-1 border-t border-emerald-950/60 font-sport text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>ম্যাচসেরা (MOTM): <strong>{match.manOfTheMatchName}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Quick Action Controls */}
                {isAdmin && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-950/80">
                    <button
                      onClick={() => onEditMatchClick(match)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>স্কোর / রেজাল্ট এডিট</span>
                    </button>

                    <button
                      onClick={() => onDeleteMatchClick(match.id)}
                      className="py-1.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

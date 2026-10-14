import React from 'react';
import { Match, Team, Player, LeagueStanding, PlayerLeaderboardItem, AppUser } from '../types';
import { 
  Trophy, Calendar, Users, Flame, ArrowRight, Star,
  Shield, Clock, MapPin, ChevronRight, Award, UserPlus,
  PlayCircle, Activity, CheckCircle2, Sparkles
} from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO } from '../utils/media';

interface ClubHomepageProps {
  teams: Team[];
  players: Player[];
  matches: Match[];
  standings: LeagueStanding[];
  topScorers: PlayerLeaderboardItem[];
  topAssists: PlayerLeaderboardItem[];
  currentUser: AppUser | null;
  onNavigateTab: (tab: string) => void;
  onOpenAdminLogin: () => void;
}

export const ClubHomepage: React.FC<ClubHomepageProps> = ({
  teams,
  players,
  matches,
  standings,
  topScorers,
  topAssists,
  currentUser,
  onNavigateTab,
  onOpenAdminLogin,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Find next upcoming match
  const upcomingMatches = matches
    .filter((m) => m.status === 'upcoming' || m.status === 'live')
    .sort((a, b) => new Date(`${a.date} ${a.time || ''}`).getTime() - new Date(`${b.date} ${b.time || ''}`).getTime());
  const nextMatch = upcomingMatches[0] || null;

  // Find latest finished match
  const finishedMatches = matches
    .filter((m) => m.status === 'finished')
    .sort((a, b) => new Date(`${b.date} ${b.time || ''}`).getTime() - new Date(`${a.date} ${a.time || ''}`).getTime());
  const latestResult = finishedMatches[0] || null;

  const top3Scorers = topScorers.slice(0, 3);
  const top4Standings = standings.slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04160d] via-[#020b06] to-[#010804] border-2 border-emerald-500/30 shadow-2xl p-6 sm:p-8 md:p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>অফিসিয়াল ফুটবল ক্লাব ও প্রিমিয়ার লিগ পোর্টাল</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white font-sport tracking-tight">
              MR FOOTBALL <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200">PREMIER LEAGUE</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-bn max-w-2xl leading-relaxed">
              পেশাদার ফুটবল লিগ ও ক্লাবের অফিসিয়াল প্ল্যাটফর্ম। লাইভ ম্যাচ রেজাল্ট, আসন্ন ফিক্সচার, অটোমেটিক পয়েন্ট টেবিল, শীর্ষ গোলদাতা ও লাইভ প্লেয়ার অকশন সিস্টেম।
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-950/80 backdrop-blur-sm">
              <span className="text-[11px] text-slate-400 block font-bn">মোট ফুটবল টিম</span>
              <span className="text-2xl font-black text-white font-mono">{teams.length} টি</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-950/80 backdrop-blur-sm">
              <span className="text-[11px] text-slate-400 block font-bn">নিবন্ধিত খেলোয়াড়</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{players.length} জন</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-950/80 backdrop-blur-sm">
              <span className="text-[11px] text-slate-400 block font-bn">সম্পন্ন ম্যাচ</span>
              <span className="text-2xl font-black text-white font-mono">{finishedMatches.length} টি</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-950/80 backdrop-blur-sm">
              <span className="text-[11px] text-slate-400 block font-bn">আসন্ন ফিক্সচার</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{upcomingMatches.length} টি</span>
            </div>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('matches')}
              className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-bold font-sport flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>ফিক্সচার ও রেজাল্ট</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('table')}
              className="py-3 px-5 rounded-2xl bg-[#081e13] hover:bg-[#0c2c1c] border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold font-sport flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>পয়েন্ট টেবিল</span>
            </button>

            <button
              onClick={() => onNavigateTab('player-register')}
              className="py-3 px-5 rounded-2xl bg-black/60 hover:bg-black/80 border border-emerald-950 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>প্লেয়ার ফ্রি রেজিস্ট্রেশন</span>
            </button>

            {isAdmin ? (
              <button
                onClick={() => onNavigateTab('admin-panel')}
                className="py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-bold font-sport flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>ক্লাব এডমিন প্যানেল</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="py-3 px-4 rounded-2xl bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              >
                এডমিন লগইন (PIN: 5890)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid: Next Match Spotlight & Latest Result Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Match Spotlight Card */}
        <div className="p-6 rounded-3xl bg-[#05180f] border-2 border-emerald-500/40 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold text-white font-sport flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>আসন্ন ম্যাচের হাইলাইট (Next Match)</span>
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {nextMatch ? nextMatch.round || 'ম্যাচডে' : 'ফিক্সচার'}
            </span>
          </div>

          {nextMatch ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-black/50 border border-emerald-950">
                {/* Home Team */}
                <div className="flex-1 text-center space-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-[#04120a] border-2 border-emerald-500/30 p-2 flex items-center justify-center shadow-md">
                    {nextMatch.homeTeamLogo ? (
                      <img src={nextMatch.homeTeamLogo} alt={nextMatch.homeTeamName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">🛡️</span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">{nextMatch.homeTeamName}</h4>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">হোম দল</span>
                </div>

                {/* VS Indicator */}
                <div className="shrink-0 text-center space-y-1">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-black font-sport">
                    VS
                  </span>
                  <div className="text-[11px] font-mono font-bold text-emerald-400 pt-1">
                    {nextMatch.time || 'সময় TBA'}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex-1 text-center space-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-[#04120a] border-2 border-emerald-500/30 p-2 flex items-center justify-center shadow-md">
                    {nextMatch.awayTeamLogo ? (
                      <img src={nextMatch.awayTeamLogo} alt={nextMatch.awayTeamName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">⚔️</span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">{nextMatch.awayTeamName}</h4>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">অ্যাওয়ে দল</span>
                </div>
              </div>

              {/* Match Details & Venue */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950 flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{nextMatch.date} • {nextMatch.time}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-950 flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{nextMatch.venue || 'MR ফুটবল স্টেডিয়াম'}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('matches')}
                className="w-full py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-sport flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>সকল ফিক্সচার ও সময়সূচী দেখুন</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">এই মুহূর্তে কোনো আসন্ন ফিক্সচার নেই।</p>
              {isAdmin && (
                <button
                  onClick={() => onNavigateTab('admin-panel')}
                  className="py-1.5 px-3 rounded-lg bg-emerald-500 text-black text-xs font-bold cursor-pointer"
                >
                  ফিক্সচার যুক্ত করুন
                </button>
              )}
            </div>
          )}
        </div>

        {/* Latest Result Spotlight Card */}
        <div className="p-6 rounded-3xl bg-[#05180f] border-2 border-emerald-500/40 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold text-white font-sport">
                সর্বশেষ ম্যাচের ফলাফল (Latest Result)
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              সমাপ্ত (FT)
            </span>
          </div>

          {latestResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-black/50 border border-emerald-950">
                {/* Home Team */}
                <div className="flex-1 text-center space-y-1">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#04120a] border border-emerald-950 p-1.5 flex items-center justify-center">
                    {latestResult.homeTeamLogo ? (
                      <img src={latestResult.homeTeamLogo} alt={latestResult.homeTeamName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl">🛡️</span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">{latestResult.homeTeamName}</h4>
                </div>

                {/* Score Banner */}
                <div className="shrink-0 text-center space-y-1 px-4 py-2 rounded-2xl bg-[#04160c] border border-emerald-500/40">
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wider">
                    <span className={Number(latestResult.homeScore) > Number(latestResult.awayScore) ? 'text-emerald-400' : 'text-white'}>
                      {latestResult.homeScore ?? 0}
                    </span>
                    <span className="text-slate-500 mx-2">-</span>
                    <span className={Number(latestResult.awayScore) > Number(latestResult.homeScore) ? 'text-emerald-400' : 'text-white'}>
                      {latestResult.awayScore ?? 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase font-sport block">পূর্ণ সময়</span>
                </div>

                {/* Away Team */}
                <div className="flex-1 text-center space-y-1">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#04120a] border border-emerald-950 p-1.5 flex items-center justify-center">
                    {latestResult.awayTeamLogo ? (
                      <img src={latestResult.awayTeamLogo} alt={latestResult.awayTeamName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl">⚔️</span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">{latestResult.awayTeamName}</h4>
                </div>
              </div>

              {/* Goalscorers & MOTM summary */}
              <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-emerald-950 text-xs">
                {latestResult.goals && latestResult.goals.length > 0 ? (
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="text-sm">⚽</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                      {latestResult.goals.map((g, idx) => (
                        <span key={idx} className="font-medium">
                          <strong>{g.playerName}</strong> {g.minute ? `(${g.minute}')` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">কোনো গোল স্কোরার রেকর্ড নেই</p>
                )}

                {latestResult.manOfTheMatchName && (
                  <div className="flex items-center gap-1.5 text-amber-300 pt-1 border-t border-emerald-950/80 font-sport text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>ম্যাচসেরা (Man of the Match): <strong>{latestResult.manOfTheMatchName}</strong></span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigateTab('matches')}
                className="w-full py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-sport flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>সকল ম্যাচের পূর্ণাঙ্গ রেজাল্ট দেখুন</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">এখনও কোনো সমাপ্ত ম্যাচ নেই।</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: League Table Preview & Top Scorers Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* League Table Preview (2 Cols on lg) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#05180f] border-2 border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold text-white font-sport">
                পয়েন্ট টেবিল ওভারভিউ (League Table)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('table')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>সম্পূর্ণ টেবিল</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {standings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              দল যুক্ত করা হলে ও ম্যাচ শেষ হলে পয়েন্ট টেবিল স্বয়ংক্রিয়ভাবে তৈরি হবে।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-950 text-slate-400 uppercase text-[10px] bg-black/40">
                    <th className="py-2.5 px-3"># দল</th>
                    <th className="py-2.5 px-2 text-center">P</th>
                    <th className="py-2.5 px-2 text-center">W</th>
                    <th className="py-2.5 px-2 text-center">D</th>
                    <th className="py-2.5 px-2 text-center">L</th>
                    <th className="py-2.5 px-2 text-center">GD</th>
                    <th className="py-2.5 px-3 text-right">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60">
                  {top4Standings.map((team, idx) => (
                    <tr key={team.teamId} className="hover:bg-emerald-950/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            idx === 0 ? 'bg-amber-500 text-black shadow-sm' : 'bg-black text-slate-300'
                          }`}>
                            {idx + 1}
                          </span>
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.teamName} className="w-6 h-6 object-contain shrink-0" />
                          ) : (
                            <span className="text-base">🛡️</span>
                          )}
                          <span className="font-bold text-white text-xs truncate max-w-[140px] sm:max-w-xs">
                            {team.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-300">{team.played}</td>
                      <td className="py-3 px-2 text-center font-mono text-emerald-400 font-bold">{team.won}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-400">{team.drawn}</td>
                      <td className="py-3 px-2 text-center font-mono text-rose-400">{team.lost}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-300 font-bold">
                        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-400">
                        {team.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Goalscorers Mini Leaderboard */}
        <div className="p-6 rounded-3xl bg-[#05180f] border-2 border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-white font-sport">
                শীর্ষ গোলদাতা (Top Scorers)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('stats')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>সকল লিডার</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {top3Scorers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ম্যাচ রেজাল্ট যুক্ত করা হলে শীর্ষ গোলদাতাদের তালিকা এখানে দেখা যাবে।
            </div>
          ) : (
            <div className="space-y-3">
              {top3Scorers.map((scorer, idx) => (
                <div
                  key={scorer.playerId}
                  className="p-3 rounded-2xl bg-black/50 border border-emerald-950 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-black shadow-md' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <img
                      src={getSafePlayerPhoto(scorer.playerPhoto)}
                      alt={scorer.playerName}
                      className="w-10 h-10 rounded-xl object-cover object-top border border-emerald-950 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs truncate">{scorer.playerName}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{scorer.teamName}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-emerald-400 font-mono block">
                      {scorer.goals}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">গোল</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onNavigateTab('stats')}
            className="w-full py-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-emerald-950 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>টপ অ্যাসিস্ট ও পূর্ণ পরিসংখ্যান</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('teams')}
          className="p-5 rounded-2xl bg-[#05180f] border border-emerald-950 hover:border-emerald-500/50 hover:bg-[#072416] transition-all cursor-pointer space-y-2 group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">দল ও স্কোয়াড (Club Squads)</h4>
          <p className="text-xs text-slate-400">সকল দল, ম্যানেজার ও স্কোয়াডের খেলোয়াড় তালিকা দেখুন।</p>
        </div>

        <div
          onClick={() => onNavigateTab('players')}
          className="p-5 rounded-2xl bg-[#05180f] border border-emerald-950 hover:border-emerald-500/50 hover:bg-[#072416] transition-all cursor-pointer space-y-2 group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">খেলোয়াড় প্রোফাইল (Players Pool)</h4>
          <p className="text-xs text-slate-400">পজিশন ভিত্তিক খেলোয়াড় তথ্য, জার্সি নম্বর ও রেটিং।</p>
        </div>

        <div
          onClick={() => onNavigateTab('live')}
          className="p-5 rounded-2xl bg-[#05180f] border border-emerald-950 hover:border-emerald-500/50 hover:bg-[#072416] transition-all cursor-pointer space-y-2 group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 w-fit group-hover:scale-110 transition-transform">
            <Flame className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">লাইভ অকশন ও নিলাম (Live Auction)</h4>
          <p className="text-xs text-slate-400">রিয়েল-টাইম প্লেয়ার বিডিং, টাইমার ও প্রজেক্টর স্ক্রিন।</p>
        </div>

        <div
          onClick={() => onNavigateTab('player-register')}
          className="p-5 rounded-2xl bg-[#05180f] border border-emerald-950 hover:border-emerald-500/50 hover:bg-[#072416] transition-all cursor-pointer space-y-2 group"
        >
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 w-fit group-hover:scale-110 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">অনলাইন রেজিস্ট্রেশন (Registration)</h4>
          <p className="text-xs text-slate-400">নতুন খেলোয়াড়দের স্বয়ংক্রিয় অনলাইন নিবন্ধন ও প্রোফাইল এডিট।</p>
        </div>
      </div>
    </div>
  );
};

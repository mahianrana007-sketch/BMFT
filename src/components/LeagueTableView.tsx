import React from 'react';
import { LeagueStanding, Team } from '../types';
import { Trophy, Shield, ArrowUp, ArrowDown, HelpCircle, Award, CheckCircle2 } from 'lucide-react';

interface LeagueTableViewProps {
  standings: LeagueStanding[];
  teams: Team[];
  seasonYear?: string;
  tournamentName?: string;
}

export const LeagueTableView: React.FC<LeagueTableViewProps> = ({
  standings,
  teams,
  seasonYear = '2026',
  tournamentName = 'MR Football Premier League',
}) => {
  const leaderTeam = standings[0] || null;
  const highestScoringTeam = [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0] || null;
  const bestDefenseTeam = [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header Bar */}
      <div className="p-6 rounded-3xl bg-[#04160c] border-2 border-emerald-500/30 shadow-xl space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-sport">
                পয়েন্ট টেবিল ও লিগ স্ট্যান্ডিংস (League Table)
              </h2>
              <p className="text-xs text-slate-300 font-bn">
                {tournamentName} — সিজন {seasonYear}। সমাপ্ত ম্যাচের ফলাফলের ভিত্তিতে স্বয়ংক্রিয়ভাবে গণনা করা।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              অটোমেটিক রিয়েল-টাইম হিসাব
            </span>
          </div>
        </div>
      </div>

      {/* Mini Highlights Cards */}
      {standings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#03140b] border border-amber-500/40 space-y-1">
            <span className="text-[11px] text-amber-400 font-bold block flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>টেবিল টপার (League Leader)</span>
            </span>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-white text-sm truncate">{leaderTeam?.teamName || '—'}</span>
              <span className="text-xl font-black text-amber-400 font-mono">{leaderTeam?.points || 0} pts</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#03140b] border border-emerald-500/40 space-y-1">
            <span className="text-[11px] text-emerald-400 font-bold block flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>সর্বোচ্চ গোলকারী দল</span>
            </span>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-white text-sm truncate">{highestScoringTeam?.teamName || '—'}</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{highestScoringTeam?.goalsFor || 0} গোল</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#03140b] border border-blue-500/40 space-y-1">
            <span className="text-[11px] text-blue-400 font-bold block flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>সেরা রক্ষণভাগ (Best Defense)</span>
            </span>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-white text-sm truncate">{bestDefenseTeam?.teamName || '—'}</span>
              <span className="text-xl font-black text-blue-400 font-mono">{bestDefenseTeam?.goalsAgainst || 0} হজম</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Standings Table */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#04160d] border-2 border-emerald-500/30 shadow-2xl space-y-4">
        {standings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">এখনও কোনো দল বা ম্যাচ রেজিস্টার করা হয়নি</p>
            <p>এডমিন প্যানেলে দল ও ম্যাচের ফলাফল যোগ করলে লিগ টেবিল তৈরি হবে।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-950 text-slate-400 uppercase text-[10px] bg-black/50">
                  <th className="py-3 px-3"># অবস্থান</th>
                  <th className="py-3 px-3">ক্লাব / ফুটবল টিম</th>
                  <th className="py-3 px-2 text-center" title="ম্যাচ খেলেছে">P (খেলা)</th>
                  <th className="py-3 px-2 text-center text-emerald-400" title="জয়">W (জয়)</th>
                  <th className="py-3 px-2 text-center" title="ড্র">D (ড্র)</th>
                  <th className="py-3 px-2 text-center text-rose-400" title="হার">L (হার)</th>
                  <th className="py-3 px-2 text-center" title="পক্ষে গোল">GF</th>
                  <th className="py-3 px-2 text-center" title="বিপক্ষে গোল">GA</th>
                  <th className="py-3 px-2 text-center" title="গোল ব্যবধান">GD</th>
                  <th className="py-3 px-3 text-center font-bold text-emerald-300" title="পয়েন্ট">PTS</th>
                  <th className="py-3 px-4 text-center">সাম্প্রতিক ফর্ম (Form)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60 font-medium">
                {standings.map((team, idx) => {
                  const isTop = idx === 0;
                  const isRunnerUp = idx === 1;

                  return (
                    <tr
                      key={team.teamId}
                      className={`hover:bg-emerald-950/30 transition-colors ${
                        isTop ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                              isTop
                                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                                : isRunnerUp
                                ? 'bg-slate-300 text-black'
                                : 'bg-black/60 text-slate-300 border border-emerald-950'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          {isTop && (
                            <span className="text-[10px] text-amber-400 font-bold uppercase font-sport hidden sm:inline">
                              শীর্ষ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Team Name & Logo */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl bg-black border p-1 flex items-center justify-center shrink-0 shadow-sm"
                            style={{ borderColor: team.color || '#10b981' }}
                          >
                            {team.logoUrl ? (
                              <img src={team.logoUrl} alt={team.teamName} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-sm">🛡️</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs sm:text-sm block">
                              {team.teamName}
                            </span>
                            {team.color && (
                              <span
                                className="inline-block w-2.5 h-1 rounded-full mt-0.5"
                                style={{ backgroundColor: team.color }}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Stats Columns */}
                      <td className="py-3.5 px-2 text-center font-mono text-slate-300">{team.played}</td>
                      <td className="py-3.5 px-2 text-center font-mono font-bold text-emerald-400">{team.won}</td>
                      <td className="py-3.5 px-2 text-center font-mono text-slate-400">{team.drawn}</td>
                      <td className="py-3.5 px-2 text-center font-mono text-rose-400">{team.lost}</td>
                      <td className="py-3.5 px-2 text-center font-mono text-slate-300">{team.goalsFor}</td>
                      <td className="py-3.5 px-2 text-center font-mono text-slate-400">{team.goalsAgainst}</td>
                      <td className="py-3.5 px-2 text-center font-mono font-bold">
                        <span className={team.goalDifference > 0 ? 'text-emerald-400' : team.goalDifference < 0 ? 'text-rose-400' : 'text-slate-400'}>
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-3 text-center font-mono font-black text-sm sm:text-base text-emerald-400">
                        {team.points}
                      </td>

                      {/* Recent Form Badge Sequence */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {team.recentForm && team.recentForm.length > 0 ? (
                            team.recentForm.map((f, fIdx) => (
                              <span
                                key={fIdx}
                                className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                                  f === 'W'
                                    ? 'bg-emerald-500 text-black'
                                    : f === 'D'
                                    ? 'bg-amber-500 text-black'
                                    : 'bg-rose-500 text-white'
                                }`}
                                title={f === 'W' ? 'জয়' : f === 'D' ? 'ড্র' : 'হার'}
                              >
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend / Rules Footer */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-white flex items-center gap-1 font-sport">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>পয়েন্ট নিয়মাবলী:</span>
            </span>
            <span>প্রতিটি জয় (Win) = <strong>৩ পয়েন্ট</strong></span>
            <span>ড্র (Draw) = <strong>১ পয়েন্ট</strong></span>
            <span>হার (Loss) = <strong>০ পয়েন্ট</strong></span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            টাই-ব্রেকার: ১. মোট পয়েন্ট &gt; ২. গোল ব্যবধান (GD) &gt; ৩. পক্ষে গোল (GF)
          </div>
        </div>
      </div>
    </div>
  );
};

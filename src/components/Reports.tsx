import React, { useState } from 'react';
import { Player, Team, AuctionSettings, AuctionHistoryItem } from '../types';
import { Download, Printer, CheckCircle, XCircle } from 'lucide-react';
import { getSafeTeamLogo, DEFAULT_TEAM_LOGO } from '../utils/media';

interface ReportsProps {
  players: Player[];
  teams: Team[];
  settings: AuctionSettings;
  history: AuctionHistoryItem[];
  teamPurchases: Record<string, { totalSpent: number; count: number }>;
}

export const Reports: React.FC<ReportsProps> = ({
  players,
  teams,
  settings,
  history,
  teamPurchases,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'squads' | 'financial' | 'soldUnsold' | 'positions'>('squads');

  const soldPlayers = players.filter((p) => p.status === 'sold');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');

  const handlePrint = () => {
    window.print();
  };

  const downloadCsv = (filename: string, csvContent: string) => {
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllPlayersCsv = () => {
    const headers = ['Player ID', 'Name', 'Position', 'Jersey Number', 'Age', 'Mobile', 'Rating', 'Base Price', 'Status', 'Team', 'Sold Price'];
    const rows = players.map((p) => {
      const team = teams.find((t) => t.id === p.teamId);
      return [
        `"${p.id}"`,
        `"${p.name}"`,
        `"${p.position}"`,
        p.jerseyNumber,
        p.age,
        `"${p.mobile}"`,
        p.rating,
        p.basePrice,
        `"${p.status}"`,
        `"${team?.name || 'দলবিহীন'}"`,
        p.soldPrice || 0,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(`MR_Football_All_Players_${settings.seasonYear}.csv`, csvContent);
  };

  const exportTeamSquadsCsv = () => {
    const headers = ['Team Name', 'Owner', 'Initial Budget', 'Total Spent', 'Remaining Budget', 'Squad Count', 'Players (Name & Price)'];
    const rows = teams.map((t) => {
      const info = teamPurchases[t.id] || { totalSpent: 0, count: 0 };
      const teamSquad = players.filter((p) => p.teamId === t.id && p.status === 'sold');
      const playerList = teamSquad.map((p) => `${p.name} (${p.position} - ${p.soldPrice} pt)`).join('; ');

      return [
        `"${t.name}"`,
        `"${t.ownerName}"`,
        t.initialBudget,
        info.totalSpent,
        t.initialBudget - info.totalSpent,
        info.count,
        `"${playerList}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(`MR_Football_Team_Squads_${settings.seasonYear}.csv`, csvContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-sport tracking-wide">
            প্রতিবেদন ও ফলাফল (Reports & Final Squads)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            স্কোয়াড তালিকা প্রিন্ট করুন এবং এক্সেল/সিএসভি ফরম্যাটে ডাউনলোড করুন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট শিট</span>
          </button>

          <button
            onClick={exportTeamSquadsCsv}
            className="py-2 px-3.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>স্কোয়াড CSV</span>
          </button>

          <button
            onClick={exportAllPlayersCsv}
            className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>প্লেয়ার লিস্ট CSV</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap border-b border-emerald-950 bg-[#06180f] rounded-2xl p-1 gap-1">
        <button
          onClick={() => setActiveReportTab('squads')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeReportTab === 'squads'
              ? 'bg-emerald-500 text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          দলভিত্তিক স্কোয়াড
        </button>
        <button
          onClick={() => setActiveReportTab('financial')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeReportTab === 'financial'
              ? 'bg-emerald-500 text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          বাজেট ও খরচ
        </button>
        <button
          onClick={() => setActiveReportTab('soldUnsold')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeReportTab === 'soldUnsold'
              ? 'bg-emerald-500 text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          বিক্রিত বনাম অবিক্রিত
        </button>
        <button
          onClick={() => setActiveReportTab('positions')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeReportTab === 'positions'
              ? 'bg-emerald-500 text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          পজিশন ভিত্তিক
        </button>
      </div>

      {activeReportTab === 'squads' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => {
              const teamPlayers = players.filter((p) => p.teamId === team.id && p.status === 'sold');
              const spent = teamPurchases[team.id]?.totalSpent || 0;
              const remaining = team.initialBudget - spent;

              return (
                <div
                  key={team.id}
                  className="p-5 rounded-2xl bg-[#06180f] border border-emerald-950 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-950 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getSafeTeamLogo(team.logoUrl)}
                          alt={team.name}
                          className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                          }}
                        />
                        <div>
                          <h4 className="text-base font-bold text-white font-sport">{team.name}</h4>
                          <span className="text-xs text-slate-400">মালিক: {team.ownerName}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          অবশিষ্ট: {remaining.toLocaleString()} pt
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {teamPlayers.length} / {settings.squadLimit || 7} জন
                        </span>
                      </div>
                    </div>

                    {teamPlayers.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">এখনও কোনো প্লেয়ার কেনা হয়নি</p>
                    ) : (
                      <div className="divide-y divide-emerald-950/60">
                        {teamPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="py-2 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                                #{player.jerseyNumber}
                              </span>
                              <span className="font-semibold text-white">{player.name}</span>
                              <span className="text-[10px] text-slate-400">({player.position})</span>
                            </div>
                            <span className="font-mono font-bold text-amber-300">
                              {player.soldPrice} pt
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-emerald-950 flex justify-between text-xs">
                    <span className="text-slate-400">মোট খরচ:</span>
                    <span className="font-mono font-bold text-white">{spent.toLocaleString()} pt</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeReportTab === 'financial' && (
        <div className="border border-emerald-950 rounded-2xl overflow-hidden bg-[#06180f]">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">দল</th>
                <th className="py-3 px-3">মালিক</th>
                <th className="py-3 px-3">শুরুর বাজেট</th>
                <th className="py-3 px-3">মোট খরচ</th>
                <th className="py-3 px-3">অবশিষ্ট ব্যালেন্স</th>
                <th className="py-3 px-3">স্কোয়াড সংখ্যা</th>
                <th className="py-3 px-4 text-right">গড় মূল্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60 bg-black/20">
              {teams.map((t) => {
                const info = teamPurchases[t.id] || { totalSpent: 0, count: 0 };
                const remaining = t.initialBudget - info.totalSpent;
                const avg = info.count > 0 ? Math.round(info.totalSpent / info.count) : 0;

                return (
                  <tr key={t.id} className="hover:bg-emerald-950/20">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <img
                        src={getSafeTeamLogo(t.logoUrl)}
                        alt={t.name}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                        }}
                      />
                      <span>{t.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{t.ownerName}</td>
                    <td className="py-3 px-3 font-mono text-white">{t.initialBudget.toLocaleString()} pt</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {info.totalSpent.toLocaleString()} pt
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {remaining.toLocaleString()} pt
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-300">
                      {info.count} / {settings.squadLimit || 7}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">{avg} pt</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeReportTab === 'soldUnsold' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-3">
            <h4 className="text-sm font-bold uppercase text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>বিক্রিত প্লেয়ার ({soldPlayers.length} জন)</span>
            </h4>
            <div className="max-h-96 overflow-y-auto divide-y divide-emerald-950/60">
              {soldPlayers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">এখনও কোনো প্লেয়ার বিক্রি হয়নি</p>
              ) : (
                soldPlayers.map((player) => {
                  const team = teams.find((t) => t.id === player.teamId);
                  return (
                    <div key={player.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{player.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {team?.name || 'দল'} • {player.position}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-300">{player.soldPrice} pt</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-3">
            <h4 className="text-sm font-bold uppercase text-rose-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>অবিক্রিত প্লেয়ার ({unsoldPlayers.length} জন)</span>
            </h4>
            <div className="max-h-96 overflow-y-auto divide-y divide-emerald-950/60">
              {unsoldPlayers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">কোনো অবিক্রিত প্লেয়ার নেই</p>
              ) : (
                unsoldPlayers.map((player) => (
                  <div key={player.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{player.name}</span>
                      <span className="text-[11px] text-slate-400">
                        ID: {player.id} • {player.position} • রেটিং {player.rating}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400">{player.basePrice} pt</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'positions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['GK', 'DEF', 'MID', 'ST'] as const).map((pos) => {
            const posPlayers = players.filter((p) => p.position === pos);
            const posSold = posPlayers.filter((p) => p.status === 'sold');
            const totalPosSpent = posSold.reduce((acc, p) => acc + (p.soldPrice || 0), 0);

            return (
              <div key={pos} className="p-4 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">
                    {pos === 'GK'
                      ? 'গোলকিপার (GK)'
                      : pos === 'DEF'
                      ? 'ডিফেন্ডার (DEF)'
                      : pos === 'MID'
                      ? 'মিডফিল্ডার (MID)'
                      : 'স্ট্রাইকার (ST)'}
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    মোট {posPlayers.length} জন
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>বিক্রিত:</span>
                    <span className="text-white font-bold">{posSold.length} জন</span>
                  </div>
                  <div className="flex justify-between">
                    <span>মোট ব্যয়:</span>
                    <span className="text-amber-300 font-mono font-bold">{totalPosSpent} pt</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

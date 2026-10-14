import React, { useState, useEffect } from 'react';
import { Player, Match, Team, PlayerMatchPerformance } from '../types';
import { 
  X, Activity, Save, Trash2, Calendar, Star, Shield, 
  Clock, Award, AlertCircle, Sparkles, Check 
} from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO } from '../utils/media';

interface PerformanceEntryModalProps {
  isOpen: boolean;
  editingPerformance?: PlayerMatchPerformance | null;
  defaultPlayerId?: string | null;
  players: Player[];
  matches: Match[];
  teams: Team[];
  onClose: () => void;
  onSave: (performance: PlayerMatchPerformance) => void;
  onDelete?: (performanceId: string) => void;
}

export const PerformanceEntryModal: React.FC<PerformanceEntryModalProps> = ({
  isOpen,
  editingPerformance,
  defaultPlayerId,
  players,
  matches,
  teams,
  onClose,
  onSave,
  onDelete,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [matchTitle, setMatchTitle] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [minutesPlayed, setMinutesPlayed] = useState<number>(90);
  const [matchesPlayed, setMatchesPlayed] = useState<number>(1);
  const [goals, setGoals] = useState<number>(0);
  const [assists, setAssists] = useState<number>(0);
  const [keyPasses, setKeyPasses] = useState<number>(0);
  const [shotsOnTarget, setShotsOnTarget] = useState<number>(0);
  const [tackles, setTackles] = useState<number>(0);
  const [interceptions, setInterceptions] = useState<number>(0);
  const [clearances, setClearances] = useState<number>(0);
  const [blocks, setBlocks] = useState<number>(0);
  const [cleanSheets, setCleanSheets] = useState<number>(0);
  const [saves, setSaves] = useState<number>(0);
  const [goalsConceded, setGoalsConceded] = useState<number>(0);
  const [yellowCards, setYellowCards] = useState<number>(0);
  const [redCards, setRedCards] = useState<number>(0);
  const [rating, setRating] = useState<number>(7.5);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Initialize or reset form fields
  useEffect(() => {
    if (!isOpen) {
      setConfirmDelete(false);
      setError('');
      return;
    }

    if (editingPerformance) {
      setSelectedPlayerId(editingPerformance.playerId);
      setSelectedMatchId(editingPerformance.matchId || '');
      setMatchTitle(editingPerformance.matchTitle || '');
      setMatchDate(editingPerformance.matchDate || new Date().toISOString().split('T')[0]);
      setMinutesPlayed(editingPerformance.minutesPlayed ?? 90);
      setMatchesPlayed(editingPerformance.matchesPlayed ?? 1);
      setGoals(editingPerformance.goals ?? 0);
      setAssists(editingPerformance.assists ?? 0);
      setKeyPasses(editingPerformance.keyPasses ?? 0);
      setShotsOnTarget(editingPerformance.shotsOnTarget ?? 0);
      setTackles(editingPerformance.tackles ?? 0);
      setInterceptions(editingPerformance.interceptions ?? 0);
      setClearances(editingPerformance.clearances ?? 0);
      setBlocks(editingPerformance.blocks ?? 0);
      setCleanSheets(editingPerformance.cleanSheets ?? 0);
      setSaves(editingPerformance.saves ?? 0);
      setGoalsConceded(editingPerformance.goalsConceded ?? 0);
      setYellowCards(editingPerformance.yellowCards ?? 0);
      setRedCards(editingPerformance.redCards ?? 0);
      setRating(editingPerformance.rating ?? 7.5);
      setNotes(editingPerformance.notes || '');
    } else {
      const initialPlayerId = defaultPlayerId || (players[0]?.id || '');
      setSelectedPlayerId(initialPlayerId);
      setSelectedMatchId('');
      setMatchTitle(matches[0] ? `${matches[0].homeTeamName} বনাম ${matches[0].awayTeamName}` : 'ম্যাচ ১');
      setMatchDate(matches[0]?.date || new Date().toISOString().split('T')[0]);
      setMinutesPlayed(90);
      setMatchesPlayed(1);
      setGoals(0);
      setAssists(0);
      setKeyPasses(0);
      setShotsOnTarget(0);
      setTackles(0);
      setInterceptions(0);
      setClearances(0);
      setBlocks(0);
      setCleanSheets(0);
      setSaves(0);
      setGoalsConceded(0);
      setYellowCards(0);
      setRedCards(0);
      setRating(7.5);
      setNotes('');
    }
  }, [isOpen, editingPerformance, defaultPlayerId, players, matches]);

  if (!isOpen) return null;

  const currentPlayer = players.find((p) => p.id === selectedPlayerId);
  const currentTeam = currentPlayer?.teamId ? teams.find((t) => t.id === currentPlayer.teamId) : null;

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
    if (!matchId) return;
    const m = matches.find((item) => item.id === matchId);
    if (m) {
      setMatchTitle(`${m.homeTeamName} বনাম ${m.awayTeamName}${m.round ? ` (${m.round})` : ''}`);
      if (m.date) setMatchDate(m.date);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setError('অনুগ্রহ করে একজন খেলোয়াড় নির্বাচন করুন');
      return;
    }
    if (!matchTitle.trim()) {
      setError('ম্যাচের বিবরণ বা প্রতিপক্ষের নাম লিখুন');
      return;
    }

    const perfId = editingPerformance?.id || `PERF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const performanceRecord: PlayerMatchPerformance = {
      id: perfId,
      playerId: selectedPlayerId,
      playerName: currentPlayer?.name || 'খেলোয়াড়',
      playerPhoto: currentPlayer?.photoUrl,
      teamId: currentPlayer?.teamId || null,
      teamName: currentTeam?.name || 'দল নির্ধারিত হয়নি',
      matchId: selectedMatchId || undefined,
      matchTitle: matchTitle.trim(),
      matchDate: matchDate || new Date().toISOString().split('T')[0],
      minutesPlayed: Math.max(0, Number(minutesPlayed) || 0),
      matchesPlayed: Math.max(0, Number(matchesPlayed) || 1),
      goals: Math.max(0, Number(goals) || 0),
      assists: Math.max(0, Number(assists) || 0),
      keyPasses: Math.max(0, Number(keyPasses) || 0),
      shotsOnTarget: Math.max(0, Number(shotsOnTarget) || 0),
      tackles: Math.max(0, Number(tackles) || 0),
      interceptions: Math.max(0, Number(interceptions) || 0),
      clearances: Math.max(0, Number(clearances) || 0),
      blocks: Math.max(0, Number(blocks) || 0),
      cleanSheets: cleanSheets ? 1 : 0,
      saves: Math.max(0, Number(saves) || 0),
      goalsConceded: Math.max(0, Number(goalsConceded) || 0),
      yellowCards: Math.max(0, Number(yellowCards) || 0),
      redCards: Math.max(0, Number(redCards) || 0),
      rating: Math.min(10, Math.max(1, Number(rating) || 7.5)),
      notes: notes.trim(),
      createdAt: editingPerformance?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(performanceRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#07190f] border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto relative max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-emerald-950 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-sport">
                {editingPerformance ? 'ম্যাচ পারফরম্যান্স এন্ট্রি এডিট' : 'নতুন ম্যাচ পারফরম্যান্স এন্ট্রি'}
              </h3>
              <p className="text-xs text-slate-400">
                খেলোয়াড়ের ম্যাচভিত্তিক গোল, অ্যাসিস্ট, ট্যাকল, সেভ ও রেটিং যুক্ত করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Player Selection */}
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-950 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>খেলোয়াড় নির্বাচন (Player) *</span>
              </label>

              {currentPlayer && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                    ID: {currentPlayer.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    #{currentPlayer.jerseyNumber} ({currentPlayer.position})
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {currentPlayer && (
                <img
                  src={getSafePlayerPhoto(currentPlayer.photoUrl)}
                  alt={currentPlayer.name}
                  className="w-16 h-20 rounded-xl object-cover object-top border-2 border-emerald-500/40 shadow-md shrink-0 bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                  }}
                />
              )}

              <div className="flex-1 w-full space-y-2">
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#041209] border border-emerald-500/40 text-white text-sm focus:outline-none focus:border-emerald-400"
                  required
                >
                  <option value="">খেলোয়াড় বেছে নিন...</option>
                  {players.map((p) => {
                    const t = teams.find((team) => team.id === p.teamId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (#{p.jerseyNumber} - {p.position}) {t ? `[${t.name}]` : ''} - ID: {p.id}
                      </option>
                    );
                  })}
                </select>

                {currentTeam && (
                  <p className="text-xs text-emerald-300/80 font-mono">
                    বর্তমান দল: <strong className="text-white">{currentTeam.name}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Match Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-emerald-950">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">
                টুর্নামেন্ট ম্যাচ নির্বাচন (Fixture Match)
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => handleMatchSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#041209] border border-emerald-950 text-white text-sm focus:outline-none focus:border-emerald-400"
              >
                <option value="">কাস্টম ম্যাচ বা নতুন প্রতিপক্ষ...</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeamName} বনাম {m.awayTeamName} ({m.date} {m.round ? `- ${m.round}` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                ম্যাচের বিবরণ / প্রতিপক্ষ *
              </label>
              <input
                type="text"
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                placeholder="যেমন: আবাহনী বনাম ব্রাদার্স"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#041209] border border-emerald-950 text-white text-sm focus:outline-none focus:border-emerald-400 font-sport"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>ম্যাচের তারিখ *</span>
              </label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#041209] border border-emerald-950 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>খেলার মিনিট (Minutes Played)</span>
              </label>
              <input
                type="number"
                min="0"
                max="150"
                value={minutesPlayed}
                onChange={(e) => setMinutesPlayed(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#041209] border border-emerald-950 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>ম্যাচ পারফরম্যান্স রেটিং (১.০ - ১০.০) *</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <span className="w-14 text-center px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm">
                  {rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Attacking Stats */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>আক্রমণ ও পাসিং পরিসংখ্যান (Attack & Passing)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">⚽ গোল (Goals)</span>
                <input
                  type="number"
                  min="0"
                  value={goals}
                  onChange={(e) => setGoals(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-emerald-950 text-emerald-400 font-sport font-black text-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">👟 অ্যাসিস্ট (Assists)</span>
                <input
                  type="number"
                  min="0"
                  value={assists}
                  onChange={(e) => setAssists(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-emerald-950 text-cyan-400 font-sport font-black text-lg focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">🎯 কি পাস (Key Passes)</span>
                <input
                  type="number"
                  min="0"
                  value={keyPasses}
                  onChange={(e) => setKeyPasses(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-emerald-950 text-amber-300 font-sport font-black text-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-950 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">🔥 অন-টার্গেট শট</span>
                <input
                  type="number"
                  min="0"
                  value={shotsOnTarget}
                  onChange={(e) => setShotsOnTarget(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-emerald-950 text-white font-sport font-black text-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Defending & Goalkeeping Stats */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>ডিফেন্স ও গোলকিপিং পরিসংখ্যান (Defense & Goalkeeping)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-blue-950/60 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">🛡️ ট্যাকল (Tackles)</span>
                <input
                  type="number"
                  min="0"
                  value={tackles}
                  onChange={(e) => setTackles(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-blue-950 text-blue-300 font-sport font-black text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-blue-950/60 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">⚡ ইন্টারসেপশন</span>
                <input
                  type="number"
                  min="0"
                  value={interceptions}
                  onChange={(e) => setInterceptions(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-blue-950 text-blue-300 font-sport font-black text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-blue-950/60 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">🦵 ক্লিয়ারেন্স</span>
                <input
                  type="number"
                  min="0"
                  value={clearances}
                  onChange={(e) => setClearances(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-blue-950 text-slate-200 font-sport font-black text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-blue-950/60 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">🧱 ব্লক (Blocks)</span>
                <input
                  type="number"
                  min="0"
                  value={blocks}
                  onChange={(e) => setBlocks(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-blue-950 text-slate-200 font-sport font-black text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Clean Sheet Toggle */}
              <div className="p-3 rounded-xl bg-black/40 border border-blue-950/60 text-center flex flex-col justify-between items-center space-y-2">
                <span className="text-[11px] text-slate-400 block font-bold">✨ ক্লিন শিট (Clean Sheet)</span>
                <button
                  type="button"
                  onClick={() => setCleanSheets(cleanSheets ? 0 : 1)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    cleanSheets
                      ? 'bg-emerald-500 text-black font-black shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cleanSheets ? <Check className="w-4 h-4" /> : null}
                  <span>{cleanSheets ? 'হ্যাঁ (Clean Sheet)' : 'না'}</span>
                </button>
              </div>

              {/* Goalkeeper Saves */}
              <div className="p-3 rounded-xl bg-black/40 border border-blue-950/60 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">🧤 কিপার সেভ (Saves)</span>
                <input
                  type="number"
                  min="0"
                  value={saves}
                  onChange={(e) => setSaves(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-blue-950 text-amber-400 font-sport font-black text-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Goals Conceded */}
              <div className="p-3 rounded-xl bg-black/40 border border-blue-950/60 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">❌ কনসিড গোল</span>
                <input
                  type="number"
                  min="0"
                  value={goalsConceded}
                  onChange={(e) => setGoalsConceded(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-blue-950 text-rose-400 font-sport font-black text-lg focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Matches count (typically 1) */}
              <div className="p-3 rounded-xl bg-black/40 border border-blue-950/60 text-center space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">🏟️ ম্যাচ কাউন্ট</span>
                <input
                  type="number"
                  min="0"
                  max="1"
                  value={matchesPlayed}
                  onChange={(e) => setMatchesPlayed(Number(e.target.value))}
                  className="w-full py-1.5 text-center rounded-lg bg-[#041209] border border-blue-950 text-white font-sport font-black text-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Discipline & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-emerald-950">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                কার্ড ও শৃঙ্খলা (Cards)
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="w-3.5 h-4.5 bg-amber-400 rounded-sm inline-block shadow-sm" />
                    <span>হলুদ কার্ড</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={yellowCards}
                    onChange={(e) => setYellowCards(Number(e.target.value))}
                    className="w-14 py-1 text-center rounded-lg bg-black border border-amber-500/40 text-amber-300 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="flex-1 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <span className="w-3.5 h-4.5 bg-rose-500 rounded-sm inline-block shadow-sm" />
                    <span>লাল কার্ড</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    value={redCards}
                    onChange={(e) => setRedCards(Number(e.target.value))}
                    className="w-14 py-1 text-center rounded-lg bg-black border border-rose-500/40 text-rose-300 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                ম্যাচ নোট বা বিশেষ পর্যবেক্ষণ (Notes)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ম্যান অব দ্য ম্যাচ, দুর্দান্ত সেভ বা গুরুত্বপূর্ণ মুহূর্ত..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#041209] border border-emerald-950 text-white text-xs focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-950">
            {editingPerformance && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400 font-bold">মুছে ফেলবেন নিশ্চিত?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(editingPerformance.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    হ্যাঁ, ডিলিট করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>পারফরম্যান্স রেকর্ড মুছুন</span>
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingPerformance ? 'আপডেট সেভ করুন' : 'পারফরম্যান্স সেভ করুন'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Match, Team, Player, GoalEvent, MatchStatus } from '../types';
import { X, Calendar, Clock, MapPin, Trophy, Star, Plus, Trash2, Shield, AlertCircle } from 'lucide-react';

interface MatchModalProps {
  isOpen: boolean;
  match: Match | null; // null for new match
  teams: Team[];
  players: Player[];
  onClose: () => void;
  onSave: (match: Match) => void;
  onDelete?: (matchId: string) => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  match,
  teams,
  players,
  onClose,
  onSave,
  onDelete,
}) => {
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('04:30 PM');
  const [venue, setVenue] = useState('MR ফুটবল স্টেডিয়াম');
  const [round, setRound] = useState('ম্যাচডে ১');
  const [status, setStatus] = useState<MatchStatus>('upcoming');
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [goals, setGoals] = useState<GoalEvent[]>([]);
  const [manOfTheMatchName, setManOfTheMatchName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Goal adding sub-state
  const [newGoalPlayerName, setNewGoalPlayerName] = useState('');
  const [newGoalTeamId, setNewGoalTeamId] = useState('');
  const [newGoalMinute, setNewGoalMinute] = useState<number | ''>('');
  const [newGoalAssistName, setNewGoalAssistName] = useState('');

  useEffect(() => {
    if (match) {
      setHomeTeamId(match.homeTeamId);
      setAwayTeamId(match.awayTeamId);
      setDate(match.date || new Date().toISOString().split('T')[0]);
      setTime(match.time || '04:30 PM');
      setVenue(match.venue || 'MR ফুটবল স্টেডিয়াম');
      setRound(match.round || 'ম্যাচডে ১');
      setStatus(match.status || 'upcoming');
      setHomeScore(match.homeScore ?? 0);
      setAwayScore(match.awayScore ?? 0);
      setGoals(match.goals || []);
      setManOfTheMatchName(match.manOfTheMatchName || '');
      setNotes(match.notes || '');
    } else {
      // Default new match
      setHomeTeamId(teams[0]?.id || '');
      setAwayTeamId(teams[1]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('04:30 PM');
      setVenue('MR ফুটবল স্টেডিয়াম');
      setRound(`ম্যাচডে ${Math.floor(Math.random() * 5) + 1}`);
      setStatus('upcoming');
      setHomeScore(0);
      setAwayScore(0);
      setGoals([]);
      setManOfTheMatchName('');
      setNotes('');
    }
    setError('');
  }, [match, teams, isOpen]);

  if (!isOpen) return null;

  const homeTeam = teams.find((t) => t.id === homeTeamId);
  const awayTeam = teams.find((t) => t.id === awayTeamId);

  // Filter players by selected teams for picker
  const homePlayers = players.filter((p) => p.teamId === homeTeamId);
  const awayPlayers = players.filter((p) => p.teamId === awayTeamId);
  const bothTeamPlayers = [...homePlayers, ...awayPlayers];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalPlayerName.trim()) {
      setError('গোলদাতার নাম লিখুন বা নির্বাচন করুন');
      return;
    }
    const teamId = newGoalTeamId || homeTeamId;
    const playerObj = players.find((p) => p.name.toLowerCase() === newGoalPlayerName.trim().toLowerCase());
    const assistObj = players.find((p) => p.name.toLowerCase() === newGoalAssistName.trim().toLowerCase());

    const goalEvent: GoalEvent = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teamId,
      playerName: newGoalPlayerName.trim(),
      playerId: playerObj?.id,
      minute: typeof newGoalMinute === 'number' ? newGoalMinute : undefined,
      assistPlayerName: newGoalAssistName.trim() || undefined,
      assistPlayerId: assistObj?.id,
    };

    const updatedGoals = [...goals, goalEvent];
    setGoals(updatedGoals);

    // Auto update scores based on goals
    const homeGoalsCount = updatedGoals.filter((g) => g.teamId === homeTeamId).length;
    const awayGoalsCount = updatedGoals.filter((g) => g.teamId === awayTeamId).length;
    setHomeScore(homeGoalsCount);
    setAwayScore(awayGoalsCount);

    setNewGoalPlayerName('');
    setNewGoalMinute('');
    setNewGoalAssistName('');
    setError('');
  };

  const handleRemoveGoal = (goalId: string) => {
    const updatedGoals = goals.filter((g) => g.id !== goalId);
    setGoals(updatedGoals);
    const homeGoalsCount = updatedGoals.filter((g) => g.teamId === homeTeamId).length;
    const awayGoalsCount = updatedGoals.filter((g) => g.teamId === awayTeamId).length;
    setHomeScore(homeGoalsCount);
    setAwayScore(awayGoalsCount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId) {
      setError('হোম দল ও অ্যাওয়ে দল উভয়ই নির্বাচন করুন');
      return;
    }
    if (homeTeamId === awayTeamId) {
      setError('একই দল একে অপরের বিপক্ষে খেলতে পারে না! ভিন্ন দল নির্বাচন করুন।');
      return;
    }
    if (!date.trim()) {
      setError('ম্যাচের তারিখ প্রদান করুন');
      return;
    }

    const savedMatch: Match = {
      id: match?.id || `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      homeTeamId,
      homeTeamName: homeTeam?.name || 'হোম দল',
      homeTeamLogo: homeTeam?.logoUrl,
      awayTeamId,
      awayTeamName: awayTeam?.name || 'অ্যাওয়ে দল',
      awayTeamLogo: awayTeam?.logoUrl,
      date,
      time,
      venue,
      round,
      status,
      homeScore: status === 'finished' || status === 'live' ? Number(homeScore) : undefined,
      awayScore: status === 'finished' || status === 'live' ? Number(awayScore) : undefined,
      goals,
      manOfTheMatchName: manOfTheMatchName.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(savedMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#07190f] border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white font-sport">
              {match ? 'ম্যাচ ও রেজাল্ট আপডেট (Edit Match)' : 'নতুন ম্যাচ / ফিক্সচার যোগ (New Match)'}
            </h3>
            <p className="text-xs text-slate-300">
              ম্যাচের তারিখ, স্কোর, গোলদাতা ও ম্যাচসেরা আপডেট করুন। Firebase-এ স্থায়ীভাবে সংরক্ষিত হবে।
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Teams Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/50 border border-emerald-950">
            <div>
              <label className="block text-slate-300 font-bold mb-1">হোম টিম (Home Team) *</label>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#04120a] border border-emerald-950 text-white focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">দল নির্বাচন করুন</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">অ্যাওয়ে টিম (Away Team) *</label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#04120a] border border-emerald-950 text-white focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">দল নির্বাচন করুন</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time, Venue, Round */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">তারিখ (Date) *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-black border border-emerald-950 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">সময় (Time)</label>
              <input
                type="text"
                placeholder="04:30 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-black border border-emerald-950 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">ভেন্যু (Venue)</label>
              <input
                type="text"
                placeholder="স্টেডিয়াম নাম"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-black border border-emerald-950 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">রাউন্ড (Round)</label>
              <input
                type="text"
                placeholder="ম্যাচডে ১ / ফাইনাল"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-black border border-emerald-950 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Match Status Selector */}
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-950 space-y-2">
            <label className="block text-slate-300 font-bold">ম্যাচ স্ট্যাটাস (Match Status) *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('upcoming')}
                className={`py-2 px-3 rounded-xl font-bold cursor-pointer transition-all ${
                  status === 'upcoming'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'bg-black text-slate-400 border border-emerald-950'
                }`}
              >
                আসন্ন (Upcoming)
              </button>
              <button
                type="button"
                onClick={() => setStatus('live')}
                className={`py-2 px-3 rounded-xl font-bold cursor-pointer transition-all ${
                  status === 'live'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-black text-slate-400 border border-emerald-950'
                }`}
              >
                লাইভ (Live)
              </button>
              <button
                type="button"
                onClick={() => setStatus('finished')}
                className={`py-2 px-3 rounded-xl font-bold cursor-pointer transition-all ${
                  status === 'finished'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-black text-slate-400 border border-emerald-950'
                }`}
              >
                সমাপ্ত (Finished)
              </button>
              <button
                type="button"
                onClick={() => setStatus('postponed')}
                className={`py-2 px-3 rounded-xl font-bold cursor-pointer transition-all ${
                  status === 'postponed'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-black text-slate-400 border border-emerald-950'
                }`}
              >
                স্থগিত (Postponed)
              </button>
            </div>
          </div>

          {/* Scores (if finished or live) */}
          {(status === 'finished' || status === 'live') && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>ম্যাচ স্কোর (Match Score)</span>
              </h4>

              <div className="flex items-center justify-center gap-6">
                <div className="text-center space-y-1">
                  <span className="font-bold text-slate-300 block text-xs">{homeTeam?.name || 'হোম দল'}</span>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 py-2 text-center rounded-xl bg-black border-2 border-emerald-500/60 text-white text-xl font-mono font-black"
                  />
                </div>

                <span className="text-2xl font-black text-slate-500 font-sport">-</span>

                <div className="text-center space-y-1">
                  <span className="font-bold text-slate-300 block text-xs">{awayTeam?.name || 'অ্যাওয়ে দল'}</span>
                  <input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 py-2 text-center rounded-xl bg-black border-2 border-emerald-500/60 text-white text-xl font-mono font-black"
                  />
                </div>
              </div>

              {/* Goalscorers & Assists Entry */}
              <div className="pt-3 border-t border-emerald-950 space-y-3">
                <h5 className="font-bold text-slate-300 text-xs">গোলস্কোরার ও অ্যাসিস্ট যোগ করুন:</h5>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-1">
                    <select
                      value={newGoalTeamId || homeTeamId}
                      onChange={(e) => setNewGoalTeamId(e.target.value)}
                      className="w-full py-2 px-2.5 rounded-xl bg-black border border-emerald-950 text-white"
                    >
                      <option value={homeTeamId}>{homeTeam?.name || 'হোম দল'}</option>
                      <option value={awayTeamId}>{awayTeam?.name || 'অ্যাওয়ে দল'}</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      list="player-suggestions"
                      placeholder="গোলদাতার নাম *"
                      value={newGoalPlayerName}
                      onChange={(e) => setNewGoalPlayerName(e.target.value)}
                      className="w-full py-2 px-2.5 rounded-xl bg-black border border-emerald-950 text-white"
                    />
                    <datalist id="player-suggestions">
                      {bothTeamPlayers.map((p) => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-1">
                    <input
                      type="number"
                      placeholder="মিনিট (যেমন: 42)"
                      value={newGoalMinute}
                      onChange={(e) => setNewGoalMinute(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full py-2 px-2.5 rounded-xl bg-black border border-emerald-950 text-white"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      list="player-suggestions"
                      placeholder="অ্যাসিস্ট (ঐচ্ছিক)"
                      value={newGoalAssistName}
                      onChange={(e) => setNewGoalAssistName(e.target.value)}
                      className="w-full py-2 px-2.5 rounded-xl bg-black border border-emerald-950 text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>গোল যোগ করুন</span>
                </button>

                {/* Existing Goals List */}
                {goals.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] text-slate-400 block font-bold">যোগকৃত গোলসমূহ:</span>
                    <div className="space-y-1">
                      {goals.map((g) => {
                        const t = teams.find((item) => item.id === g.teamId);
                        return (
                          <div
                            key={g.id}
                            className="p-2 rounded-xl bg-black/60 border border-emerald-950 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span>⚽</span>
                              <strong className="text-white">{g.playerName}</strong>
                              {g.minute && <span className="text-emerald-400 font-mono">({g.minute}')</span>}
                              <span className="text-slate-400 text-[11px]">— {t?.name}</span>
                              {g.assistPlayerName && (
                                <span className="text-slate-400 text-[10px]">[অ্যাসিস্ট: {g.assistPlayerName}]</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGoal(g.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Man of the Match */}
              <div className="pt-2">
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1 text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>ম্যাচসেরা খেলোয়াড় (Man of the Match)</span>
                </label>
                <input
                  type="text"
                  list="player-suggestions"
                  placeholder="ম্যাচসেরা খেলোয়াড়ের নাম"
                  value={manOfTheMatchName}
                  onChange={(e) => setManOfTheMatchName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-black border border-emerald-950 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Match Notes */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">ম্যাচ নোট বা বর্ণনা (Notes)</label>
            <input
              type="text"
              placeholder="যেমন: উদ্বোধনী ম্যাচ / উত্তেজনাপূর্ণ ফাইনাল ম্যাচ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-black border border-emerald-950 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-emerald-950">
            {match && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('আপনি কি নিশ্চিত যে এই ম্যাচটি মুছে ফেলতে চান?')) {
                    onDelete(match.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-950/50 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>ম্যাচ মুছুন</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-black text-slate-300 hover:text-white border border-emerald-950 font-semibold cursor-pointer"
              >
                বাতিল
              </button>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-sport shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                সংরক্ষণ করুন (Save Match)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

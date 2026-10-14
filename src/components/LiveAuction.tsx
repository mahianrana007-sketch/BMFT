import React, { useState, useEffect, useRef } from 'react';
import { Player, Team, AuctionSettings, BidRecord, AppUser, LiveAuctionState, PlayerCategory } from '../types';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Play, Pause, RotateCcw, CheckCircle2, XCircle,
  Maximize2, Star, Trophy, AlertTriangle, Flame, Eye, Shield,
  Crown, Lock, LogIn, Undo2, Shuffle, Check, Users, LockKeyhole
} from 'lucide-react';
import { getSafePlayerPhoto, getSafeTeamLogo, DEFAULT_PLAYER_PHOTO, DEFAULT_TEAM_LOGO } from '../utils/media';
import { isTeamControllableByUser, getOwnerTeam } from '../data/userAccounts';

interface LiveAuctionProps {
  players: Player[];
  teams: Team[];
  settings: AuctionSettings;
  categories: PlayerCategory[];
  liveAuctionState: LiveAuctionState;
  isAdmin: boolean;
  currentUser: AppUser | null;
  onOpenLogin: () => void;
  onSelectRandomPlayer: (includeUnsold?: boolean) => void;
  onPlaceBidAtomic: (team: Team, bidAmount: number, increment: number) => Promise<{ success: boolean; error?: string }>;
  onSold: (player: Player, winningTeam: Team, winningBid: number, bidSequence: BidRecord[]) => void;
  onUnsold: (player: Player) => void;
  onUndoLastBid: () => void;
  onPauseResumeTimer: (running: boolean) => void;
  onResetTimer: () => void;
  onViewProfile: (player: Player) => void;
  onOpenProjector: () => void;
  teamPurchases: Record<string, { totalSpent: number; count: number }>;
}

export const LiveAuction: React.FC<LiveAuctionProps> = ({
  players,
  teams,
  settings,
  categories,
  liveAuctionState,
  isAdmin,
  currentUser,
  onOpenLogin,
  onSelectRandomPlayer,
  onPlaceBidAtomic,
  onSold,
  onUnsold,
  onUndoLastBid,
  onPauseResumeTimer,
  onResetTimer,
  onViewProfile,
  onOpenProjector,
  teamPurchases,
}) => {
  const currentPlayer = players.find((p) => p.id === liveAuctionState.activePlayerId) || null;

  const currentBid = liveAuctionState.currentBid || (currentPlayer ? currentPlayer.basePrice : settings.defaultBasePrice);
  const highestBidTeam = teams.find((t) => t.id === liveAuctionState.highestBidTeamId) || null;
  const bidSequence = liveAuctionState.bidSequence || [];

  // Synchronized countdown timer calculation based on server timestamp
  const calculateRemainingSeconds = () => {
    if (!liveAuctionState.isTimerRunning) {
      return liveAuctionState.timerSeconds || settings.timerSeconds;
    }
    const start = liveAuctionState.timerStartedAt || Date.now();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const totalAllowed = liveAuctionState.timerSeconds || settings.timerSeconds;
    return Math.max(0, totalAllowed - elapsed);
  };

  const [displayTimer, setDisplayTimer] = useState<number>(calculateRemainingSeconds);
  const lastTickSoundRef = useRef<number>(0);

  // Modals & local controls
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);
  const [showUnsoldConfirm, setShowUnsoldConfirm] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  const [selectedBidTeamId, setSelectedBidTeamId] = useState<string>(teams[0]?.id || '');
  const [validationError, setValidationError] = useState<string>('');
  const [isBiddingBusy, setIsBiddingBusy] = useState<boolean>(false);

  const ownerTeam = currentUser ? getOwnerTeam(currentUser, teams) : null;

  // Auto-sync selected team for Owner
  useEffect(() => {
    if (currentUser?.role === 'owner' && ownerTeam) {
      setSelectedBidTeamId(ownerTeam.id);
    } else if (!selectedBidTeamId && teams[0]) {
      setSelectedBidTeamId(teams[0].id);
    }
  }, [currentUser, ownerTeam, teams, selectedBidTeamId]);

  // Synchronized Timer interval calculation
  useEffect(() => {
    if (!liveAuctionState.isTimerRunning) {
      setDisplayTimer(liveAuctionState.timerSeconds || settings.timerSeconds);
      return;
    }

    // Immediate initial sync
    setDisplayTimer(calculateRemainingSeconds());

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setDisplayTimer(remaining);

      // Audio effects on last seconds
      if (remaining <= 5 && remaining > 0 && settings.soundEnabled && remaining !== lastTickSoundRef.current) {
        lastTickSoundRef.current = remaining;
        soundFx.playTick();
      } else if (remaining === 0 && lastTickSoundRef.current !== 0) {
        lastTickSoundRef.current = 0;
        soundFx.playWarning();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [
    liveAuctionState.isTimerRunning,
    liveAuctionState.timerStartedAt,
    liveAuctionState.timerSeconds,
    settings.timerSeconds,
    settings.soundEnabled,
  ]);

  // Dynamic Balance Reservation System
  const getTeamBalanceBreakdown = (team: Team) => {
    const totalBudget = team.initialBudget || 10000;
    const spent = teamPurchases[team.id]?.totalSpent || 0;
    // Current live reservation: only if this team is the current highest active bidder
    const isCurrentlyLeading =
      liveAuctionState.status === 'bidding' &&
      (liveAuctionState.highestBidTeamId === team.id || liveAuctionState.reservedTeamId === team.id) &&
      liveAuctionState.currentBid > 0;
    const reserved = isCurrentlyLeading ? (liveAuctionState.reservedAmount || liveAuctionState.currentBid) : 0;
    const totalDeducted = spent + reserved;
    const available = Math.max(0, totalBudget - totalDeducted);

    return {
      totalBudget,
      spent,
      reserved,
      available,
      isReserved: reserved > 0,
    };
  };

  const getRemainingBudget = (team: Team): number => {
    return getTeamBalanceBreakdown(team).available;
  };

  const getSquadCount = (team: Team): number => {
    return teamPurchases[team.id]?.count || 0;
  };

  // Check if bidding is locked due to timer reaching 0 or status not bidding
  const isTimerExpired = displayTimer <= 0;
  const isBiddingLocked = isTimerExpired || liveAuctionState.status !== 'bidding';

  // Atomic Bidding Handler with STRICT Timer 0 Lock
  const handlePlaceBid = async (team: Team, increment: number) => {
    if (!currentPlayer) return;

    // 1. STRICT TIMER 0 LOCK CHECK
    if (isTimerExpired) {
      setValidationError('টাইমার ০-তে পৌঁছে গেছে! বিড সিস্টেম স্বয়ংক্রিয়ভাবে লক করা হয়েছে। কোনো নতুন ডাক গ্রহণ করা যাবে না।');
      soundFx.playWarning();
      return;
    }

    if (liveAuctionState.status !== 'bidding') {
      setValidationError('নিলাম বর্তমানে বিডিং মোডে নেই!');
      soundFx.playWarning();
      return;
    }

    if (!currentUser) {
      setValidationError('বিড করতে অনুগ্রহ করে এডমিন অথবা ওনার আইডিতে লগইন করুন!');
      return;
    }

    const canBid = isTeamControllableByUser(currentUser, team, teams);
    if (!canBid) {
      setValidationError(`অনুমতি নেই! আপনি শুধুমাত্র আপনার দলের (${ownerTeam?.name || 'নিজ দল'}) পক্ষে বিড করতে পারেন।`);
      return;
    }

    const remainingBudget = getRemainingBudget(team);
    const squadCount = getSquadCount(team);
    const maxSquad = settings.squadLimit || 7;

    if (squadCount >= maxSquad) {
      setValidationError(`${team.name}-এর স্কোয়াড পূর্ণ (${squadCount}/${maxSquad} জন)! নতুন প্লেয়ার কেনা যাবে না।`);
      soundFx.playWarning();
      return;
    }

    let nextBid = currentBid + increment;
    if (bidSequence.length === 0 && highestBidTeam === null && increment === 0) {
      nextBid = currentPlayer.basePrice;
    }

    // Strict Base Price check: Bid can NEVER be lower than player's base price
    if (nextBid < currentPlayer.basePrice) {
      setValidationError(
        `ডাকের পরিমাণ প্লেয়ারের নির্ধারিত বেস প্রাইজ (${currentPlayer.basePrice.toLocaleString()} pt)-এর নিচে গ্রহণ করা যাবে না!`
      );
      soundFx.playWarning();
      return;
    }

    if (nextBid > remainingBudget) {
      setValidationError(
        `পর্যাপ্ত বাজেট নেই! ${team.name}-এর অবশিষ্ট বাজেট ${remainingBudget.toLocaleString()} pt, যা ডাকের (${nextBid.toLocaleString()} pt) চেয়ে কম।`
      );
      soundFx.playWarning();
      return;
    }

    setValidationError('');
    setIsBiddingBusy(true);

    try {
      const res = await onPlaceBidAtomic(team, nextBid, increment);
      if (!res.success) {
        setValidationError(res.error || 'ডাক গ্রহণ করা সম্ভব হয়নি!');
        soundFx.playWarning();
      } else {
        if (settings.soundEnabled) {
          soundFx.playBidChime();
        }
      }
    } finally {
      setIsBiddingBusy(false);
    }
  };

  // Custom Amount Bid
  const handleCustomBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlayer) return;

    if (isTimerExpired) {
      setValidationError('টাইমার ০-তে পৌঁছে গেছে! বিড সিস্টেম সম্পূর্ণ লক।');
      soundFx.playWarning();
      return;
    }

    const amount = Number(customBidAmount);
    if (!amount || isNaN(amount)) return;
    const team = teams.find((t) => t.id === selectedBidTeamId);
    if (!team) return;

    if (amount < currentPlayer.basePrice) {
      setValidationError(
        `ডাকের পরিমাণ প্লেয়ারের নির্ধারিত বেস প্রাইজ (${currentPlayer.basePrice.toLocaleString()} pt)-এর নিচে গ্রহণ করা যাবে না!`
      );
      soundFx.playWarning();
      return;
    }

    if (highestBidTeam !== null && amount <= currentBid) {
      setValidationError(`ডাকের পরিমাণ বর্তমান ডাক (${currentBid.toLocaleString()} pt)-এর চেয়ে বেশি হতে হবে!`);
      soundFx.playWarning();
      return;
    }

    const increment = highestBidTeam === null && amount === currentPlayer.basePrice ? 0 : amount - currentBid;
    await handlePlaceBid(team, increment);
    setCustomBidAmount('');
  };

  // Confirm SOLD
  const confirmSold = () => {
    if (!currentPlayer || !highestBidTeam) return;

    try {
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ffffff'],
      });
    } catch {
      // ignore
    }

    if (settings.soundEnabled) {
      soundFx.playGavel();
    }

    onSold(currentPlayer, highestBidTeam, currentBid, bidSequence);
    setShowSoldConfirm(false);
  };

  // Confirm UNSOLD
  const confirmUnsold = () => {
    if (!currentPlayer) return;
    if (settings.soundEnabled) {
      soundFx.playWarning();
    }
    onUnsold(currentPlayer);
    setShowUnsoldConfirm(false);
  };

  const eligibleAvailableCount = players.filter(
    (p) => (p.approvalStatus || 'APPROVED') === 'APPROVED' && p.status === 'available'
  ).length;

  const unsoldPlayersCount = players.filter(
    (p) => (p.approvalStatus || 'APPROVED') === 'APPROVED' && p.status === 'unsold'
  ).length;

  // Render Empty State if no teams exist
  if (teams.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#06170e] border border-emerald-950 flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Shield className="w-16 h-16 text-emerald-400 mb-2" />
        <h3 className="text-2xl font-bold text-white font-sport">কোনো দল নিবন্ধিত নেই</h3>
        <p className="text-sm text-slate-400 max-w-md">
          নিলাম শুরু করার জন্য &quot;দলসমূহ&quot; ট্যাবে গিয়ে সর্বোচ্চ ৪টি দল যুক্ত করুন।
        </p>
      </div>
    );
  }

  // Render Idle/Waiting Screen if no player is currently live
  if (!currentPlayer) {
    return (
      <div className="p-10 text-center rounded-2xl bg-[#06170e] border-2 border-emerald-950 flex flex-col items-center justify-center min-h-[480px] space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
          <Trophy className="w-10 h-10" />
        </div>
        
        <div className="space-y-2 max-w-lg">
          <h3 className="text-2xl md:text-3xl font-black text-white font-sport tracking-wide">
            লাইভ নিলাম প্রস্তুত (Live Auction Ready)
          </h3>
          <p className="text-sm text-slate-400">
            বর্তমানে কোনো প্লেয়ারের নিলাম চলছে না। এডমিন র্যান্ডম প্লেয়ার নির্বাচন করে পরবর্তী নিলাম শুরু করতে পারবেন।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-black/60 border border-emerald-950 text-emerald-300 font-mono">
              উপলব্ধ প্লেয়ার: <strong className="text-white">{eligibleAvailableCount}</strong> জন
            </span>
            <span className="px-3 py-1 rounded-full bg-black/60 border border-emerald-950 text-slate-300 font-mono">
              অবিক্রিত প্লেয়ার: <strong className="text-amber-400">{unsoldPlayersCount}</strong> জন
            </span>
            <span className="px-3 py-1 rounded-full bg-black/60 border border-emerald-950 text-slate-300 font-mono">
              অংশগ্রহণকারী দল: <strong className="text-white">{teams.length}</strong> / 4 টি
            </span>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {eligibleAvailableCount > 0 ? (
              <button
                onClick={() => onSelectRandomPlayer(false)}
                className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-sport font-black text-sm shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Shuffle className="w-5 h-5" />
                <span>র‍্যান্ডম প্লেয়ার দিয়ে নিলাম শুরু করুন (Start Auction)</span>
              </button>
            ) : unsoldPlayersCount > 0 ? (
              <button
                onClick={() => onSelectRandomPlayer(true)}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-sport font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>অবিক্রিত প্লেয়ারদের নিয়ে রি-অকশন শুরু করুন (Re-Auction)</span>
              </button>
            ) : (
              <p className="text-xs text-amber-300">
                সকল প্লেয়ারের নিলাম সম্পন্ন হয়েছে! &quot;প্লেয়ার তালিকা&quot; থেকে নতুন প্লেয়ার যুক্ত করুন।
              </p>
            )}

            <button
              onClick={onOpenProjector}
              className="py-3 px-4 rounded-xl bg-black/60 hover:bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>প্রজেক্টর ভিউ খুলুন</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-950 text-xs text-slate-400">
            এডমিন পরবর্তী প্লেয়ার নির্বাচন করলে এখানে স্বয়ংক্রিয়ভাবে লাইভ বিডিং বোর্ড প্রদর্শিত হবে।
          </div>
        )}
      </div>
    );
  }

  const positionColor = {
    GK: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    MID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    ST: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  }[currentPlayer.position];

  const playerCategoryObj = categories.find((c) => c.name === currentPlayer.category);
  const nextIncrementBid = currentBid + settings.bidIncrement;

  return (
    <div className="space-y-6">
      {/* Top Banner with Navigation & Projector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-emerald-950">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isTimerExpired ? 'bg-rose-500' : 'bg-emerald-400 animate-ping'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">লাইভ অকশন পুল:</span>
              <span className="font-mono text-xs font-bold text-emerald-400">ID: {currentPlayer.id}</span>
              {currentPlayer.category && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${playerCategoryObj?.color || '#f59e0b'}20`,
                    borderColor: `${playerCategoryObj?.color || '#f59e0b'}40`,
                    color: playerCategoryObj?.color || '#f59e0b',
                  }}
                >
                  {currentPlayer.category}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white font-sport">
              {currentPlayer.name} • {currentPlayer.position}
            </h3>
          </div>
        </div>

        {/* Timer Control Bar with Persistent Status */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-xl ${
              isTimerExpired
                ? 'bg-rose-950 border-rose-500 text-rose-400 shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/50'
                : displayTimer <= 5
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-black/80 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <span>{displayTimer}s</span>
          </div>

          {/* Admin Timer & Action Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPauseResumeTimer(!liveAuctionState.isTimerRunning)}
                className="p-2.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer"
                title={liveAuctionState.isTimerRunning ? 'টাইমার থামান' : 'টাইমার চালান'}
              >
                {liveAuctionState.isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={onResetTimer}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-emerald-950 transition-colors cursor-pointer"
                title="রিসেট টাইমার (৩০ সেকেন্ড)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {bidSequence.length > 0 && (
                <button
                  onClick={onUndoLastBid}
                  className="p-2.5 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                  title="সর্বশেষ বিড প্রত্যাহার (Undo Last Bid)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onSelectRandomPlayer(false)}
                className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-1 transition-all cursor-pointer shadow-md"
                title="পরবর্তী র্যান্ডম প্লেয়ার নির্বাচন করুন"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">পরবর্তী প্লেয়ার</span>
              </button>
            </div>
          )}

          <button
            onClick={onOpenProjector}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-600/30 border border-emerald-400/50 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold transition-all shadow-lg cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">প্রজেক্টর ভিউ</span>
          </button>
        </div>
      </div>

      {/* Prominent Timer Expired Locked Banner */}
      {isTimerExpired && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
              <LockKeyhole className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black font-sport uppercase tracking-wider text-white">
                ⏱️ কাউন্টডাউন টাইমার ০-তে পৌঁছেছে — বিড সিস্টেম সম্পূর্ণ লক (Bidding Locked)
              </h4>
              <p className="text-xs text-rose-300 mt-0.5">
                সব ওনারের বিডিং লক কার্যকর। এডমিন এখন SOLD বা UNSOLD ঘোষণা করতে পারেন অথবা পরবর্তী প্লেয়ার শুরু করতে পারেন।
              </p>
            </div>
          </div>
          {isAdmin && highestBidTeam && (
            <button
              onClick={() => setShowSoldConfirm(true)}
              className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport cursor-pointer shadow-lg transition-all shrink-0"
            >
              SOLD ঘোষণা করুন ({currentBid} pt)
            </button>
          )}
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
          <button onClick={() => setValidationError('')} className="text-rose-400 hover:text-white p-1 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Player Spotlight + Bidding Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Spotlight Card */}
        <div className="lg:col-span-5 bg-[#07190f] border border-emerald-950 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900">
              <img
                src={getSafePlayerPhoto(currentPlayer.photoUrl)}
                alt={currentPlayer.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

              <div className="absolute top-3 right-4 font-sport text-5xl font-black text-white/30 select-none">
                #{currentPlayer.jerseyNumber}
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-black/80 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  ID: {currentPlayer.id}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border backdrop-blur-sm ${positionColor}`}>
                  {currentPlayer.position}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-black/80 px-3 py-1 rounded-xl border border-amber-500/40 text-amber-300">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-sport font-bold text-sm">{currentPlayer.rating.toFixed(1)} / 10</span>
                </div>

                <button
                  onClick={() => onViewProfile(currentPlayer)}
                  className="py-1.5 px-3 rounded-xl bg-emerald-950/90 border border-emerald-400/50 hover:bg-emerald-900 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>প্রোফাইল</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-black text-white font-sport tracking-wide">
                  {currentPlayer.name}
                </h2>
                {currentPlayer.category && (
                  <span
                    className="px-2.5 py-0.5 rounded text-xs font-bold border"
                    style={{
                      backgroundColor: `${playerCategoryObj?.color || '#f59e0b'}20`,
                      borderColor: `${playerCategoryObj?.color || '#f59e0b'}50`,
                      color: playerCategoryObj?.color || '#f59e0b',
                    }}
                  >
                    🏷️ {currentPlayer.category}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-2">
                <span>জার্সি #{currentPlayer.jerseyNumber}</span>
                <span>•</span>
                <span>বয়স: {currentPlayer.age} বছর</span>
                <span>•</span>
                <span>মোবাইল: <strong className="font-mono text-white">{currentPlayer.mobile}</strong></span>
              </p>
              <p className="text-xs text-emerald-300 mt-1">
                অভিজ্ঞতা: <span>{currentPlayer.experience}</span>
              </p>
              {currentPlayer.bio && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 bg-black/30 p-2.5 rounded-xl border border-emerald-950/60">
                  {currentPlayer.bio}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-black/50 border border-emerald-950 flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">নির্ধারিত বেস প্রাইজ:</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {currentPlayer.basePrice.toLocaleString()} <span className="text-xs text-slate-400">পয়েন্ট</span>
            </span>
          </div>
        </div>

        {/* Right Column: Live Highest Bid Display, 4 Teams Bidding Pad, Admin Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Current Highest Bid Banner */}
          <div className="p-6 rounded-2xl bg-[#04150b] border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden animate-glow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>বর্তমান সর্বোচ্চ ডাক (Current Highest Bid)</span>
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-sport font-black text-5xl md:text-6xl text-amber-300 tracking-tight">
                    {currentBid.toLocaleString()}
                  </span>
                  <span className="text-base font-bold text-slate-300 uppercase">পয়েন্ট</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  পরবর্তী ন্যূনতম বৈধ ডাক: <strong className="text-emerald-400 font-mono font-bold">{nextIncrementBid.toLocaleString()} pt</strong>
                </div>
              </div>

              {/* Leading Team */}
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">
                  সর্বোচ্চ ডাককারী দল (Leading Bidder)
                </span>
                {highestBidTeam ? (
                  <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 shadow-md">
                    <img
                      src={getSafeTeamLogo(highestBidTeam.logoUrl)}
                      alt={highestBidTeam.name}
                      className="w-9 h-9 rounded-full object-cover border border-emerald-400 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                      }}
                    />
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {highestBidTeam.name}
                      </h4>
                      <p className="text-[10px] text-emerald-300 font-mono">
                        Available: {getRemainingBudget(highestBidTeam).toLocaleString()} pt
                      </p>
                      <p className="text-[9px] text-amber-300 font-mono">
                        🔒 Reserved: {(liveAuctionState.reservedAmount || currentBid).toLocaleString()} pt
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">এখনও কোনো ডাক ওঠেনি (বেস প্রাইজে আছে)</span>
                )}
              </div>
            </div>
          </div>

          {/* User Role & Authorization Banner */}
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-md text-xs ${
              currentUser?.role === 'admin'
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                : currentUser?.role === 'owner'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-black/60 border-emerald-950 text-slate-300'
            }`}
          >
            {currentUser?.role === 'admin' ? (
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">👑 এডমিন কন্ট্রোল:</span>
                  <span className="text-slate-300 ml-1.5">
                    আপনি যেকোনো দলের পক্ষে বিড করতে পারেন এবং চূড়ান্ত SOLD / UNSOLD ঘোষণা করতে পারেন।
                  </span>
                </div>
              </div>
            ) : currentUser?.role === 'owner' ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">🛡️ ওনার অ্যাকাউন্ট ({currentUser.name || currentUser.userId}):</span>
                    <span className="text-slate-300 ml-1.5">
                      দল: <strong className="text-white">{ownerTeam?.name || 'দল'}</strong>
                    </span>
                  </div>
                </div>
                {ownerTeam && (() => {
                  const ob = getTeamBalanceBreakdown(ownerTeam);
                  return (
                    <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-black/60 border border-emerald-500/40 text-emerald-300">
                        Available: <strong>{ob.available.toLocaleString()} pt</strong>
                      </span>
                      {ob.reserved > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                          🔒 Reserved: <strong>{ob.reserved.toLocaleString()} pt</strong>
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    আপনি লাইভ দর্শক (Spectator) হিসেবে দেখছেন। বিড করতে দল ওনার বা এডমিন আইডিতে লগইন করুন।
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* 4 TEAMS BIDDING PAD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>দলভিত্তিক লাইভ বিডিং প্যাড (Bidding Pad - ৪টি দল)</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                ন্যূনতম বৃদ্ধি: <strong className="text-white">+{settings.bidIncrement} pt</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teams.map((team) => {
                const breakdown = getTeamBalanceBreakdown(team);
                const remaining = breakdown.available;
                const reserved = breakdown.reserved;
                const squad = getSquadCount(team);
                const maxSquad = settings.squadLimit || 7;
                const isFull = squad >= maxSquad;
                const minBidNeeded = currentBid + settings.bidIncrement;
                const canAffordMin = remaining >= minBidNeeded;
                const isLeading = highestBidTeam?.id === team.id;

                const canBid = isTeamControllableByUser(currentUser, team, teams);
                const isMyTeam = currentUser?.role === 'owner' && canBid;
                const isOtherOwnerTeam = currentUser?.role === 'owner' && !canBid;
                const isSpectator = !currentUser;

                return (
                  <div
                    key={team.id}
                    className={`p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                      isLeading
                        ? 'bg-emerald-950/70 border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                        : isMyTeam
                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-black/40 border-emerald-950 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={getSafeTeamLogo(team.logoUrl)}
                          alt={team.name}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_TEAM_LOGO;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-white truncate">{team.name}</h5>
                            {isMyTeam && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-400 text-black shrink-0">
                                আপনার দল
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono block">
                            স্কোয়াড: <strong className={isFull ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{squad}/{maxSquad}</strong> জন
                            <span className="text-slate-400 text-[9px] ml-1">(মোট {squad + 1}/8)</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono font-bold text-emerald-400 block">
                          {remaining.toLocaleString()} pt
                        </span>
                        <span className="text-[9px] text-slate-400">Available Balance</span>
                        {reserved > 0 && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🔒 {reserved.toLocaleString()} pt Reserved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bidding Buttons */}
                    <div className="pt-2 border-t border-emerald-950/80 space-y-1.5">
                      {isTimerExpired ? (
                        <div className="w-full py-1.5 px-2 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <LockKeyhole className="w-3.5 h-3.5 text-rose-400" />
                          <span>টাইমার শেষ — বিড লকড</span>
                        </div>
                      ) : isFull ? (
                        <div className="w-full py-2 px-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-black font-sport text-center uppercase tracking-wider">
                          SQUAD FULL (স্কোয়াড পূর্ণ — সর্বোচ্চ ৭ জন কেনা হয়েছে)
                        </div>
                      ) : !canAffordMin ? (
                        <div className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium text-center">
                          বাজেট অপর্যাপ্ত ({remaining.toLocaleString()} pt অবশিষ্ট)
                        </div>
                      ) : isOtherOwnerTeam ? (
                        <div className="w-full py-1.5 px-2 rounded-lg bg-black/40 border border-slate-900 text-slate-500 text-[11px] text-center">
                          শুধুমাত্র {team.ownerName}-এর জন্য সংরক্ষিত
                        </div>
                      ) : (
                        <>
                          {/* Opening bid if no bids placed yet */}
                          {highestBidTeam === null && (
                            <button
                              disabled={isBiddingBusy || isTimerExpired || (!canBid && !isSpectator) || remaining < currentPlayer.basePrice}
                              onClick={() => {
                                if (isSpectator) {
                                  onOpenLogin();
                                  return;
                                }
                                handlePlaceBid(team, 0);
                              }}
                              className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold font-sport transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                isSpectator
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 active:scale-95'
                              }`}
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>বেস প্রাইজে ওপেনিং ডাক ({currentPlayer.basePrice.toLocaleString()} pt)</span>
                            </button>
                          )}

                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              disabled={isBiddingBusy || isTimerExpired || (!canBid && !isSpectator) || !canAffordMin}
                              onClick={() => {
                                if (isSpectator) {
                                  onOpenLogin();
                                  return;
                                }
                                handlePlaceBid(team, settings.bidIncrement);
                              }}
                              className={`py-1.5 px-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                                isSpectator
                                  ? 'bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 active:scale-95 shadow-sm'
                              }`}
                              title={`+${settings.bidIncrement} pt ডাক দিন`}
                            >
                              +{settings.bidIncrement}
                            </button>

                            <button
                              disabled={isBiddingBusy || isTimerExpired || (!canBid && !isSpectator) || remaining < currentBid + 200}
                              onClick={() => {
                                if (isSpectator) {
                                  onOpenLogin();
                                  return;
                                }
                                handlePlaceBid(team, 200);
                              }}
                              className={`py-1.5 px-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                                isSpectator
                                  ? 'bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 active:scale-95 shadow-sm'
                              }`}
                              title="+200 pt ডাক দিন"
                            >
                              +200
                            </button>

                            <button
                              disabled={isBiddingBusy || isTimerExpired || (!canBid && !isSpectator) || remaining < currentBid + 500}
                              onClick={() => {
                                if (isSpectator) {
                                  onOpenLogin();
                                  return;
                                }
                                handlePlaceBid(team, 500);
                              }}
                              className={`py-1.5 px-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                                isSpectator
                                  ? 'bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 active:scale-95 shadow-sm'
                              }`}
                              title="+500 pt ডাক দিন"
                            >
                              +500
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Bid Input (for authorized users) */}
          {(isAdmin || currentUser?.role === 'owner') && (
            <form onSubmit={handleCustomBid} className="p-3.5 rounded-xl bg-black/40 border border-emerald-950 flex flex-col sm:flex-row items-center gap-2.5">
              <span className="text-xs font-bold text-slate-300 whitespace-nowrap">কাস্টম ডাক:</span>
              {isAdmin && (
                <select
                  disabled={isTimerExpired}
                  value={selectedBidTeamId}
                  onChange={(e) => setSelectedBidTeamId(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#041009] border border-emerald-950 rounded-lg text-xs text-white focus:outline-none disabled:opacity-50"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="number"
                disabled={isTimerExpired}
                min={highestBidTeam ? currentBid + 1 : currentPlayer.basePrice}
                step={50}
                value={customBidAmount}
                onChange={(e) => setCustomBidAmount(e.target.value)}
                placeholder={isTimerExpired ? 'টাইমার শেষ - বিডিং বন্ধ' : highestBidTeam ? `পয়েন্ট লিখুন (${nextIncrementBid} pt+)` : `বেস প্রাইজ (${currentPlayer.basePrice} pt+)`}
                className="flex-1 w-full sm:w-auto px-3 py-1.5 bg-black/60 border border-emerald-950 rounded-lg text-xs text-white font-mono focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isBiddingBusy || isTimerExpired}
                className="w-full sm:w-auto py-1.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ডাক জমা দিন
              </button>
            </form>
          )}

          {/* Admin Final Decision Controls (SOLD / UNSOLD / NEXT PLAYER) */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-4 h-4" />
                  <span>এডমিন চূড়ান্ত সিদ্ধান্ত (Admin Gavel Action)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  বিড ক্লোজ করতে SOLD অথবা UNSOLD নির্বাচন করুন
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  disabled={!highestBidTeam}
                  onClick={() => setShowSoldConfirm(true)}
                  className={`py-3 px-4 rounded-xl text-xs font-bold font-sport flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    highestBidTeam
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 hover:scale-105 active:scale-95'
                      : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {highestBidTeam
                      ? `SOLD বিক্রি করুন (${highestBidTeam.name} - ${currentBid.toLocaleString()} pt)`
                      : 'ডাক না থাকলে SOLD করা যাবে না'}
                  </span>
                </button>

                <button
                  onClick={() => setShowUnsoldConfirm(true)}
                  className="py-3 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold font-sport flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>UNSOLD ঘোষণা করুন (Mark Unsold)</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Bid History Feed */}
          {bidSequence.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>লাইভ ডাক লগ (Real-Time Bid Sequence - {bidSequence.length} টি)</span>
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {bidSequence.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="p-2 rounded-lg bg-black/40 border border-emerald-950/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">#{bidSequence.length - idx}</span>
                      <strong className="text-white">{b.teamName}</strong>
                      <span className="text-[10px] text-slate-400">({b.placedByName || b.placedByRole})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{b.amount.toLocaleString()} pt</span>
                      <span className="font-mono text-[10px] text-slate-500">{b.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SOLD Confirmation Modal */}
      {showSoldConfirm && highestBidTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#081810] border-2 border-emerald-500 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-sport">প্লেয়ার বিক্রি নিশ্চিতকরণ</h3>
              <p className="text-xs text-slate-300">
                আপনি কি নিশ্চিত যে <strong className="text-emerald-400">{currentPlayer.name}</strong>-কে{' '}
                <strong className="text-amber-300">{highestBidTeam.name}</strong>-এর কাছে{' '}
                <strong className="text-white font-mono">{currentBid.toLocaleString()} পয়েন্টে</strong> বিক্রি করতে চান?
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950">
              <button
                onClick={() => setShowSoldConfirm(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={confirmSold}
                className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport cursor-pointer shadow-lg"
              >
                হ্যাঁ, বিক্রি সম্পন্ন করুন (SOLD)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSOLD Confirmation Modal */}
      {showUnsoldConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#081810] border-2 border-rose-500/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-sport">প্লেয়ার অবিক্রিত (UNSOLD) চিহ্নিতকরণ</h3>
              <p className="text-xs text-slate-300">
                <strong className="text-white">{currentPlayer.name}</strong>-এর জন্য কোনো বৈধ দল পাওয়া যায়নি। প্লেয়ারটিকে অবিক্রিত রাখা হবে। পরবর্তীতে রি-অকশনে সুযোগ দেওয়া যাবে।
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950">
              <button
                onClick={() => setShowUnsoldConfirm(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={confirmUnsold}
                className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-sport cursor-pointer shadow-lg"
              >
                হ্যাঁ, অবিক্রিত রাখুন (UNSOLD)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

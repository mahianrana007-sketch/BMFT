import React, { useState } from 'react';
import { Player, Team, PlayerCategory, UserSession } from '../types';
import { PlayerCard } from './PlayerCard';
import { 
  Search, Plus, LayoutGrid, List,
  AlertCircle, Link as LinkIcon, Tag,
  CheckCircle2, XCircle, Clock, RefreshCw,
  Users, UserCheck, Calendar, Phone, Award,
  Shield, Check, ArrowUpDown, Radio, Smartphone, Laptop, Activity,
  Download
} from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO, downloadPlayerPhoto } from '../utils/media';

interface PlayerManagementProps {
  players: Player[];
  teams: Team[];
  categories: PlayerCategory[];
  isAdmin: boolean;
  activeSessions?: UserSession[];
  onAddPlayerClick: () => void;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onViewProfile: (player: Player) => void;
  onAuctionSelect: (player: Player) => void;
  onOpenPlayerRegistration: () => void;
  onOpenCategoryManager: () => void;
  onApprovePlayer: (player: Player) => void;
  onRejectPlayer: (player: Player) => void;
  onRefreshFromFirebase?: () => Promise<void> | void;
  initialSubTab?: 'roster' | 'registrations' | 'sessions';
  onOpenAdminLogin?: () => void;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({
  players,
  teams,
  categories,
  isAdmin,
  onAddPlayerClick,
  onEditPlayer,
  onDeletePlayer,
  onViewProfile,
  onAuctionSelect,
  onOpenPlayerRegistration,
  onOpenCategoryManager,
  onApprovePlayer,
  onRejectPlayer,
  onRefreshFromFirebase,
  initialSubTab,
  onOpenAdminLogin,
  activeSessions = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'rating' | 'basePrice' | 'jersey' | 'name' | 'date'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'roster' | 'registrations' | 'sessions'>(() => 
    initialSubTab || 'roster'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveAdminSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const pendingPlayers = players.filter((p) => (p.approvalStatus || 'APPROVED') === 'PENDING');
  const registeredUsers = players.filter(
    (p) =>
      p.registeredViaLink ||
      p.createdAt ||
      p.approvalStatus === 'PENDING' ||
      (p.id && (p.id.startsWith('PL-') || p.id.startsWith('ply-')))
  );

  const formatRegDate = (isoStr?: string) => {
    if (!isoStr) return 'তারিখ উপলব্ধ নেই';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const handleRefreshClick = async () => {
    if (!onRefreshFromFirebase) return;
    setIsRefreshing(true);
    try {
      await onRefreshFromFirebase();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const filteredPlayers = players.filter((player) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      player.name.toLowerCase().includes(query) ||
      player.id.toLowerCase().includes(query) ||
      player.mobile.toLowerCase().includes(query) ||
      (player.category && player.category.toLowerCase().includes(query)) ||
      player.jerseyNumber.toString().includes(query);

    const matchesPosition = selectedPosition === 'ALL' || player.position === selectedPosition;
    const matchesStatus = selectedStatus === 'ALL' || player.status === selectedStatus;
    
    const playerApproval = player.approvalStatus || 'APPROVED';
    const matchesApproval = selectedApproval === 'ALL' || playerApproval === selectedApproval;

    return matchesSearch && matchesPosition && matchesStatus && matchesApproval;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'basePrice') return b.basePrice - a.basePrice;
    if (sortBy === 'jersey') return a.jerseyNumber - b.jerseyNumber;
    if (sortBy === 'date') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-sport tracking-wide flex items-center gap-2.5">
            <span>প্লেয়ার তালিকা ও রোস্টার (Player Roster)</span>
            {pendingPlayers.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
                {pendingPlayers.length} অপেক্ষমাণ
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            মোট {players.length} জন প্লেয়ার নিবন্ধিত রয়েছে (অনুমোদিত: {players.filter(p => (p.approvalStatus || 'APPROVED') === 'APPROVED').length} জন)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onRefreshFromFirebase && (
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Firebase সার্ভার থেকে সরাসরি রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'সিঙ্ক হচ্ছে...' : 'Firebase রিফ্রেশ'}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenCategoryManager}
              className="py-2.5 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>ক্যাটাগরি ব্যবস্থাপনা</span>
            </button>
          )}

          <button
            onClick={onOpenPlayerRegistration}
            className="py-2.5 px-3.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>রেজিস্ট্রেশন লিংক পোর্টাল</span>
          </button>

          {/* Grid / Table Toggle */}
          <div className="flex items-center p-1 bg-black/60 rounded-xl border border-emerald-950">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="গ্রিড ভিউ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="টেবিল ভিউ"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={onAddPlayerClick}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ম্যানুয়ালি প্লেয়ার যোগ</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Sub-Tab Navigation Bar */}
      {isAdmin ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#06180f] rounded-2xl border border-emerald-950">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveAdminSubTab('roster')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeAdminSubTab === 'roster'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>প্লেয়ার রোস্টার ও নিলাম পুল ({players.length})</span>
            </button>

            <button
              onClick={() => setActiveAdminSubTab('registrations')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeAdminSubTab === 'registrations'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                  : 'text-amber-300 hover:text-white hover:bg-amber-500/10'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>অনলাইন নিবন্ধিত ইউজার প্যানেল ({registeredUsers.length})</span>
              {pendingPlayers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {pendingPlayers.length} নতুন
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminSubTab('sessions')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeAdminSubTab === 'sessions'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-500/10'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>লাইভ ডিভাইস ও লগইন সেশন ({activeSessions.length})</span>
              {activeSessions.filter((s) => s.status === 'online').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/40 border border-emerald-950 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-emerald-400 font-bold">Firebase Real-time Connected</span>
          </div>
        </div>
      ) : pendingPlayers.length > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-950/50 border-2 border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="text-xs font-bold font-sport">
              অনুমোদন অপেক্ষমাণ: <strong className="text-white font-mono">{pendingPlayers.length}</strong> জন খেলোয়াড় নতুন রেজিস্ট্রেশন করেছেন! অনুমোদন বা বাতিল করতে এডমিন প্যানেলে লগইন করুন।
            </span>
          </div>
          {onOpenAdminLogin && (
            <button
              onClick={onOpenAdminLogin}
              className="py-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-sport cursor-pointer shadow-md transition-all shrink-0"
            >
              এডমিন লগইন
            </button>
          )}
        </div>
      ) : null}

      {/* DEDICATED REGISTERED USERS MANAGEMENT VIEW FOR ADMIN */}
      {isAdmin && activeAdminSubTab === 'registrations' ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#06180f] border-2 border-amber-500/40 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
            <div>
              <h3 className="text-xl font-black text-white font-sport flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>অনলাইন নিবন্ধিত ইউজার তালিকা ও অনুমোদন (Registered Users)</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Firebase Database-এ নিবন্ধিত সকল ইউজারের নাম, User ID, নিবন্ধনের তারিখ ও অনুমোদন অবস্থা।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ ডাটা</span>
              </button>

              <button
                onClick={onOpenPlayerRegistration}
                className="py-2 px-3.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>রেজিস্ট্রেশন লিংক</span>
              </button>
            </div>
          </div>

          {/* Registration Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-950 space-y-1">
              <span className="text-slate-400 block text-[11px]">মোট অনলাইন ইউজার</span>
              <span className="text-xl font-black text-white font-mono">{registeredUsers.length} জন</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/40 space-y-1">
              <span className="text-amber-400 block text-[11px] font-bold">অনুমোদন অপেক্ষমাণ (Pending)</span>
              <span className="text-xl font-black text-amber-300 font-mono">{pendingPlayers.length} জন</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/40 space-y-1">
              <span className="text-emerald-400 block text-[11px] font-bold">অনুমোদিত (Approved)</span>
              <span className="text-xl font-black text-emerald-300 font-mono">
                {registeredUsers.filter((p) => (p.approvalStatus || 'APPROVED') === 'APPROVED').length} জন
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/40 space-y-1">
              <span className="text-rose-400 block text-[11px] font-bold">বাতিলকৃত (Rejected)</span>
              <span className="text-xl font-black text-rose-300 font-mono">
                {registeredUsers.filter((p) => p.approvalStatus === 'REJECTED').length} জন
              </span>
            </div>
          </div>

          {/* Registered Users Table */}
          {registeredUsers.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-black/40 border border-dashed border-emerald-950 space-y-3">
              <Users className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-base font-bold text-white">এখনও কোনো অনলাইন নিবন্ধন হয়নি</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                খেলোয়াড়দের রেজিস্ট্রেশন লিংক শেয়ার করুন। তারা নিবন্ধন করলে সাথে সাথে Firebase-এর মাধ্যমে এখানে দেখা যাবে।
              </p>
              <button
                onClick={onOpenPlayerRegistration}
                className="py-2 px-4 rounded-xl bg-emerald-500 text-black text-xs font-bold cursor-pointer"
              >
                রেজিস্ট্রেশন লিংক খুলুন
              </button>
            </div>
          ) : (
            <div className="border border-emerald-950 rounded-2xl overflow-hidden bg-black/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#04120a] text-slate-400 uppercase text-[10px] border-b border-emerald-950">
                    <tr>
                      <th className="py-3.5 px-4">ইউজার / প্লেয়ারের নাম</th>
                      <th className="py-3.5 px-3">User ID</th>
                      <th className="py-3.5 px-3">মোবাইল নম্বর</th>
                      <th className="py-3.5 px-3">নিবন্ধন তারিখ (Registration Date)</th>
                      <th className="py-3.5 px-3">পজিশন ও বেস প্রাইজ</th>
                      <th className="py-3.5 px-3">অনুমোদন অবস্থা (Approval Status)</th>
                      <th className="py-3.5 px-4 text-right">এডমিন অ্যাকশন (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/60 bg-black/20">
                    {registeredUsers.map((user) => {
                      const isPending = (user.approvalStatus || 'APPROVED') === 'PENDING';
                      const isApproved = (user.approvalStatus || 'APPROVED') === 'APPROVED';
                      const isRejected = user.approvalStatus === 'REJECTED';

                      return (
                        <tr key={user.id} className="hover:bg-emerald-950/20 transition-colors">
                          {/* Name & Photo */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getSafePlayerPhoto(user.photoUrl)}
                                alt={user.name}
                                className="w-10 h-11 rounded-lg object-cover object-top border border-emerald-500/30 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                                }}
                              />
                              <div>
                                <span className="font-bold text-white block text-sm">{user.name}</span>
                                <span className="text-[10px] text-slate-400">
                                  #{user.jerseyNumber} • {user.age} বছর • {user.preferredFoot || 'Right'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* User ID */}
                          <td className="py-3.5 px-3">
                            <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-xs">
                              {user.id}
                            </span>
                          </td>

                          {/* Mobile */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 font-mono text-slate-300">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{user.mobile || '—'}</span>
                            </div>
                          </td>

                          {/* Registration Date */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
                              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{formatRegDate(user.createdAt)}</span>
                            </div>
                          </td>

                          {/* Position & Base Price */}
                          <td className="py-3.5 px-3">
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {user.position}
                              </span>
                              <span className="text-[11px] font-mono text-slate-300 ml-2">
                                {user.basePrice.toLocaleString()} pt
                              </span>
                            </div>
                          </td>

                          {/* Approval Status */}
                          <td className="py-3.5 px-3">
                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 w-max animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>PENDING (অপেক্ষমাণ)</span>
                              </span>
                            ) : isApproved ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>APPROVED (অনুমোদিত)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1 w-max">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>REJECTED (বাতিল)</span>
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => onApprovePlayer(user)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-1 cursor-pointer shadow-sm"
                                    title="অনুমোদন করুন"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => onRejectPlayer(user)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    title="বাতিল করুন"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {!isPending && isRejected && (
                                <button
                                  onClick={() => onApprovePlayer(user)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  title="অনুমোদন করুন"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>পুনরায় অনুমোদন</span>
                                </button>
                              )}

                              {!isPending && isApproved && (
                                <button
                                  onClick={() => onRejectPlayer(user)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-1 cursor-pointer"
                                  title="বাতিল করুন"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>বাতিল</span>
                                </button>
                              )}

                              <button
                                onClick={() => onViewProfile(user)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-xs font-semibold cursor-pointer"
                                title="প্রোফাইল দেখুন"
                              >
                                বিস্তারিত
                              </button>

                              <button
                                type="button"
                                onClick={() => downloadPlayerPhoto(user.photoUrl, user.name, user.id)}
                                className="p-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer"
                                title="ছবি ডাউনলোড করুন"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onEditPlayer(user)}
                                className="px-2 py-1 rounded-lg bg-black/60 text-slate-300 hover:text-white border border-emerald-950 text-xs font-semibold cursor-pointer"
                                title="এডিট করুন"
                              >
                                এডিট
                              </button>

                              <button
                                onClick={() => onDeletePlayer(user.id)}
                                className="px-2 py-1 rounded-lg bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 text-xs font-semibold cursor-pointer"
                                title="মুছে ফেলুন"
                              >
                                মুছুন
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* REAL-TIME MULTI-DEVICE LOGIN SESSIONS FOR ADMIN */}
      {isAdmin && activeAdminSubTab === 'sessions' ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#06180f] border-2 border-cyan-500/40 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyan-500/20">
            <div>
              <h3 className="text-xl font-black text-white font-sport flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-cyan-400" />
                <span>রিয়েল-টাইম মাল্টি-ডিভাইস লগইন ও অনলাইন সেশন (Live Login Sessions)</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                অন্য ডিভাইস বা আইপি অ্যাড্রেস থেকে এডমিন, দল মালিক বা প্লেয়ার লগইন করলে সাথে সাথে এই তালিকায় লাইভ প্রদর্শিত হয়।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="py-2 px-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ সেশন</span>
              </button>
            </div>
          </div>

          {/* Sessions Quick Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-950 space-y-1">
              <span className="text-slate-400 block text-[11px]">মোট লগইন রেকর্ড</span>
              <span className="text-xl font-black text-white font-mono">{activeSessions.length} টি</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/40 space-y-1">
              <span className="text-emerald-400 block text-[11px] font-bold">অনলাইন ও সক্রিয়</span>
              <span className="text-xl font-black text-emerald-300 font-mono">
                {activeSessions.filter((s) => s.status === 'online').length} জন
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/40 space-y-1">
              <span className="text-amber-400 block text-[11px] font-bold">এডমিন লগইন</span>
              <span className="text-xl font-black text-amber-300 font-mono">
                {activeSessions.filter((s) => s.role === 'admin').length} টি
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/40 space-y-1">
              <span className="text-cyan-400 block text-[11px] font-bold">টিম ওনার লগইন</span>
              <span className="text-xl font-black text-cyan-300 font-mono">
                {activeSessions.filter((s) => s.role === 'owner').length} টি
              </span>
            </div>
          </div>

          {/* Sessions Table */}
          {activeSessions.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-black/40 border border-dashed border-cyan-950 space-y-3">
              <Radio className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-base font-bold text-white">এখনও কোনো রিমোট লগইন রেকর্ড হয়নি</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                অন্য কোনো ফোন বা কম্পিউটার থেকে এডমিন বা টিম ওনার আইডি দিয়ে লগইন করলে স্বয়ংক্রিয়ভাবে এখানে লাইভ দেখা যাবে।
              </p>
            </div>
          ) : (
            <div className="border border-cyan-950/70 rounded-2xl overflow-hidden bg-black/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#03150e] text-slate-400 uppercase text-[10px] border-b border-cyan-950">
                    <tr>
                      <th className="py-3.5 px-4">ইউজার / অ্যাকাউন্ট</th>
                      <th className="py-3.5 px-3">User ID</th>
                      <th className="py-3.5 px-3">ভূমিকা (Role)</th>
                      <th className="py-3.5 px-3">ডিভাইস / ব্রাউজার</th>
                      <th className="py-3.5 px-3">লগইন সময়</th>
                      <th className="py-3.5 px-3">লাইভ স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/40">
                    {activeSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-cyan-950/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                              {session.name ? session.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-white block text-xs">{session.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{session.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-300">
                          {session.userId}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              session.role === 'admin'
                                ? 'bg-amber-500 text-black'
                                : session.role === 'owner'
                                ? 'bg-emerald-500 text-black'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            {session.role === 'admin'
                              ? 'এডমিন (Admin)'
                              : session.role === 'owner'
                              ? 'দল মালিক (Owner)'
                              : 'খেলোয়াড় (Player)'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            {session.deviceInfo?.includes('Mobile') || session.deviceInfo?.includes('Android') || session.deviceInfo?.includes('iOS') ? (
                              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span className="text-xs">{session.deviceInfo || 'ওয়েব ব্রাউজার'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                          {formatRegDate(session.loginTime)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Active Live
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Admin Quick Category Base Prices Bar */}
      {isAdmin && categories.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#06180f] border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-sport">
              <Tag className="w-3.5 h-3.5" />
              <span>ক্যাটাগরি বেস প্রাইজ (Active Base Prices):</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {categories.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold"
                  style={{ backgroundColor: `${c.color}15`, borderColor: `${c.color}40`, color: c.color }}
                >
                  <span>{c.code || c.name}:</span>
                  <span className="text-white">{c.basePrice.toLocaleString()} pt</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenCategoryManager}
            className="text-xs text-amber-300 hover:text-white underline font-semibold cursor-pointer py-1"
          >
            প্রাইজ পরিবর্তন করুন &rarr;
          </button>
        </div>
      )}

      {/* Admin Approval Review Section for Pending Players */}
      {isAdmin && pendingPlayers.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#091a10] border-2 border-amber-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-sport font-bold text-base">
              <Clock className="w-5 h-5 animate-spin" />
              <span>অনুমোদন অপেক্ষমাণ প্লেয়ার তালিকা (Pending Player Approvals - {pendingPlayers.length} জন)</span>
            </div>
            <span className="text-xs text-slate-400">
              নিলাম পুলে যোগ করতে অনুমোদন (Approve) করুন
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingPlayers.map((player) => (
              <div
                key={player.id}
                className="p-3.5 rounded-xl bg-black/60 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getSafePlayerPhoto(player.photoUrl)}
                    alt={player.name}
                    className="w-12 h-14 rounded-lg object-cover object-top border border-amber-500/40 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-amber-400 font-bold">{player.id}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {player.position}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{player.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      মোবাইল: <span className="font-mono text-slate-300">{player.mobile}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      বয়স: {player.age} • বেস: {player.basePrice} pt
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onApprovePlayer(player)}
                      className="py-1 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold font-sport flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      title="অনুমোদন করুন"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPlayerPhoto(player.photoUrl, player.name, player.id)}
                      className="p-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                      title="ছবি ডাউনলোড করুন"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRejectPlayer(player)}
                    className="py-1 px-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="বাতিল করুন"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, ID, মোবাইল, ক্যাটাগরি বা জার্সি দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Position Filter */}
          <div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">সকল পজিশন (Position)</option>
              <option value="GK">গোলকিপার (GK)</option>
              <option value="DEF">ডিফেন্ডার (DEF)</option>
              <option value="MID">মিডফিল্ডার (MID)</option>
              <option value="ST">স্ট্রাইকার (ST)</option>
            </select>
          </div>

          {/* Auction Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">সকল নিলাম স্ট্যাটাস</option>
              <option value="available">Available (উপলব্ধ)</option>
              <option value="live">Live Bid (লাইভ)</option>
              <option value="sold">SOLD (বিক্রিত)</option>
              <option value="unsold">Unsold (অবিক্রিত)</option>
            </select>
          </div>

          {/* Approval Filter */}
          <div>
            <select
              value={selectedApproval}
              onChange={(e) => setSelectedApproval(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
            >
              <option value="ALL">সকল অনুমোদন অবস্থা</option>
              <option value="APPROVED">APPROVED (অনুমোদিত)</option>
              <option value="PENDING">PENDING (অপেক্ষমাণ)</option>
              <option value="REJECTED">REJECTED (বাতিলকৃত)</option>
            </select>
          </div>
        </div>

        {/* Sort & Info Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-950/60 text-xs">
          <span className="text-slate-400">
            খুঁজে পাওয়া গেছে: <strong className="text-emerald-400 font-mono">{filteredPlayers.length}</strong> জন প্লেয়ার
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">সর্ট করুন:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'basePrice' | 'jersey' | 'name')}
              className="px-2.5 py-1 bg-black/60 border border-emerald-950 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="rating">রেটিং (উচ্চ থেকে নিম্ন)</option>
              <option value="basePrice">বেস প্রাইজ (বেশি থেকে কম)</option>
              <option value="jersey">জার্সি নম্বর</option>
              <option value="name">নাম (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players List Grid / Table */}
      {filteredPlayers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#06180f] border-2 border-dashed border-emerald-950 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white font-sport">কোনো প্লেয়ার পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 max-w-md">
            এডমিন হিসেবে উপরে &quot;ম্যানুয়ালি প্লেয়ার যোগ&quot; বাটনে ক্লিক করে যোগ করতে পারেন, অথবা প্লেয়ারদের রেজিস্ট্রেশন লিংক শেয়ার করুন।
          </p>
          <button
            onClick={onOpenPlayerRegistration}
            className="py-2 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
          >
            রেজিস্ট্রেশন লিংক কপি ও পোর্টাল
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {sortedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              teams={teams}
              isAdmin={isAdmin}
              onViewProfile={onViewProfile}
              onEdit={onEditPlayer}
              onDelete={onDeletePlayer}
              onAuctionSelect={onAuctionSelect}
            />
          ))}
        </div>
      ) : (
        <div className="border border-emerald-950 rounded-2xl overflow-hidden bg-[#06180f]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">প্লেয়ার</th>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">পজিশন</th>
                  <th className="py-3 px-3">ক্যাটাগরি</th>
                  <th className="py-3 px-3">বেস প্রাইজ</th>
                  <th className="py-3 px-3">অনুমোদন</th>
                  <th className="py-3 px-3">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60 bg-black/20">
                {sortedPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-emerald-950/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-500/30"
                        />
                        <div>
                          <span className="font-bold text-white block">{player.name}</span>
                          <span className="text-[10px] text-slate-400">
                            #{player.jerseyNumber} • {player.age} বছর
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">{player.id}</td>
                    <td className="py-3 px-3 font-bold text-emerald-300">{player.position}</td>
                    <td className="py-3 px-3">
                      {player.category ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {player.category}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-200">{player.basePrice} pt</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        (player.approvalStatus || 'APPROVED') === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : (player.approvalStatus || 'APPROVED') === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {player.approvalStatus || 'APPROVED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 uppercase text-[10px] font-bold text-emerald-400">
                      {player.status}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && player.status === 'available' && (player.approvalStatus || 'APPROVED') === 'APPROVED' && (
                          <button
                            onClick={() => onAuctionSelect(player)}
                            className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold font-sport cursor-pointer shadow-sm"
                            title="লাইভ নিলাম শুরু করুন"
                          >
                            নিলাম
                          </button>
                        )}
                        <button
                          onClick={() => onViewProfile(player)}
                          className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-[11px] font-semibold cursor-pointer"
                        >
                          প্রোফাইল
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => downloadPlayerPhoto(player.photoUrl, player.name, player.id)}
                              className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[11px] font-semibold cursor-pointer border border-emerald-500/30"
                              title="ছবি ডাউনলোড করুন"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onEditPlayer(player)}
                              className="px-2.5 py-1 rounded bg-black/60 text-slate-300 hover:bg-slate-800 text-[11px] font-semibold cursor-pointer"
                            >
                              এডিট
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

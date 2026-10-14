import React, { useState } from 'react';
import { 
  Trophy, Flame, Users, Shield, History, FileText, 
  Settings as SettingsIcon, Lock, Volume2, VolumeX, Menu, X, RotateCcw,
  Crown, UserPlus, Share2, Globe, Bell, Calendar, Award, Home
} from 'lucide-react';
import { AppUser, Team } from '../types';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  currentUser: AppUser | null;
  teams: Team[];
  onOpenAdminLogin: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  availableCount: number;
  pendingRegistrationsCount?: number;
  onOpenResetModal: () => void;
  onOpenOwnerPortal?: () => void;
  onOpenAdminCredentials?: () => void;
  onOpenShareModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
  currentUser,
  teams,
  onOpenAdminLogin,
  soundEnabled,
  onToggleSound,
  availableCount,
  pendingRegistrationsCount = 0,
  onOpenResetModal,
  onOpenOwnerPortal,
  onOpenAdminCredentials,
  onOpenShareModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Professional Football Club & League + Auction Navigation
  const allNavItems = [
    { id: 'home', label: 'হোম', icon: Home, adminOnly: false },
    { id: 'matches', label: 'ম্যাচ ও রেজাল্ট', icon: Calendar, adminOnly: false },
    { id: 'table', label: 'পয়েন্ট টেবিল', icon: Trophy, adminOnly: false },
    { id: 'stats', label: 'পরিসংখ্যান', icon: Award, adminOnly: false },
    { id: 'teams', label: 'দলসমূহ', icon: Shield, adminOnly: false },
    { 
      id: 'players', 
      label: 'খেলোয়াড়', 
      icon: Users, 
      badge: availableCount, 
      pendingBadge: pendingRegistrationsCount,
      adminOnly: false 
    },
    { id: 'live', label: 'লাইভ নিলাম', icon: Flame, isLive: true, adminOnly: false },
    { id: 'player-register', label: 'রেজিস্ট্রেশন', icon: UserPlus, adminOnly: false },
    { id: 'admin-club', label: 'এডমিন প্যানেল', icon: Crown, adminOnly: false },
    { id: 'history', label: 'ইতিহাস', icon: History, adminOnly: false },
    { id: 'reports', label: 'প্রতিবেদন', icon: FileText, adminOnly: false },
    { id: 'settings', label: 'সেটিংস', icon: SettingsIcon, adminOnly: true },
  ];

  const visibleNavItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const handleNavClick = (id: string) => {
    if (id === 'admin-club' && !isAdmin) {
      onOpenAdminLogin();
      return;
    }
    onTabChange(id);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#020b05]/95 backdrop-blur-md border-b border-emerald-950/90 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <span className="text-xl">⚽</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sport font-black text-base sm:text-lg md:text-xl text-white tracking-wide">
                  MR FOOTBALL
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-400 font-sport uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                  LEAGUE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 tracking-tight font-bn truncate">
                অফিসিয়াল ক্লাব ও লিগ প্ল্যাটফর্ম
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-emerald-950/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.isLive && isActive ? 'text-amber-400 animate-pulse' : ''}`} />
                  <span>{item.label}</span>
                  {item.isLive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                  {typeof item.pendingBadge === 'number' && item.pendingBadge > 0 ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black shadow-md animate-pulse">
                      {item.pendingBadge} নতুন
                    </span>
                  ) : typeof item.badge === 'number' && item.badge > 0 ? (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* New Pending Registrations Alert Button */}
            {pendingRegistrationsCount > 0 && (
              <button
                onClick={() => onTabChange('players')}
                className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/30 transition-all cursor-pointer animate-pulse"
                title="নতুন প্লেয়ার রেজিস্ট্রেশন অপেক্ষমাণ (অনুমোদন করতে ক্লিক করুন)"
              >
                <Bell className="w-3.5 h-3.5 animate-bounce text-black" />
                <span className="hidden sm:inline font-sport">{pendingRegistrationsCount} নতুন আবেদন</span>
                <span className="sm:hidden font-mono font-bold">{pendingRegistrationsCount}</span>
              </button>
            )}

            {/* Official Website Link Badge */}
            <a
              href="https://bmftauction.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold hover:bg-emerald-900 transition-colors"
              title="অফিসিয়াল ওয়েবসাইট পোর্টাল"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>bmftauction.netlify.app</span>
            </a>

            {/* Free Website Share Link Action */}
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer shadow-md"
                title="ফ্রি ওয়েবসাইট ও রেজিস্ট্রেশন লিংক শেয়ার করুন"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">শেয়ার ও লিংক</span>
              </button>
            )}

            {/* Quick Reset Data Button (ADMIN ONLY) */}
            {isAdmin && (
              <button
                onClick={onOpenResetModal}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all cursor-pointer"
                title="টুর্নামেন্ট বা নিলাম ডাটা রিসেট করুন (Admin Only)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">ডাটা রিসেট</span>
              </button>
            )}

            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-black/40 hover:bg-emerald-950/60 border border-emerald-950 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Owner or Admin quick portal action */}
            {currentUser?.role === 'owner' && onOpenOwnerPortal && (
              <button
                onClick={onOpenOwnerPortal}
                className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer"
                title="দলের নাম, ছবি ও পাসওয়ার্ড পরিবর্তন"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>দল সেটিংস</span>
              </button>
            )}

            {isAdmin && onOpenAdminCredentials && (
              <button
                onClick={onOpenAdminCredentials}
                className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-all cursor-pointer"
                title="সকল ইউজার আইডি ও পাসওয়ার্ড দেখুন"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>আইডি/পাসওয়ার্ড</span>
              </button>
            )}

            {/* User Account / Role Pill */}
            <button
              onClick={onOpenAdminLogin}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentUser?.role === 'admin'
                  ? 'bg-amber-950/80 border-amber-400/60 text-amber-300 shadow-md shadow-amber-950/50'
                  : currentUser?.role === 'owner'
                  ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300 shadow-md shadow-emerald-950/50'
                  : 'bg-black/60 border-slate-800 text-slate-300 hover:border-emerald-500/40'
              }`}
              title="ইউজার লগইন ও অ্যাকাউন্ট পরিচালনা"
            >
              {currentUser?.role === 'admin' ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>এডমিন ({currentUser.userId})</span>
                </>
              ) : currentUser?.role === 'owner' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ওনার ({currentUser.userId})</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>লগইন করুন</span>
                </>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-black/40 border border-emerald-950 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-emerald-950 space-y-1 animate-in slide-in-from-top">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleNavClick(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-300 hover:bg-emerald-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.pendingBadge && item.pendingBadge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black animate-pulse">
                      {item.pendingBadge} নতুন আবেদন
                    </span>
                  ) : item.isLive ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-black">
                      LIVE
                    </span>
                  ) : typeof item.badge === 'number' && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useEffect, useState } from 'react';
import { AuctionNotification } from '../types';
import { Trophy, Ban, TrendingUp, Bell, X, RotateCcw, UserCheck, ShieldAlert } from 'lucide-react';

interface NotificationToastProps {
  notifications: AuctionNotification[];
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<{
  notif: AuctionNotification;
  onDismiss: (id: string) => void;
}> = ({ notif, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // 2-second auto-dismissal
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(notif.id), 250);
    }, 2000);

    return () => clearTimeout(timer);
  }, [notif.id, onDismiss]);

  if (!visible) return null;

  let Icon = Bell;
  let borderClass = 'border-emerald-500/60 bg-[#061a12]/95 text-emerald-300';
  let badgeColor = 'bg-emerald-500 text-black';

  if (notif.type === 'player_sold') {
    Icon = Trophy;
    borderClass = 'border-amber-500/80 bg-[#1c1505]/95 text-amber-300';
    badgeColor = 'bg-amber-400 text-black';
  } else if (notif.type === 'player_unsold') {
    Icon = Ban;
    borderClass = 'border-rose-500/80 bg-[#1a0808]/95 text-rose-300';
    badgeColor = 'bg-rose-500 text-white';
  } else if (notif.type === 'bid_placed') {
    Icon = TrendingUp;
    borderClass = 'border-cyan-500/80 bg-[#051720]/95 text-cyan-300';
    badgeColor = 'bg-cyan-400 text-black';
  } else if (notif.type === 'player_registered' || notif.type === 'profile_updated') {
    Icon = UserCheck;
    borderClass = 'border-emerald-400/90 bg-[#041a10]/95 text-emerald-300';
    badgeColor = 'bg-emerald-400 text-black';
  } else if (notif.type === 'settings_updated') {
    Icon = RotateCcw;
    borderClass = 'border-emerald-500/60 bg-[#031c10]/95 text-emerald-300';
    badgeColor = 'bg-emerald-500 text-black';
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border-2 backdrop-blur-md shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${borderClass}`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${badgeColor}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs font-bold uppercase tracking-wider truncate">
            {notif.title}
          </h4>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">২ সেকেন্ড</span>
        </div>
        <p className="text-xs text-slate-200 mt-0.5 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>
      </div>

      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(notif.id), 100);
        }}
        className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer shrink-0"
        title="বন্ধ করুন"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  const activeList = notifications.slice(0, 1);

  if (activeList.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {activeList.map((notif) => (
        <ToastItem key={notif.id} notif={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

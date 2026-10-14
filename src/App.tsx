import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Player, Team, AuctionSettings, AuctionHistoryItem, AuctionNotification, 
  BidRecord, AppUser, PlayerCategory, LiveAuctionState, UserSession, Match,
  LeagueStanding, PlayerLeaderboardItem, PlayerMatchPerformance
} from './types';
import { StorageService } from './services/storageService';
import { FirestoreSync, testConnection } from './services/firebase';
import { soundFx } from './utils/audio';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO } from './utils/media';
import { 
  calculateLeagueStandings, calculateTopScorers, calculateTopAssists,
  calculateTournamentAwards
} from './utils/leagueCalculations';
import { Bell, CheckCircle2, X, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ClubHomepage } from './components/ClubHomepage';
import { MatchesView } from './components/MatchesView';
import { LeagueTableView } from './components/LeagueTableView';
import { PlayerStatsView } from './components/PlayerStatsView';
import { AdminClubPanel } from './components/AdminClubPanel';
import { MatchModal } from './components/MatchModal';
import { PerformanceEntryModal } from './components/PerformanceEntryModal';
import { Dashboard } from './components/Dashboard';
import { LiveAuction } from './components/LiveAuction';
import { PlayerManagement } from './components/PlayerManagement';
import { PlayerRegistrationView } from './components/PlayerRegistrationView';
import { TeamManagement } from './components/TeamManagement';
import { AuctionHistory } from './components/AuctionHistory';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { PlayerFormModal } from './components/PlayerFormModal';
import { TeamFormModal } from './components/TeamFormModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { OwnerSettingsModal } from './components/OwnerSettingsModal';
import { AdminCredentialsModal } from './components/AdminCredentialsModal';
import { ProjectorModal } from './components/ProjectorModal';
import { NotificationToast } from './components/NotificationToast';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { EditSettingsModal } from './components/EditSettingsModal';
import { ShareWebsiteModal } from './components/ShareWebsiteModal';
import { CategoryManagementModal } from './components/CategoryManagementModal';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => StorageService.getPlayers());
  const [teams, setTeams] = useState<Team[]>(() => StorageService.getTeams());
  const [matches, setMatches] = useState<Match[]>(() => StorageService.getMatches());
  const [performances, setPerformances] = useState<PlayerMatchPerformance[]>(() => StorageService.getPerformances());
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState<PlayerMatchPerformance | null>(null);
  const [defaultPerformancePlayerId, setDefaultPerformancePlayerId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AuctionSettings>(() => StorageService.getSettings());
  const [history, setHistory] = useState<AuctionHistoryItem[]>(() => StorageService.getHistory());
  const [categories, setCategories] = useState<PlayerCategory[]>(() => StorageService.getCategories());
  const [liveAuctionState, setLiveAuctionState] = useState<LiveAuctionState>(() => StorageService.getLiveState());
  const [notifications, setNotifications] = useState<AuctionNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => StorageService.getCurrentUser());
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);
  const [registrationAlertPlayer, setRegistrationAlertPlayer] = useState<Player | null>(null);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [loginAlertSession, setLoginAlertSession] = useState<UserSession | null>(null);
  const prevPlayersRef = useRef<Player[]>(players);
  const prevSessionsRef = useRef<UserSession[]>([]);

  const isAdmin = currentUser?.role === 'admin';

  // Navigation tab state (handles ?tab=... deep links directly with strict admin guard)
  const VALID_TABS = [
    'home',
    'matches',
    'table',
    'stats',
    'teams',
    'players',
    'live',
    'player-register',
    'admin-club',
    'dashboard',
    'history',
    'reports',
    'settings'
  ];
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && VALID_TABS.includes(tabParam)) {
        // Strict guard: if non-admin tries to deep link to 'settings', deny!
        if (tabParam === 'settings' && StorageService.getCurrentUser()?.role !== 'admin') {
          return 'home';
        }
        return tabParam;
      }
    }
    return 'home';
  });

  // Strict role-based guard on activeTab: non-admin CANNOT view settings
  useEffect(() => {
    if (activeTab === 'settings' && !isAdmin) {
      setActiveTab('home');
      FirestoreSync.logSecurityEvent(
        'SETTINGS_ACCESS_ATTEMPT',
        currentUser?.userId || 'guest',
        currentUser?.role || 'spectator',
        'BLOCKED',
        'Non-admin user attempted to access the settings tab'
      ).catch(() => {});
      notify({
        type: 'settings_updated',
        title: 'অননুমোদিত অ্যাক্সেস (Access Denied)',
        message: 'টুর্নামেন্ট সেটিংস শুধুমাত্র এডমিনের জন্য সংরক্ষিত।',
      });
    } else if (activeTab === 'admin-club' && !isAdmin) {
      setIsAdminLoginOpen(true);
      setActiveTab('home');
    }
  }, [activeTab, isAdmin, currentUser]);

  // Keep browser URL query params updated with current activeTab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (activeTab === 'home') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', activeTab);
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab]);

  // Modals state
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isOwnerSettingsOpen, setIsOwnerSettingsOpen] = useState(false);
  const [isAdminCredentialsOpen, setIsAdminCredentialsOpen] = useState(false);
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Dynamic real-time calculation of League Table, Top Scorers, Top Assists & Tournament Awards
  const standings = useMemo(() => calculateLeagueStandings(teams, matches), [teams, matches]);
  const topScorers = useMemo(() => calculateTopScorers(players, teams, matches), [players, teams, matches]);
  const topAssists = useMemo(() => calculateTopAssists(players, teams, matches), [players, teams, matches]);
  const tournamentAwards = useMemo(
    () => calculateTournamentAwards(players, performances, teams),
    [players, performances, teams]
  );

  // Subscribe to real-time Firestore database and cross-tab broadcasts
  useEffect(() => {
    testConnection().catch(() => {});

    // Ensure loading screen does not freeze if client runs in offline mode
    const loadTimeout = setTimeout(() => {
      setIsFirebaseLoading(false);
    }, 1200);

    let unsubPlayers = () => {};
    let unsubTeams = () => {};
    let unsubMatches = () => {};
    let unsubPerformances = () => {};
    let unsubSettings = () => {};
    let unsubHistory = () => {};
    let unsubNotifs = () => {};
    let unsubCategories = () => {};
    let unsubLiveState = () => {};
    let unsubSessions = () => {};

    try {
      unsubPlayers = FirestoreSync.subscribePlayers((p) => {
        // Detect newly arrived registered player from Firestore
        if (prevPlayersRef.current && prevPlayersRef.current.length > 0) {
          const newlyAdded = p.filter((item) => !prevPlayersRef.current.some((old) => old.id === item.id));
          if (newlyAdded.length > 0) {
            const firstNew = newlyAdded[0];
            try {
              soundFx.playRegistrationChime();
            } catch {
              // audio context fallback
            }
            setRegistrationAlertPlayer(firstNew);
            const isPending = (firstNew.approvalStatus || 'APPROVED') === 'PENDING';
            notify({
              type: 'player_registered',
              title: isPending ? '🔔 নতুন প্লেয়ার রেজিস্ট্রেশন এসেছে!' : 'নতুন প্লেয়ার যুক্ত হয়েছে',
              message: `${firstNew.name} (${firstNew.position}) অনলাইনে রেজিস্ট্রেশন করেছেন। ID: ${firstNew.id}${isPending ? '। অনুগ্রহ করে এডমিন প্যানেল থেকে অনুমোদন করুন।' : ''}`,
            });
          }
        }
        prevPlayersRef.current = p;
        setPlayers((prev) => {
          const map = new Map<string, Player>();
          prev.forEach((player) => map.set(player.id, player));
          p.forEach((player) => map.set(player.id, player));
          const merged = Array.from(map.values());
          merged.sort((a, b) => {
            const aPending = (a.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
            const bPending = (b.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
            if (aPending !== bPending) return bPending - aPending;
            return a.id.localeCompare(b.id);
          });
          StorageService.savePlayersLocally(merged);
          return merged;
        });
      });
      unsubTeams = FirestoreSync.subscribeTeams((t) => {
        setTeams(t);
        StorageService.saveTeamsLocally(t);
        setIsFirebaseLoading(false);
      });
      unsubMatches = FirestoreSync.subscribeMatches((mList) => {
        setMatches(mList);
        StorageService.saveMatchesLocally(mList);
      });
      unsubPerformances = FirestoreSync.subscribePerformances((perfList) => {
        setPerformances(perfList);
        StorageService.savePerformancesLocally(perfList);
      });
      unsubSettings = FirestoreSync.subscribeSettings((s) => {
        if (s) {
          setSettings(s);
          StorageService.saveSettingsLocally(s);
        }
      });
      unsubHistory = FirestoreSync.subscribeHistory((h) => {
        setHistory(h || []);
        StorageService.saveHistoryLocally(h || []);
      });
      unsubNotifs = FirestoreSync.subscribeNotifications((n) => {
        if (n && n.length > 0) {
          setNotifications(n);
          StorageService.saveNotificationsLocally(n);
        }
      });
      unsubCategories = FirestoreSync.subscribeCategories((c) => {
        if (c && c.length > 0) {
          setCategories(c);
          StorageService.saveCategoriesLocally(c);
        }
      });
      unsubLiveState = FirestoreSync.subscribeLiveAuctionState((st) => {
        if (st) {
          setLiveAuctionState(st);
          StorageService.saveLiveStateLocally(st);
        }
      });
      unsubSessions = FirestoreSync.subscribeUserSessions((sList) => {
        if (prevSessionsRef.current && prevSessionsRef.current.length > 0) {
          const newlyAdded = sList.filter((item) => !prevSessionsRef.current.some((old) => old.id === item.id));
          if (newlyAdded.length > 0) {
            const firstNew = newlyAdded[0];
            try {
              soundFx.playRegistrationChime();
            } catch {}
            setLoginAlertSession(firstNew);
            notify({
              type: 'user_logged_in',
              title: '🔔 অন্য ডিভাইস থেকে লগইন হয়েছে!',
              message: `${firstNew.name} (${firstNew.role === 'admin' ? 'এডমিন' : firstNew.role === 'owner' ? 'টিম ওনার' : 'খেলোয়াড়'}) ${firstNew.deviceInfo || 'অন্য ডিভাইস'} থেকে সফলভাবে লগইন করেছেন।`,
            });
          }
        }
        prevSessionsRef.current = sList;
        setActiveSessions(sList);
      });
    } catch (e) {
      console.warn('Firestore subscription warning:', e);
      setIsFirebaseLoading(false);
    }

    // High-speed real-time server check every 3 seconds for instant multi-device sync
    const syncServerData = () => {
      FirestoreSync.fetchAllPlayersFromServer().then((fresh) => {
        if (fresh && fresh.length > 0) {
          if (prevPlayersRef.current && prevPlayersRef.current.length > 0) {
            const newlyAdded = fresh.filter((item) => !prevPlayersRef.current.some((old) => old.id === item.id));
            if (newlyAdded.length > 0) {
              const firstNew = newlyAdded[0];
              try {
                soundFx.playRegistrationChime();
              } catch {}
              setRegistrationAlertPlayer(firstNew);
            }
          }
          prevPlayersRef.current = fresh;
          setPlayers((prev) => {
            const map = new Map<string, Player>();
            prev.forEach((player) => map.set(player.id, player));
            fresh.forEach((player) => map.set(player.id, player));
            const merged = Array.from(map.values());
            merged.sort((a, b) => {
              const aPending = (a.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
              const bPending = (b.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
              if (aPending !== bPending) return bPending - aPending;
              return a.id.localeCompare(b.id);
            });
            StorageService.savePlayersLocally(merged);
            return merged;
          });
        }
      }).catch(() => {});

      FirestoreSync.fetchAllMatchesFromServer().then((freshMatches) => {
        if (freshMatches && freshMatches.length > 0) {
          setMatches(freshMatches);
          StorageService.saveMatchesLocally(freshMatches);
        }
      }).catch(() => {});

      FirestoreSync.fetchAllSessionsFromServer().then((freshSessions) => {
        if (freshSessions && freshSessions.length > 0) {
          if (prevSessionsRef.current && prevSessionsRef.current.length > 0) {
            const newlyAdded = freshSessions.filter((item) => !prevSessionsRef.current.some((old) => old.id === item.id));
            if (newlyAdded.length > 0) {
              const firstNew = newlyAdded[0];
              try {
                soundFx.playRegistrationChime();
              } catch {}
              setLoginAlertSession(firstNew);
            }
          }
          prevSessionsRef.current = freshSessions;
          setActiveSessions(freshSessions);
        }
      }).catch(() => {});

      FirestoreSync.fetchAllPerformancesFromServer().then((freshPerfs) => {
        if (freshPerfs && freshPerfs.length > 0) {
          setPerformances(freshPerfs);
          StorageService.savePerformancesLocally(freshPerfs);
        }
      }).catch(() => {});
    };

    window.addEventListener('focus', syncServerData);
    document.addEventListener('visibilitychange', syncServerData);
    const pollInterval = setInterval(syncServerData, 3000); // 3-second instant live check

    // Cross-tab fallback broadcast
    const unsubscribeBroadcast = StorageService.subscribeToBroadcast((event) => {
      if (event.type === 'PLAYERS_UPDATED') {
        const incoming = event.payload as Player[];
        setPlayers((prev) => {
          const map = new Map<string, Player>();
          prev.forEach((player) => map.set(player.id, player));
          incoming.forEach((player) => map.set(player.id, player));
          const merged = Array.from(map.values());
          merged.sort((a, b) => {
            const aPending = (a.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
            const bPending = (b.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
            if (aPending !== bPending) return bPending - aPending;
            return a.id.localeCompare(b.id);
          });
          return merged;
        });
      } else if (event.type === 'TEAMS_UPDATED') {
        setTeams(event.payload as Team[]);
      } else if (event.type === 'MATCHES_UPDATED') {
        setMatches(event.payload as Match[]);
      } else if (event.type === 'PERFORMANCES_UPDATED') {
        setPerformances(event.payload as PlayerMatchPerformance[]);
      } else if (event.type === 'SETTINGS_UPDATED') {
        setSettings(event.payload as AuctionSettings);
      } else if (event.type === 'HISTORY_UPDATED') {
        setHistory(event.payload as AuctionHistoryItem[]);
      } else if (event.type === 'NOTIFICATIONS_UPDATED') {
        setNotifications(event.payload as AuctionNotification[]);
      } else if (event.type === 'USER_UPDATED') {
        // Protect active admin from being logged out by guest/spectator tabs
        if (event.payload !== null) {
          setCurrentUser(event.payload as AppUser);
        }
      } else if (event.type === 'CATEGORIES_UPDATED') {
        setCategories(event.payload as PlayerCategory[]);
      } else if (event.type === 'LIVE_STATE_UPDATED') {
        setLiveAuctionState(event.payload as LiveAuctionState);
      }
    });

    return () => {
      clearTimeout(loadTimeout);
      clearInterval(pollInterval);
      window.removeEventListener('focus', syncServerData);
      document.removeEventListener('visibilitychange', syncServerData);
      unsubPlayers();
      unsubTeams();
      unsubMatches();
      unsubPerformances();
      unsubSettings();
      unsubHistory();
      unsubNotifs();
      unsubCategories();
      unsubLiveState();
      unsubSessions();
      unsubscribeBroadcast();
    };
  }, []);

  // Auto-dismiss registration alert toast after 14 seconds
  useEffect(() => {
    if (!registrationAlertPlayer) return;
    const timer = setTimeout(() => {
      setRegistrationAlertPlayer(null);
    }, 14000);
    return () => clearTimeout(timer);
  }, [registrationAlertPlayer]);

  // Auto-dismiss login alert toast after 14 seconds
  useEffect(() => {
    if (!loginAlertSession) return;
    const timer = setTimeout(() => {
      setLoginAlertSession(null);
    }, 14000);
    return () => clearTimeout(timer);
  }, [loginAlertSession]);

  // Compute team spending and squad counts dynamically
  const teamPurchases = useMemo(() => {
    const summary: Record<string, { totalSpent: number; count: number }> = {};
    teams.forEach((t) => {
      summary[t.id] = { totalSpent: 0, count: 0 };
    });

    players.forEach((p) => {
      if (p.teamId && p.status === 'sold' && p.soldPrice) {
        if (!summary[p.teamId]) {
          summary[p.teamId] = { totalSpent: 0, count: 0 };
        }
        summary[p.teamId].totalSpent += p.soldPrice;
        summary[p.teamId].count += 1;
      }
    });

    return summary;
  }, [players, teams]);

  const availableCount = useMemo(() => {
    return players.filter((p) => p.status === 'available').length;
  }, [players]);

  const pendingPlayers = useMemo(() => {
    return players.filter((p) => (p.approvalStatus || 'APPROVED') === 'PENDING');
  }, [players]);

  // Notify helper
  const notify = (notif: Omit<AuctionNotification, 'id' | 'timestamp'>) => {
    const newNotif = StorageService.addNotification(notif);
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // 1. Sold Player Handler
  const handleSold = (
    player: Player,
    winningTeam: Team,
    winningBid: number,
    bidSequence: BidRecord[]
  ) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return {
          ...p,
          status: 'sold' as const,
          teamId: winningTeam.id,
          soldPrice: winningBid,
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);

    const historyItem: AuctionHistoryItem = {
      id: `hist-${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      playerPhoto: player.photoUrl,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      teamId: winningTeam.id,
      teamName: winningTeam.name,
      winningBid,
      basePrice: player.basePrice,
      status: 'sold',
      actionBy: currentUser ? `${currentUser.name} (${currentUser.userId})` : 'এডমিন',
      timestamp: new Date().toISOString(),
      bidSequence: bidSequence.map((b) => ({
        id: b.id,
        teamId: b.teamId,
        teamName: b.teamName,
        amount: b.amount,
        timestamp: b.timestamp,
        placedByRole: b.placedByRole,
        placedByName: b.placedByName,
      })),
    };
    const updatedHistory = [historyItem, ...history];
    setHistory(updatedHistory);
    StorageService.saveHistory(updatedHistory);

    // Update live auction state in Firestore & storage
    // Sold finalization: Reservation cleared because selling price is now deducted permanently from final balance
    const updatedState: LiveAuctionState = {
      ...liveAuctionState,
      status: 'sold',
      isTimerRunning: false,
      activePlayerId: null,
      highestBidTeamId: winningTeam.id,
      highestBidTeamName: winningTeam.name,
      currentBid: winningBid,
      reservedAmount: 0,
      reservedTeamId: null,
      lastActionTimestamp: Date.now(),
    };
    setLiveAuctionState(updatedState);
    StorageService.saveLiveState(updatedState);

    notify({
      type: 'player_sold',
      title: 'প্লেয়ার বিক্রি সম্পন্ন (Player Sold)!',
      message: `${player.name} (${player.position}) ${winningBid.toLocaleString()} পয়েন্টে ${winningTeam.name}-এ বিক্রি হয়েছে।`,
    });
  };

  // 2. Unsold Player Handler
  const handleUnsold = (player: Player) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return {
          ...p,
          status: 'unsold' as const,
          teamId: null,
          soldPrice: null,
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);

    const historyItem: AuctionHistoryItem = {
      id: `hist-${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      playerPhoto: player.photoUrl,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      winningBid: 0,
      basePrice: player.basePrice,
      status: 'unsold',
      actionBy: currentUser ? `${currentUser.name} (${currentUser.userId})` : 'এডমিন',
      timestamp: new Date().toISOString(),
      bidSequence: [],
    };
    const updatedHistory = [historyItem, ...history];
    setHistory(updatedHistory);
    StorageService.saveHistory(updatedHistory);

    // Update live auction state - release any reservations
    const updatedState: LiveAuctionState = {
      ...liveAuctionState,
      status: 'unsold',
      isTimerRunning: false,
      activePlayerId: null,
      highestBidTeamId: null,
      highestBidTeamName: null,
      currentBid: 0,
      reservedAmount: 0,
      reservedTeamId: null,
      lastActionTimestamp: Date.now(),
    };
    setLiveAuctionState(updatedState);
    StorageService.saveLiveState(updatedState);

    notify({
      type: 'player_unsold',
      title: 'প্লেয়ার অবিক্রিত (Player Unsold)',
      message: `${player.name} (${player.position})-এর জন্য কোনো বৈধ বিড আসেনি।`,
    });
  };

  // 3. Select Random Player for Auction
  const handleSelectRandomPlayer = (includeUnsold = false) => {
    if (!isAdmin) {
      notify({
        type: 'settings_updated',
        title: 'অনুমতি নেই',
        message: 'শুধুমাত্র এডমিন পরবর্তী প্লেয়ারের নিলাম চালু করতে পারবেন।',
      });
      return;
    }

    const eligible = players.filter((p) => {
      const isApproved = (p.approvalStatus || 'APPROVED') === 'APPROVED';
      if (!isApproved) return false;
      if (p.status === 'available') return true;
      if (includeUnsold && p.status === 'unsold') return true;
      return false;
    });

    if (eligible.length === 0) {
      notify({
        type: 'settings_updated',
        title: 'কোনো প্লেয়ার পাওয়া যায়নি',
        message: 'নিলাম পুলে আর কোনো অনুমোদিত ও অবিক্রিত প্লেয়ার অবশিষ্ট নেই।',
      });
      return;
    }

    const picked = eligible[Math.floor(Math.random() * eligible.length)];
    const newState: LiveAuctionState = {
      activePlayerId: picked.id,
      currentBid: picked.basePrice,
      highestBidTeamId: null,
      highestBidTeamName: null,
      highestBidderName: null,
      bidSequence: [],
      timerSeconds: settings.timerSeconds,
      isTimerRunning: true,
      timerStartedAt: Date.now(),
      status: 'bidding',
      reservedAmount: 0,
      reservedTeamId: null,
      lastActionTimestamp: Date.now(),
    };

    setLiveAuctionState(newState);
    StorageService.saveLiveState(newState);

    const updatedPlayers = players.map((p) =>
      p.id === picked.id ? { ...p, status: 'live' as const } : p
    );
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);

    notify({
      type: 'auction_started',
      title: 'পরবর্তী র্যান্ডম প্লেয়ার নির্বাচিত!',
      message: `${picked.name} (${picked.position} - #${picked.jerseyNumber}) নিলামের জন্য নির্বাচিত হয়েছে।`,
    });
  };

  // 3b. Start Auction for a Specific Player
  const handleStartAuctionForPlayer = (player: Player) => {
    if (!isAdmin) {
      notify({
        type: 'settings_updated',
        title: 'অনুমতি নেই',
        message: 'শুধুমাত্র এডমিন নির্দিষ্ট প্লেয়ারের নিলাম চালু করতে পারবেন।',
      });
      return;
    }

    const isApproved = (player.approvalStatus || 'APPROVED') === 'APPROVED';
    if (!isApproved) {
      notify({
        type: 'settings_updated',
        title: 'অনুমোদন প্রয়োজন',
        message: 'এই প্লেয়ারটি এখনও অনুমোদিত হয়নি।',
      });
      return;
    }

    const newState: LiveAuctionState = {
      activePlayerId: player.id,
      currentBid: player.basePrice,
      highestBidTeamId: null,
      highestBidTeamName: null,
      highestBidderName: null,
      bidSequence: [],
      timerSeconds: settings.timerSeconds,
      isTimerRunning: true,
      timerStartedAt: Date.now(),
      status: 'bidding',
      reservedAmount: 0,
      reservedTeamId: null,
      lastActionTimestamp: Date.now(),
    };

    setLiveAuctionState(newState);
    StorageService.saveLiveState(newState);

    const updatedPlayers = players.map((p) =>
      p.id === player.id ? { ...p, status: 'live' as const } : p
    );
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);

    setActiveTab('live');
    notify({
      type: 'auction_started',
      title: 'প্লেয়ারের লাইভ নিলাম শুরু!',
      message: `${player.name} (${player.position}) - বেস প্রাইজ ${player.basePrice.toLocaleString()} pt-এ নিলাম শুরু হয়েছে।`,
    });
  };

  // 4. Atomic Bidding Handler with Timer 0 Lock and Reservation Check
  const handlePlaceBidAtomic = async (
    team: Team,
    bidAmount: number,
    increment: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'অনুগ্রহ করে লগইন করুন' };
    const currentP = players.find((p) => p.id === liveAuctionState.activePlayerId);
    if (!currentP) return { success: false, error: 'বর্তমান কোনো প্লেয়ারের নিলাম চলছে না' };

    // Squad limit check (7 auction players max)
    const squadCount = teamPurchases[team.id]?.count || 0;
    const maxSquad = settings.squadLimit || 7;
    if (squadCount >= maxSquad) {
      return {
        success: false,
        error: `${team.name}-এর স্কোয়াড পূর্ণ (${squadCount}/${maxSquad} জন)! নতুন প্লেয়ার কেনা যাবে না।`,
      };
    }

    // Budget check: Net available budget = initialBudget - totalSpent
    const spent = teamPurchases[team.id]?.totalSpent || 0;
    const remaining = (team.initialBudget || 10000) - spent;
    if (bidAmount > remaining) {
      return {
        success: false,
        error: `${team.name}-এর অবশিষ্ট বাজেট (${remaining.toLocaleString()} pt) ডাকের চেয়ে কম!`,
      };
    }

    const res = await FirestoreSync.placeBidAtomic(
      team,
      bidAmount,
      currentUser,
      currentP,
      settings.timerSeconds
    );

    if (res.success && res.updatedState) {
      setLiveAuctionState(res.updatedState);
      StorageService.saveLiveStateLocally(res.updatedState);
      notify({
        type: 'bid_placed',
        title: 'নতুন ডাক (New Bid)!',
        message: `${team.name} ${currentP.name}-এর জন্য ${bidAmount.toLocaleString()} পয়েন্টের ডাক দিয়েছে। সাময়িকভাবে ব্যালেন্স রিজার্ভ করা হয়েছে।`,
      });
    }

    return res;
  };

  // 5. Undo Last Bid
  const handleUndoLastBid = () => {
    if (!isAdmin) return;
    const seq = liveAuctionState.bidSequence || [];
    if (seq.length === 0) return;

    const remainingSeq = seq.slice(1);
    const activeP = players.find((p) => p.id === liveAuctionState.activePlayerId);

    let updatedBid = activeP ? activeP.basePrice : settings.defaultBasePrice;
    let updatedTeamId: string | null = null;
    let updatedTeamName: string | null = null;
    let updatedReservedAmount = 0;

    if (remainingSeq.length > 0) {
      const prev = remainingSeq[0];
      updatedBid = prev.amount;
      updatedTeamId = prev.teamId;
      updatedTeamName = prev.teamName;
      updatedReservedAmount = prev.amount;
    }

    const updatedState: LiveAuctionState = {
      ...liveAuctionState,
      currentBid: updatedBid,
      highestBidTeamId: updatedTeamId,
      highestBidTeamName: updatedTeamName,
      bidSequence: remainingSeq,
      reservedAmount: updatedReservedAmount,
      reservedTeamId: updatedTeamId,
      lastActionTimestamp: Date.now(),
    };

    setLiveAuctionState(updatedState);
    StorageService.saveLiveState(updatedState);
    notify({
      type: 'settings_updated',
      title: 'সর্বশেষ বিড প্রত্যাহার (Bid Undone)',
      message: 'সর্বশেষ বিড বাতিল করা হয়েছে এবং দলের রিজার্ভকৃত ব্যালেন্স ফেরত দেওয়া হয়েছে।',
    });
  };

  // 6. Pause / Resume Timer
  const handlePauseResumeTimer = (running: boolean) => {
    if (!isAdmin) return;
    const updatedState: LiveAuctionState = {
      ...liveAuctionState,
      isTimerRunning: running,
      timerStartedAt: running ? Date.now() : liveAuctionState.timerStartedAt,
      lastActionTimestamp: Date.now(),
    };
    setLiveAuctionState(updatedState);
    StorageService.saveLiveState(updatedState);
  };

  // 7. Reset Timer
  const handleResetTimer = () => {
    if (!isAdmin) return;
    const updatedState: LiveAuctionState = {
      ...liveAuctionState,
      timerSeconds: settings.timerSeconds,
      timerStartedAt: Date.now(),
      lastActionTimestamp: Date.now(),
    };
    setLiveAuctionState(updatedState);
    StorageService.saveLiveState(updatedState);
  };

  // 8. Player Approval & Rejection Handlers (Synced with Firebase)
  const handleApprovePlayer = (player: Player) => {
    if (!isAdmin) return;
    const updated = players.map((p) =>
      p.id === player.id
        ? { ...p, approvalStatus: 'APPROVED' as const, status: 'available' as const }
        : p
    );
    setPlayers(updated);
    StorageService.savePlayers(updated);
    FirestoreSync.updatePlayerApproval(player.id, 'APPROVED').catch(() => {});
    notify({
      type: 'settings_updated',
      title: 'প্লেয়ার অনুমোদিত (Approved)',
      message: `${player.name} (${player.position})-এর আবেদন অনুমোদিত হয়েছে। তিনি নিলাম পুলে অন্তর্ভুক্ত হয়েছেন।`,
    });
  };

  const handleRejectPlayer = (player: Player) => {
    if (!isAdmin) return;
    const updated = players.map((p) =>
      p.id === player.id ? { ...p, approvalStatus: 'REJECTED' as const } : p
    );
    setPlayers(updated);
    StorageService.savePlayers(updated);
    FirestoreSync.updatePlayerApproval(player.id, 'REJECTED').catch(() => {});
    notify({
      type: 'settings_updated',
      title: 'প্লেয়ার বাতিল (Rejected)',
      message: `${player.name}-এর রেজিস্ট্রেশন বাতিল করা হয়েছে।`,
    });
  };

  // 9. Categories Save Handler (Iconic, Category A, Category B Base Prices)
  const handleSaveCategories = (updatedCats: PlayerCategory[]) => {
    if (!isAdmin) return;
    setCategories(updatedCats);
    StorageService.saveCategories(updatedCats);
    FirestoreSync.saveAllCategories(updatedCats).catch(() => {});
    notify({
      type: 'settings_updated',
      title: 'ক্যাটাগরি বেস প্রাইজ সংরক্ষিত!',
      message: 'Iconic, Category A, Category B সহ সকল ক্যাটাগরির বেস প্রাইজ Firebase-এ স্থায়ীভাবে সংরক্ষিত হয়েছে।',
    });
  };

  // 10. Save/Edit Player Handler (Admin manual entry)
  const handleSavePlayer = async (player: Player) => {
    let updated: Player[];
    const isEdit = players.some((p) => p.id === player.id);
    if (isEdit) {
      updated = players.map((p) => (p.id === player.id ? player : p));
      notify({
        type: 'settings_updated',
        title: 'প্লেয়ার তথ্য আপডেট সম্পন্ন',
        message: `${player.name}-এর তথ্য Firebase-এ সফলভাবে হালনাগাদ করা হয়েছে।`,
      });
    } else {
      updated = [player, ...players];
      notify({
        type: 'settings_updated',
        title: 'নতুন প্লেয়ার যোগ হয়েছে',
        message: `${player.name} (${player.position}) সফলভাবে Firebase-এ যুক্ত হয়েছে।`,
      });
    }
    setPlayers(updated);
    StorageService.savePlayers(updated);
    try {
      await FirestoreSync.savePlayer(player);
    } catch (e) {
      console.warn('Firestore player save fallback:', e);
    }
  };

  // 11. Player Self-Registration Handler (Direct Firebase Database Save)
  const handleRegisterPlayer = async (player: Player): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Direct save into Firebase Firestore first to guarantee persistence
      await FirestoreSync.registerPlayer(player);

      // 2. Update local state and cache
      const updated = [player, ...players.filter((p) => p.id !== player.id)];
      setPlayers(updated);
      StorageService.savePlayersLocally(updated);

      notify({
        type: 'player_registered',
        title: 'নতুন প্লেয়ার অনলাইন রেজিস্ট্রেশন',
        message: `${player.name} (${player.position}) সফলভাবে Firebase-এ সংরক্ষিত ও নিবন্ধিত হয়েছে।`,
      });

      return { success: true };
    } catch (err) {
      console.error('Registration save error:', err);
      const errMsg = err instanceof Error ? err.message : 'Firebase সেভ ব্যর্থ হয়েছে';
      return { success: false, error: errMsg };
    }
  };

  // 12. Player Self-Profile Update Handler
  const handleUpdatePlayerProfile = async (player: Player): Promise<{ success: boolean; error?: string }> => {
    try {
      await FirestoreSync.savePlayer(player);
      const updated = players.map((p) => (p.id === player.id ? player : p));
      setPlayers(updated);
      StorageService.savePlayersLocally(updated);
      notify({
        type: 'profile_updated',
        title: 'প্লেয়ার প্রোফাইল আপডেট',
        message: `${player.name} নিজের প্রোফাইল তথ্য Firebase-এ আপডেট করেছে।`,
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Firebase update error' };
    }
  };

  // Manual on-demand refresh directly from Firebase Firestore server
  const handleRefreshFromFirebase = async () => {
    try {
      const [serverPlayers, serverPerfs] = await Promise.all([
        FirestoreSync.fetchAllPlayersFromServer(),
        FirestoreSync.fetchAllPerformancesFromServer(),
      ]);
      if (serverPlayers && serverPlayers.length > 0) {
        setPlayers(serverPlayers);
        StorageService.savePlayersLocally(serverPlayers);
      }
      if (serverPerfs && serverPerfs.length > 0) {
        setPerformances(serverPerfs);
        StorageService.savePerformancesLocally(serverPerfs);
      }
      notify({
        type: 'settings_updated',
        title: 'Firebase ডাটা রিফ্রেশ সম্পন্ন',
        message: `Firebase থেকে সর্বশেষ প্লেয়ার ও ম্যাচ পারফরম্যান্স ডাটা সিঙ্ক হয়েছে।`,
      });
    } catch (e) {
      console.warn('Manual refresh error', e);
      notify({
        type: 'settings_updated',
        title: 'রিফ্রেশ সতর্কতা',
        message: 'Firebase থেকে ডাটা ফেচ করতে সমস্যা হয়েছে। সংযোগ চেক করুন।',
      });
    }
  };

  // 13. Delete Player Handler
  const handleDeletePlayer = async (playerId: string) => {
    if (!isAdmin) return;
    const target = players.find((p) => p.id === playerId);
    if (!target) return;
    if (window.confirm(`আপনি কি নিশ্চিত যে ${target.name}-কে তালিকা থেকে মুছে ফেলতে চান?`)) {
      const updated = players.filter((p) => p.id !== playerId);
      setPlayers(updated);
      StorageService.savePlayers(updated);
      try {
        await FirestoreSync.deletePlayer(playerId);
      } catch (e) {
        console.warn('Firestore player delete warning:', e);
      }
      notify({
        type: 'settings_updated',
        title: 'প্লেয়ার অপসারণ',
        message: `${target.name}-কে তালিকা ও Firebase থেকে মুছে ফেলা হয়েছে।`,
      });
    }
  };

  // 14. Save / Edit Team Handler (Permanently saved in Firebase Firestore)
  const handleSaveTeam = async (team: Team) => {
    let updated: Team[];
    const isEdit = teams.some((t) => t.id === team.id);
    if (isEdit) {
      updated = teams.map((t) => (t.id === team.id ? team : t));
      notify({
        type: 'settings_updated',
        title: 'দলের তথ্য আপডেট সম্পন্ন',
        message: `${team.name}-এর তথ্য Firebase-এ সফলভাবে হালনাগাদ হয়েছে।`,
      });
    } else {
      const exists = teams.some((t) => t.name.trim().toLowerCase() === team.name.trim().toLowerCase());
      if (exists) {
        notify({
          type: 'settings_updated',
          title: 'দল ইতোমধ্যে বিদ্যমান',
          message: `${team.name} নামের দল ইতোমধ্যে রয়েছে। ভিন্ন নাম ব্যবহার করুন।`,
        });
        return;
      }
      updated = [...teams, team];
      notify({
        type: 'settings_updated',
        title: 'নতুন দল যোগ হয়েছে',
        message: `${team.name} Firebase-এ স্থায়ীভাবে যুক্ত হয়েছে।`,
      });
    }
    setTeams(updated);
    StorageService.saveTeams(updated);
    try {
      await FirestoreSync.saveTeam(team);
    } catch (e) {
      console.warn('Firestore saveTeam warning:', e);
    }
  };

  // 15. Owner Update Team & Credentials Handler
  const handleOwnerUpdateTeam = (updatedTeam: Team) => {
    const updatedTeams = teams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t));
    setTeams(updatedTeams);
    StorageService.saveTeams(updatedTeams);
    FirestoreSync.saveTeam(updatedTeam).catch(() => {});

    notify({
      type: 'settings_updated',
      title: 'দলের তথ্য ও ওনার প্রোফাইল আপডেট',
      message: `${updatedTeam.name}-এর নাম/লোগো এবং ওনার সেটিংস হালনাগাদ হয়েছে।`,
    });
  };

  const handleOwnerCredentialsUpdated = (newUserId: string) => {
    if (currentUser) {
      const updatedUser: AppUser = {
        ...currentUser,
        userId: newUserId,
        name: newUserId,
      };
      setCurrentUser(updatedUser);
      StorageService.setCurrentUser(updatedUser);
    }
  };

  // 16. Delete Team Handler
  const handleDeleteTeam = async (teamId: string) => {
    if (!isAdmin) return;
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${target.name}" দলটি মুছে ফেলতে চান?`)) return;

    const updated = teams.filter((t) => t.id !== teamId);
    setTeams(updated);
    StorageService.saveTeams(updated);
    try {
      await FirestoreSync.deleteTeam(teamId);
    } catch (e) {
      console.warn('Firestore deleteTeam warning:', e);
    }

    const updatedPlayers = players.map((p) =>
      p.teamId === teamId ? { ...p, teamId: null, status: 'available' as const, soldPrice: null } : p
    );
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);

    notify({
      type: 'settings_updated',
      title: 'দল মুছে ফেলা হয়েছে',
      message: `${target.name} দলটি Firebase থেকে সফলভাবে মুছে ফেলা হয়েছে।`,
    });
  };

  // 17. Match Results, Fixtures & Score Handlers (Auto-calculates standings & player stats)
  const handleSaveMatch = async (matchToSave: Match) => {
    try {
      const existingIndex = matches.findIndex((m) => m.id === matchToSave.id);
      let updated: Match[];
      if (existingIndex >= 0) {
        updated = matches.map((m) => (m.id === matchToSave.id ? matchToSave : m));
      } else {
        updated = [matchToSave, ...matches];
      }
      setMatches(updated);
      StorageService.saveMatches(updated);
      await FirestoreSync.saveMatch(matchToSave);

      notify({
        type: 'settings_updated',
        title: 'ম্যাচ রেজাল্ট ও স্কোর সংরক্ষিত',
        message: `${matchToSave.homeTeamName} বনাম ${matchToSave.awayTeamName} ম্যাচের ফলাফল সফলভাবে Firebase-এ সংরক্ষিত ও লিগ টেবিলে হালনাগাদ হয়েছে।`,
      });
    } catch (err) {
      console.error('Error saving match:', err);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!isAdmin) return;
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ম্যাচটি মুছে ফেলতে চান?')) return;
    try {
      const updated = matches.filter((m) => m.id !== matchId);
      setMatches(updated);
      StorageService.saveMatches(updated);
      await FirestoreSync.deleteMatch(matchId);

      notify({
        type: 'settings_updated',
        title: 'ম্যাচ মুছে ফেলা হয়েছে',
        message: 'ম্যাচটি সফলভাবে তালিকা ও Firebase থেকে মুছে ফেলা হয়েছে।',
      });
    } catch (err) {
      console.error('Error deleting match:', err);
    }
  };

  const handleOpenAddMatch = () => {
    setSelectedMatch(null);
    setIsMatchModalOpen(true);
  };

  const handleOpenEditMatch = (m: Match) => {
    setSelectedMatch(m);
    setIsMatchModalOpen(true);
  };

  // 17. Individual Player Match Performance Sheet Handlers (Admin Only for Edit/Delete)
  const handleOpenAddPerformance = (defaultPlayerId?: string) => {
    if (!isAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }
    setEditingPerformance(null);
    setDefaultPerformancePlayerId(defaultPlayerId || null);
    setIsPerformanceModalOpen(true);
  };

  const handleOpenEditPerformance = (perf: PlayerMatchPerformance) => {
    if (!isAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }
    setEditingPerformance(perf);
    setDefaultPerformancePlayerId(perf.playerId);
    setIsPerformanceModalOpen(true);
  };

  const handleSavePerformance = async (perf: PlayerMatchPerformance) => {
    if (!isAdmin) return;
    try {
      const idx = performances.findIndex((p) => p.id === perf.id);
      let updated: PlayerMatchPerformance[];
      if (idx >= 0) {
        updated = performances.map((p) => (p.id === perf.id ? perf : p));
      } else {
        updated = [perf, ...performances];
      }
      setPerformances(updated);
      StorageService.savePerformances(updated);
      await FirestoreSync.savePerformance(perf);

      setIsPerformanceModalOpen(false);
      setEditingPerformance(null);
      setDefaultPerformancePlayerId(null);

      notify({
        type: 'settings_updated',
        title: 'পারফরম্যান্স শিট সংরক্ষিত হয়েছে!',
        message: `${perf.playerName}-এর জন্য ${perf.matchTitle} ম্যাচের পারফরম্যান্স Firebase-এ সফলভাবে সেভ করা হয়েছে।`,
      });
    } catch (err) {
      console.error('Error saving performance:', err);
    }
  };

  const handleDeletePerformance = async (perfId: string) => {
    if (!isAdmin) return;
    try {
      const updated = performances.filter((p) => p.id !== perfId);
      setPerformances(updated);
      StorageService.savePerformances(updated);
      await FirestoreSync.deletePerformance(perfId);

      setIsPerformanceModalOpen(false);
      setEditingPerformance(null);

      notify({
        type: 'settings_updated',
        title: 'পারফরম্যান্স রেকর্ড ডিলিট করা হয়েছে',
        message: 'রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।',
      });
    } catch (err) {
      console.error('Error deleting performance:', err);
    }
  };

  // 18. Release Player from Team Handler
  const handleReleasePlayer = (player: Player) => {
    if (!isAdmin) return;
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return {
          ...p,
          status: 'available' as const,
          teamId: null,
          soldPrice: null,
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);
    notify({
      type: 'settings_updated',
      title: 'প্লেয়ার রিলিজ ও বাজেট রিফান্ড',
      message: `${player.name}-কে অবমুক্ত করা হয়েছে এবং দলের বাজেট সমন্বয় হয়েছে।`,
    });
  };

  // 18. Revert / Correct History Handler
  const handleRevertOrCorrectHistory = (
    historyItem: AuctionHistoryItem,
    newStatus: 'sold' | 'unsold' | 'cancelled',
    newTeamId?: string | null,
    newPrice?: number
  ) => {
    if (!isAdmin) return;
    const updatedPlayers = players.map((p) => {
      if (p.id === historyItem.playerId) {
        if (newStatus === 'sold') {
          return {
            ...p,
            status: 'sold' as const,
            teamId: newTeamId || null,
            soldPrice: newPrice || p.basePrice,
          };
        } else if (newStatus === 'unsold') {
          return {
            ...p,
            status: 'unsold' as const,
            teamId: null,
            soldPrice: null,
          };
        } else {
          return {
            ...p,
            status: 'available' as const,
            teamId: null,
            soldPrice: null,
          };
        }
      }
      return p;
    });
    setPlayers(updatedPlayers);
    StorageService.savePlayers(updatedPlayers);

    const updatedHistory = history.map((h) => {
      if (h.id === historyItem.id) {
        const teamObj = teams.find((t) => t.id === newTeamId);
        return {
          ...h,
          status: newStatus,
          teamId: newTeamId,
          teamName: teamObj?.name || null,
          winningBid: newStatus === 'sold' ? newPrice || 0 : 0,
          editNote: 'Admin দ্বারা সংশোধিত',
          previousRecord: {
            teamId: h.teamId,
            winningBid: h.winningBid,
            status: h.status,
            editedAt: new Date().toISOString(),
          },
        };
      }
      return h;
    });
    setHistory(updatedHistory);
    StorageService.saveHistory(updatedHistory);

    notify({
      type: 'settings_updated',
      title: 'রেকর্ড সংশোধন সম্পন্ন',
      message: `${historyItem.playerName}-এর ইতিহাস রেকর্ড সফলভাবে সংশোধন করা হয়েছে।`,
    });
  };

  // 19. Update Settings Handler (Admin Only)
  const handleUpdateSettings = (newSettings: AuctionSettings) => {
    if (!isAdmin) {
      notify({
        type: 'settings_updated',
        title: 'অনুমতি নেই',
        message: 'শুধুমাত্র এডমিন সেটিংস পরিবর্তন করতে পারেন।',
      });
      return;
    }
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    notify({
      type: 'settings_updated',
      title: 'নিয়মাবলী সংরক্ষিত',
      message: 'টুর্নামেন্টের নতুন নিয়মাবলী ও সেটিংস সফলভাবে আপডেট হয়েছে।',
    });
  };

  // 20. Wipe All to Zero (Admin Only)
  const handleWipeAllToZero = () => {
    if (!isAdmin) return;
    StorageService.clearAllDataToZero();
    setPlayers([]);
    setTeams([]);
    setHistory([]);
    setSettings(StorageService.getSettings());
    setNotifications(StorageService.getNotifications());
    if (settings.soundEnabled) soundFx.playWhistle();
  };

  // 21. Reset Auction Progress (Admin Only)
  const handleResetAuctionProgress = () => {
    if (!isAdmin) return;
    const resetPlayers = StorageService.resetAuctionProgress();
    setPlayers(resetPlayers);
    setHistory([]);
    setNotifications(StorageService.getNotifications());
    if (settings.soundEnabled) soundFx.playWhistle();
  };

  // Sound toggle
  const handleToggleSound = () => {
    const newVal = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: newVal };
    setSettings(updated);
    StorageService.saveSettings(updated);
    soundFx.enabled = newVal;
    if (newVal) soundFx.playBidChime();
  };

  const liveSpotlightPlayer = useMemo(() => {
    return players.find((p) => p.status === 'live') || players.find((p) => p.status === 'available') || null;
  }, [players]);

  return (
    <div className="min-h-screen bg-[#030d08] bg-pitch-pattern text-slate-100 flex flex-col font-bn selection:bg-emerald-500 selection:text-black">
      {/* 2-Second Auto-Dismissing Pop-up Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={(id) => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }}
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
        currentUser={currentUser}
        teams={teams}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        availableCount={availableCount}
        pendingRegistrationsCount={pendingPlayers.length}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onOpenOwnerPortal={() => setIsOwnerSettingsOpen(true)}
        onOpenAdminCredentials={() => setIsAdminCredentialsOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Real-time Floating Player Registration Alert Toast */}
      {registrationAlertPlayer && (
        <div className="fixed top-20 right-4 z-50 max-w-sm sm:max-w-md w-full bg-[#071d12] border-2 border-emerald-400 rounded-2xl p-4 shadow-2xl shadow-black/80 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <Bell className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-black text-white font-sport tracking-wide">
                🔔 নতুন প্লেয়ার রেজিস্ট্রেশন এসেছে!
              </h4>
            </div>
            <button
              onClick={() => setRegistrationAlertPlayer(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <img
              src={getSafePlayerPhoto(registrationAlertPlayer.photoUrl)}
              alt={registrationAlertPlayer.name}
              className="w-12 h-14 rounded-xl object-cover object-top border border-emerald-500/40 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate">{registrationAlertPlayer.name}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {registrationAlertPlayer.position}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                ID: <span className="text-emerald-400 font-bold">{registrationAlertPlayer.id}</span> • #{registrationAlertPlayer.jerseyNumber}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                মোবাইল: <span className="font-mono text-slate-300">{registrationAlertPlayer.mobile || '—'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 mt-1 border-t border-emerald-500/10">
            <button
              onClick={() => {
                setSelectedPlayerProfile(registrationAlertPlayer);
                setRegistrationAlertPlayer(null);
                setActiveTab('players');
              }}
              className="py-1 px-3 rounded-xl bg-black/60 hover:bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer"
            >
              প্রোফাইল দেখুন
            </button>

            {isAdmin && (registrationAlertPlayer.approvalStatus || 'APPROVED') === 'PENDING' && (
              <button
                onClick={() => {
                  handleApprovePlayer(registrationAlertPlayer);
                  setRegistrationAlertPlayer(null);
                }}
                className="py-1 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sport flex items-center gap-1 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>অনুমোদন করুন (Approve)</span>
              </button>
            )}

            {!isAdmin && (
              <button
                onClick={() => {
                  setIsAdminLoginOpen(true);
                  setRegistrationAlertPlayer(null);
                }}
                className="py-1 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-sport cursor-pointer shadow-md"
              >
                এডমিন লগইন (5890)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Real-time Multi-Device Login Alert Toast */}
      {loginAlertSession && (
        <div className="fixed top-24 left-4 z-50 max-w-sm sm:max-w-md w-full bg-[#031911] border-2 border-cyan-400 rounded-2xl p-4 shadow-2xl shadow-black/80 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <Bell className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-black text-white font-sport tracking-wide">
                🔔 অন্য ডিভাইস থেকে লগইন হয়েছে!
              </h4>
            </div>
            <button
              onClick={() => setLoginAlertSession(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-cyan-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{loginAlertSession.name}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  loginAlertSession.role === 'admin'
                    ? 'bg-amber-500 text-black'
                    : loginAlertSession.role === 'owner'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {loginAlertSession.role === 'admin'
                  ? 'এডমিন (Admin)'
                  : loginAlertSession.role === 'owner'
                  ? 'দল মালিক (Owner)'
                  : 'খেলোয়াড় (Player)'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              ডিভাইস: <strong className="text-cyan-300">{loginAlertSession.deviceInfo || 'ওয়েব ব্রাউজার'}</strong>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              User ID: <span className="text-emerald-400">{loginAlertSession.userId}</span> • {new Date(loginAlertSession.loginTime).toLocaleTimeString('bn-BD')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 mt-1 border-t border-cyan-500/10">
            {isAdmin && (
              <button
                onClick={() => {
                  setActiveTab('players');
                  setLoginAlertSession(null);
                }}
                className="py-1 px-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-sport cursor-pointer shadow-md"
              >
                সেশন মনিটরে দেখুন
              </button>
            )}
            <button
              onClick={() => setLoginAlertSession(null)}
              className="py-1 px-3 rounded-xl bg-black/60 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Global Top Pending Registrations Banner */}
      {pendingPlayers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950 via-[#181002] to-amber-950 border-b border-amber-500/40 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold">
                অনলাইন রেজিস্ট্রেশন আপডেট: <strong className="text-white font-mono">{pendingPlayers.length}</strong> জন প্লেয়ারের আবেদন এডমিন অনুমোদনের অপেক্ষায় রয়েছে!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('players')}
                className="py-1 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold font-sport flex items-center gap-1 cursor-pointer shadow transition-all"
              >
                <span>আবেদন দেখুন ও অনুমোদন করুন</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              {!isAdmin && (
                <button
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="py-1 px-2.5 rounded-lg bg-black/60 hover:bg-black/80 border border-amber-500/40 text-amber-300 text-[11px] font-semibold cursor-pointer"
                >
                  এডমিন লগইন (PIN: 5890)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <ClubHomepage
            teams={teams}
            players={players}
            matches={matches}
            standings={standings}
            topScorers={topScorers}
            topAssists={topAssists}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesView
            matches={matches}
            teams={teams}
            players={players}
            isAdmin={isAdmin}
            onAddMatchClick={handleOpenAddMatch}
            onEditMatchClick={handleOpenEditMatch}
            onDeleteMatchClick={handleDeleteMatch}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
        )}

        {activeTab === 'table' && (
          <LeagueTableView
            standings={standings}
            teams={teams}
            seasonYear={settings.seasonYear}
            tournamentName={settings.tournamentName}
          />
        )}

        {activeTab === 'stats' && (
          <PlayerStatsView
            topScorers={topScorers}
            topAssists={topAssists}
            teams={teams}
            tournamentAwards={tournamentAwards}
            performances={performances}
            players={players}
            isAdmin={isAdmin}
            onViewPlayerProfile={(p) => setSelectedPlayerProfile(p)}
            onAddPerformance={handleOpenAddPerformance}
          />
        )}

        {activeTab === 'admin-club' && isAdmin && (
          <AdminClubPanel
            matches={matches}
            teams={teams}
            players={players}
            activeSessions={activeSessions}
            settings={settings}
            categories={categories}
            currentUser={currentUser}
            performances={performances}
            onAddPerformance={handleOpenAddPerformance}
            onEditPerformance={handleOpenEditPerformance}
            onDeletePerformance={handleDeletePerformance}
            onViewPlayerProfile={(p) => setSelectedPlayerProfile(p)}
            onAddMatch={handleOpenAddMatch}
            onEditMatch={handleOpenEditMatch}
            onDeleteMatch={handleDeleteMatch}
            onAddTeam={() => {
              setEditingTeam(null);
              setIsTeamFormOpen(true);
            }}
            onEditTeam={(t) => {
              setEditingTeam(t);
              setIsTeamFormOpen(true);
            }}
            onDeleteTeam={handleDeleteTeam}
            onAddPlayer={() => {
              setEditingPlayer(null);
              setIsPlayerFormOpen(true);
            }}
            onEditPlayer={(p) => {
              setEditingPlayer(p);
              setIsPlayerFormOpen(true);
            }}
            onDeletePlayer={handleDeletePlayer}
            onApprovePlayer={handleApprovePlayer}
            onRejectPlayer={handleRejectPlayer}
            onOpenSettings={() => setIsEditSettingsOpen(true)}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onRefreshData={handleRefreshFromFirebase}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            players={players}
            teams={teams}
            settings={settings}
            history={history}
            notifications={notifications}
            teamPurchases={teamPurchases}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onViewProfile={(p) => setSelectedPlayerProfile(p)}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onOpenEditSettingsModal={() => setIsEditSettingsOpen(true)}
            onAddPlayerClick={() => {
              setEditingPlayer(null);
              setIsPlayerFormOpen(true);
            }}
            onAddTeamClick={() => {
              setEditingTeam(null);
              setIsTeamFormOpen(true);
            }}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onOpenAdminCredentials={() => setIsAdminCredentialsOpen(true)}
            onOpenOwnerPortal={() => setIsOwnerSettingsOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            liveAuctionState={liveAuctionState}
            isLoading={isFirebaseLoading}
          />
        )}

        {activeTab === 'live' && (
          <LiveAuction
            players={players}
            teams={teams}
            settings={settings}
            categories={categories}
            liveAuctionState={liveAuctionState}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onSelectRandomPlayer={handleSelectRandomPlayer}
            onPlaceBidAtomic={handlePlaceBidAtomic}
            onSold={handleSold}
            onUnsold={handleUnsold}
            onUndoLastBid={handleUndoLastBid}
            onPauseResumeTimer={handlePauseResumeTimer}
            onResetTimer={handleResetTimer}
            onViewProfile={(p) => setSelectedPlayerProfile(p)}
            onOpenProjector={() => setIsProjectorOpen(true)}
            teamPurchases={teamPurchases}
          />
        )}

        {activeTab === 'players' && (
          <PlayerManagement
            players={players}
            teams={teams}
            categories={categories}
            isAdmin={isAdmin}
            onAddPlayerClick={() => {
              setEditingPlayer(null);
              setIsPlayerFormOpen(true);
            }}
            onEditPlayer={(p) => {
              setEditingPlayer(p);
              setIsPlayerFormOpen(true);
            }}
            onDeletePlayer={handleDeletePlayer}
            onViewProfile={(p) => setSelectedPlayerProfile(p)}
            onAuctionSelect={(p) => handleStartAuctionForPlayer(p)}
            onOpenPlayerRegistration={() => {
              setActiveTab('player-register');
            }}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onApprovePlayer={handleApprovePlayer}
            onRejectPlayer={handleRejectPlayer}
            onRefreshFromFirebase={handleRefreshFromFirebase}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            activeSessions={activeSessions}
            initialSubTab={pendingPlayers.length > 0 && isAdmin ? 'registrations' : 'roster'}
          />
        )}

        {activeTab === 'player-register' && (
          <PlayerRegistrationView
            players={players}
            defaultBasePrice={settings.defaultBasePrice}
            onRegisterPlayer={handleRegisterPlayer}
            onUpdatePlayerProfile={handleUpdatePlayerProfile}
            onWatchLiveAuction={() => setActiveTab('live')}
          />
        )}

        {activeTab === 'teams' && (
          <TeamManagement
            teams={teams}
            players={players}
            settings={settings}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onAddTeamClick={() => {
              setEditingTeam(null);
              setIsTeamFormOpen(true);
            }}
            onEditTeamClick={(t) => {
              setEditingTeam(t);
              setIsTeamFormOpen(true);
            }}
            onDeleteTeam={handleDeleteTeam}
            onReleasePlayer={handleReleasePlayer}
            onViewProfile={(p) => setSelectedPlayerProfile(p)}
            onOpenOwnerPortal={() => setIsOwnerSettingsOpen(true)}
            teamPurchases={teamPurchases}
            liveAuctionState={liveAuctionState}
            isLoading={isFirebaseLoading}
          />
        )}

        {activeTab === 'history' && (
          <AuctionHistory
            history={history}
            teams={teams}
            isAdmin={isAdmin}
            onRevertOrCorrectHistory={handleRevertOrCorrectHistory}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            players={players}
            teams={teams}
            settings={settings}
            history={history}
            teamPurchases={teamPurchases}
          />
        )}

        {activeTab === 'settings' && isAdmin && (
          <Settings
            settings={settings}
            categories={categories}
            isAdmin={isAdmin}
            teamsCount={teams.length}
            onUpdateSettings={handleUpdateSettings}
            onSaveCategories={handleSaveCategories}
            onWipeAllToZero={handleWipeAllToZero}
            onResetAuctionProgress={handleResetAuctionProgress}
            onOpenEditModal={() => setIsEditSettingsOpen(true)}
            onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
            onOpenAdminCredentials={() => setIsAdminCredentialsOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-950/80 bg-black/60 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <p className="font-sport text-slate-300">
              MR FOOTBALL AUCTION &copy; {settings.seasonYear} • {settings.tournamentName} •{' '}
              <a
                href="https://bmftauction.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-mono font-bold underline underline-offset-2"
              >
                bmftauction.netlify.app
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2 flex items-center gap-1"
            >
              <span>ওয়েবসাইট ও শেয়ার লিংক</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('player-register')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2"
            >
              ফ্রি প্লেয়ার রেজিস্ট্রেশন
            </button>
            {isAdmin && (
              <>
                <span>•</span>
                <button
                  onClick={() => setIsEditSettingsOpen(true)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2"
                >
                  সেটিংস এডিট
                </button>
              </>
            )}
            <span>•</span>
            <span className="text-[11px] text-slate-500">
              প্লেয়ার: {players.length} জন | দল: {teams.length} টি
            </span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <PlayerProfileModal
        player={selectedPlayerProfile}
        teams={teams}
        isAdmin={isAdmin}
        performances={performances}
        onClose={() => setSelectedPlayerProfile(null)}
        onEdit={(p) => {
          setEditingPlayer(p);
          setIsPlayerFormOpen(true);
        }}
        onSelectForAuction={(p) => {
          setSelectedPlayerProfile(null);
          handleStartAuctionForPlayer(p);
        }}
        onAddPerformance={handleOpenAddPerformance}
        onEditPerformance={handleOpenEditPerformance}
        onDeletePerformance={handleDeletePerformance}
      />

      <PerformanceEntryModal
        isOpen={isPerformanceModalOpen}
        editingPerformance={editingPerformance}
        defaultPlayerId={defaultPerformancePlayerId}
        players={players}
        matches={matches}
        teams={teams}
        onClose={() => {
          setIsPerformanceModalOpen(false);
          setEditingPerformance(null);
          setDefaultPerformancePlayerId(null);
        }}
        onSave={handleSavePerformance}
        onDelete={handleDeletePerformance}
      />

      <PlayerFormModal
        isOpen={isPlayerFormOpen}
        editingPlayer={editingPlayer}
        existingPlayers={players}
        defaultBasePrice={settings.defaultBasePrice}
        categories={categories}
        teams={teams}
        onClose={() => {
          setIsPlayerFormOpen(false);
          setEditingPlayer(null);
        }}
        onSave={handleSavePlayer}
      />

      <MatchModal
        isOpen={isMatchModalOpen}
        match={selectedMatch}
        teams={teams}
        players={players}
        onClose={() => {
          setIsMatchModalOpen(false);
          setSelectedMatch(null);
        }}
        onSave={handleSaveMatch}
        onDelete={(matchId) => {
          handleDeleteMatch(matchId);
          setIsMatchModalOpen(false);
          setSelectedMatch(null);
        }}
      />

      <TeamFormModal
        isOpen={isTeamFormOpen}
        editingTeam={editingTeam}
        existingTeams={teams}
        defaultBudget={settings.initialBudgetPerTeam}
        onClose={() => {
          setIsTeamFormOpen(false);
          setEditingTeam(null);
        }}
        onSave={handleSaveTeam}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        currentUser={currentUser}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          StorageService.setCurrentUser(user);
          notify({
            type: 'settings_updated',
            title: 'লগইন সফল!',
            message: `${user.name} হিসেবে লগইন সম্পন্ন হয়েছে।`,
          });
        }}
        onLogout={() => {
          setCurrentUser(null);
          StorageService.setCurrentUser(null);
          notify({
            type: 'settings_updated',
            title: 'লগআউট সম্পন্ন',
            message: 'লগআউট করা হয়েছে।',
          });
        }}
      />

      <OwnerSettingsModal
        isOpen={isOwnerSettingsOpen}
        currentUser={currentUser}
        teams={teams}
        onClose={() => setIsOwnerSettingsOpen(false)}
        onUpdateTeam={handleOwnerUpdateTeam}
        onCredentialsUpdated={handleOwnerCredentialsUpdated}
      />

      <AdminCredentialsModal
        isOpen={isAdminCredentialsOpen}
        currentUser={currentUser}
        onClose={() => setIsAdminCredentialsOpen(false)}
        onRefresh={() => {
          // Re-sync
        }}
      />

      <ProjectorModal
        isOpen={isProjectorOpen}
        currentPlayer={players.find((p) => p.id === liveAuctionState.activePlayerId) || liveSpotlightPlayer}
        currentBid={liveAuctionState.currentBid || (liveSpotlightPlayer?.basePrice || settings.defaultBasePrice)}
        highestBidTeam={teams.find((t) => t.id === liveAuctionState.highestBidTeamId) || null}
        teams={teams}
        timer={liveAuctionState.timerSeconds || settings.timerSeconds}
        isTimerRunning={liveAuctionState.isTimerRunning}
        onClose={() => setIsProjectorOpen(false)}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        onClose={() => setIsCategoryModalOpen(false)}
        onSaveCategories={handleSaveCategories}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        isAdmin={isAdmin}
        onClose={() => setIsResetModalOpen(false)}
        onWipeAllToZero={handleWipeAllToZero}
        onResetAuctionProgress={handleResetAuctionProgress}
      />

      <EditSettingsModal
        isOpen={isEditSettingsOpen}
        settings={settings}
        teamsCount={teams.length}
        categories={categories}
        isAdmin={isAdmin}
        onClose={() => setIsEditSettingsOpen(false)}
        onSave={handleUpdateSettings}
        onSaveCategories={handleSaveCategories}
      />

      <ShareWebsiteModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tournamentName={settings.tournamentName}
      />
    </div>
  );
}

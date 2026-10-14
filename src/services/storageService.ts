import { 
  Player, Team, AuctionHistoryItem, AuctionSettings, 
  AuctionNotification, AppUser, PlayerCategory, LiveAuctionState, Match,
  PlayerMatchPerformance
} from '../types';
import { 
  INITIAL_PLAYERS, INITIAL_TEAMS, INITIAL_SETTINGS, 
  INITIAL_AUCTION_HISTORY, INITIAL_CATEGORIES, INITIAL_AUCTION_STATE 
} from '../data/initialData';
import { FirestoreSync } from './firebase';

const STORAGE_KEYS = {
  PLAYERS: 'mr_auction_players_v11',
  TEAMS: 'mr_auction_teams_v11',
  MATCHES: 'mr_football_matches_v11',
  PERFORMANCES: 'mr_football_performances_v11',
  SETTINGS: 'mr_auction_settings_v11',
  HISTORY: 'mr_auction_history_v11',
  NOTIFICATIONS: 'mr_auction_notifications_v11',
  CATEGORIES: 'mr_auction_categories_v11',
  LIVE_STATE: 'mr_auction_live_state_v11',
  CURRENT_USER: 'mr_auction_current_user_v11',
  IS_INITIALIZED: 'mr_auction_initialized_v11',
};

const memoryStorage: Record<string, string> = {};

export function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // fallback
  }
  return memoryStorage[key] || null;
}

export function safeSetStorage(key: string, value: string): void {
  try {
    memoryStorage[key] = value;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

export function safeRemoveStorage(key: string): void {
  try {
    delete memoryStorage[key];
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // fallback
  }
}

// Safe BroadcastChannel initialization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('mr_football_auction_broadcast_v11');
  }
} catch {
  broadcastChannel = null;
}

function safeBroadcast(type: string, payload: unknown) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type, payload });
    }
  } catch {
    // ignore
  }
}

export const StorageService = {
  checkAndInitialize() {
    try {
      const initialized = safeGetStorage(STORAGE_KEYS.IS_INITIALIZED);
      if (!initialized) {
        // First run on fresh browser
        if (!safeGetStorage(STORAGE_KEYS.SETTINGS)) {
          safeSetStorage(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        }
        if (!safeGetStorage(STORAGE_KEYS.CATEGORIES)) {
          safeSetStorage(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
        }
        safeSetStorage(STORAGE_KEYS.IS_INITIALIZED, 'true');
      }
    } catch {
      // ignore
    }
  },

  getPlayers(): Player[] {
    try {
      const data = safeGetStorage(STORAGE_KEYS.PLAYERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_PLAYERS;
  },

  savePlayers(players: Player[], notify = true) {
    try {
      safeSetStorage(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
      if (notify) safeBroadcast('PLAYERS_UPDATED', players);
    } catch (e) {
      console.error('Failed to save players', e);
    }
  },

  async saveSinglePlayer(player: Player, notify = true): Promise<void> {
    try {
      const current = this.getPlayers();
      const exists = current.some((p) => p.id === player.id);
      const updated = exists
        ? current.map((p) => (p.id === player.id ? player : p))
        : [player, ...current];
      safeSetStorage(STORAGE_KEYS.PLAYERS, JSON.stringify(updated));
      if (notify) safeBroadcast('PLAYERS_UPDATED', updated);
      await FirestoreSync.savePlayer(player);
    } catch (e) {
      console.error('Failed to save single player to Firestore', e);
      throw e;
    }
  },

  getTeams(): Team[] {
    try {
      const data = safeGetStorage(STORAGE_KEYS.TEAMS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_TEAMS;
  },

  saveTeams(teams: Team[], notify = true) {
    try {
      safeSetStorage(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
      if (notify) safeBroadcast('TEAMS_UPDATED', teams);
      if (teams.length === 0) {
        FirestoreSync.deleteAllTeams().catch(() => {});
      } else {
        FirestoreSync.saveAllTeams(teams).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to save teams', e);
    }
  },

  getMatches(): Match[] {
    try {
      const data = safeGetStorage(STORAGE_KEYS.MATCHES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  },

  saveMatches(matches: Match[], notify = true) {
    try {
      safeSetStorage(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
      if (notify) safeBroadcast('MATCHES_UPDATED', matches);
      FirestoreSync.saveAllMatches(matches).catch(() => {});
    } catch (e) {
      console.error('Failed to save matches', e);
    }
  },

  saveMatchesLocally(matches: Match[]) {
    try {
      safeSetStorage(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    } catch {
      // fallback
    }
  },

  getPerformances(): PlayerMatchPerformance[] {
    try {
      const data = safeGetStorage(STORAGE_KEYS.PERFORMANCES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  },

  savePerformances(performances: PlayerMatchPerformance[], notify = true) {
    try {
      safeSetStorage(STORAGE_KEYS.PERFORMANCES, JSON.stringify(performances));
      if (notify) safeBroadcast('PERFORMANCES_UPDATED', performances);
    } catch (e) {
      console.error('Failed to save performances', e);
    }
  },

  savePerformancesLocally(performances: PlayerMatchPerformance[]) {
    try {
      safeSetStorage(STORAGE_KEYS.PERFORMANCES, JSON.stringify(performances));
    } catch {
      // fallback
    }
  },

  getSettings(): AuctionSettings {
    try {
      const data = safeGetStorage(STORAGE_KEYS.SETTINGS);
      if (data) return { ...INITIAL_SETTINGS, ...JSON.parse(data) };
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  },

  saveSettings(settings: AuctionSettings, notify = true) {
    try {
      safeSetStorage(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (notify) safeBroadcast('SETTINGS_UPDATED', settings);
      FirestoreSync.saveSettings(settings).catch(() => {});
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  getHistory(): AuctionHistoryItem[] {
    try {
      const data = safeGetStorage(STORAGE_KEYS.HISTORY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_AUCTION_HISTORY;
  },

  saveHistory(history: AuctionHistoryItem[], notify = true) {
    try {
      safeSetStorage(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      if (notify) safeBroadcast('HISTORY_UPDATED', history);
      if (history.length > 0) {
        FirestoreSync.saveHistoryItem(history[0]).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to save history', e);
    }
  },

  getNotifications(): AuctionNotification[] {
    try {
      const data = safeGetStorage(STORAGE_KEYS.NOTIFICATIONS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return [];
  },

  savePlayersLocally(players: Player[]) {
    try {
      safeSetStorage(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch {
      // ignore
    }
  },

  saveTeamsLocally(teams: Team[]) {
    try {
      safeSetStorage(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    } catch {
      // ignore
    }
  },

  saveSettingsLocally(settings: AuctionSettings) {
    try {
      safeSetStorage(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  },

  saveHistoryLocally(history: AuctionHistoryItem[]) {
    try {
      safeSetStorage(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // ignore
    }
  },

  saveNotificationsLocally(notifications: AuctionNotification[]) {
    try {
      const trimmed = notifications.slice(0, 30);
      safeSetStorage(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  },

  saveNotifications(notifications: AuctionNotification[], notify = true) {
    try {
      const trimmed = notifications.slice(0, 30);
      safeSetStorage(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(trimmed));
      if (notify) safeBroadcast('NOTIFICATIONS_UPDATED', trimmed);
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  },

  addNotification(notification: Omit<AuctionNotification, 'id' | 'timestamp'>) {
    const list = this.getNotifications();
    const newNotif: AuctionNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTime: new Date().toISOString(),
    };
    const updated = [newNotif, ...list];
    this.saveNotifications(updated);
    if (['player_sold', 'player_unsold', 'player_registered'].includes(notification.type)) {
      FirestoreSync.addNotification(newNotif).catch(() => {});
    }
    return newNotif;
  },

  getCurrentUser(): AppUser | null {
    try {
      const data = safeGetStorage(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
      // Auto-restore admin session if persistent admin session exists
      const isPersistent = safeGetStorage('mr_auction_admin_persistent');
      if (isPersistent === 'true') {
        return {
          userId: 'mahian rana',
          name: 'Mahian Rana (Admin)',
          role: 'admin',
        };
      }
    } catch {
      // fallback
    }
    return null;
  },

  setCurrentUser(user: AppUser | null, notify = true) {
    try {
      if (user) {
        safeSetStorage(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        if (user.role === 'admin') {
          safeSetStorage('mr_auction_admin_persistent', 'true');
        }
      } else {
        safeRemoveStorage(STORAGE_KEYS.CURRENT_USER);
        safeRemoveStorage('mr_auction_admin_persistent');
      }
      if (notify) safeBroadcast('USER_UPDATED', user);
    } catch (e) {
      console.error('Failed to save current user', e);
    }
  },

  clearAllDataToZero(notify = true) {
    this.savePlayers([], notify);
    this.saveHistory([], notify);
    this.saveTeams([], notify);
    this.saveSettings(INITIAL_SETTINGS, notify);
    this.saveNotifications([], notify);
    this.saveCategories(INITIAL_CATEGORIES, notify);
    this.saveLiveState(INITIAL_AUCTION_STATE, notify);
    FirestoreSync.deleteAllPlayers().catch(() => {});
    FirestoreSync.deleteAllTeams().catch(() => {});
    FirestoreSync.deleteAllHistory().catch(() => {});
    FirestoreSync.deleteAllNotifications().catch(() => {});
    FirestoreSync.saveLiveAuctionState(INITIAL_AUCTION_STATE).catch(() => {});
    FirestoreSync.saveAllCategories(INITIAL_CATEGORIES).catch(() => {});
  },

  resetAuctionProgress() {
    const currentPlayers = this.getPlayers();
    const resetPlayers = currentPlayers.map((p) => ({
      ...p,
      status: 'available' as const,
      teamId: null,
      soldPrice: null,
    }));
    this.savePlayers(resetPlayers);
    this.saveHistory([]);
    this.saveLiveState(INITIAL_AUCTION_STATE);
    FirestoreSync.saveLiveAuctionState(INITIAL_AUCTION_STATE).catch(() => {});
    this.addNotification({
      type: 'settings_updated',
      title: 'নিলাম অগ্রগতি রিসেট',
      message: 'সকল প্লেয়ার আবার Available হিসেবে চিহ্নিত হয়েছে।',
      highlightColor: '#10b981',
    });
    return resetPlayers;
  },

  getCategories(): PlayerCategory[] {
    try {
      const data = safeGetStorage(STORAGE_KEYS.CATEGORIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CATEGORIES;
  },

  saveCategoriesLocally(categories: PlayerCategory[]) {
    try {
      safeSetStorage(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch {
      // ignore
    }
  },

  saveCategories(categories: PlayerCategory[], notify = true) {
    try {
      this.saveCategoriesLocally(categories);
      if (notify) safeBroadcast('CATEGORIES_UPDATED', categories);
      FirestoreSync.saveAllCategories(categories).catch(() => {});
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  },

  getLiveState(): LiveAuctionState {
    try {
      const data = safeGetStorage(STORAGE_KEYS.LIVE_STATE);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_AUCTION_STATE;
  },

  saveLiveStateLocally(state: LiveAuctionState) {
    try {
      safeSetStorage(STORAGE_KEYS.LIVE_STATE, JSON.stringify(state));
    } catch {
      // ignore
    }
  },

  saveLiveState(state: LiveAuctionState, notify = true) {
    try {
      this.saveLiveStateLocally(state);
      if (notify) safeBroadcast('LIVE_STATE_UPDATED', state);
      FirestoreSync.saveLiveAuctionState(state).catch(() => {});
    } catch (e) {
      console.error('Failed to save live auction state', e);
    }
  },

  subscribeToBroadcast(callback: (event: { type: string; payload: unknown }) => void) {
    // 1. BroadcastChannel for instant cross-tab communication
    const bcHandler = (e: MessageEvent) => {
      try {
        if (e.data && e.data.type) {
          callback(e.data);
        }
      } catch {}
    };

    if (broadcastChannel) {
      try {
        broadcastChannel.addEventListener('message', bcHandler);
      } catch {}
    }

    // 2. Storage event listener (triggers within 10ms in all other open windows/tabs of the same origin!)
    const storageHandler = (e: StorageEvent) => {
      try {
        if (!e.key || !e.newValue) return;
        if (e.key === STORAGE_KEYS.PLAYERS) {
          const p = JSON.parse(e.newValue);
          if (Array.isArray(p)) {
            callback({ type: 'PLAYERS_UPDATED', payload: p });
          }
        } else if (e.key === STORAGE_KEYS.LIVE_STATE) {
          const st = JSON.parse(e.newValue);
          callback({ type: 'LIVE_STATE_UPDATED', payload: st });
        } else if (e.key === STORAGE_KEYS.NOTIFICATIONS) {
          const n = JSON.parse(e.newValue);
          callback({ type: 'NOTIFICATIONS_UPDATED', payload: n });
        } else if (e.key === STORAGE_KEYS.SETTINGS) {
          const s = JSON.parse(e.newValue);
          callback({ type: 'SETTINGS_UPDATED', payload: s });
        }
      } catch {}
    };

    if (typeof window !== 'undefined') {
      try {
        window.addEventListener('storage', storageHandler);
      } catch {}
    }

    return () => {
      if (broadcastChannel) {
        try {
          broadcastChannel.removeEventListener('message', bcHandler);
        } catch {}
      }
      if (typeof window !== 'undefined') {
        try {
          window.removeEventListener('storage', storageHandler);
        } catch {}
      }
    };
  },
};

// Safe startup check
try {
  StorageService.checkAndInitialize();
} catch {
  // ignore
}

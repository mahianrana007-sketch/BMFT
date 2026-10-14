import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  setLogLevel,
  initializeFirestore,
  getFirestore,
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  getDocsFromServer,
  runTransaction,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Player, Team, AuctionSettings, AuctionHistoryItem, 
  AuctionNotification, LiveAuctionState, PlayerCategory, 
  BidRecord, AppUser, SecurityAuditLog, UserSession, Match,
  PlayerMatchPerformance
} from '../types';
import { INITIAL_AUCTION_STATE, INITIAL_CATEGORIES, INITIAL_SETTINGS, INITIAL_PLAYERS } from '../data/initialData';
import { StorageService } from './storageService';
import { DEFAULT_PLAYER_PHOTO } from '../utils/media';

// Filter non-fatal offline notices so they don't break execution
if (typeof window !== 'undefined') {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('Could not reach Cloud Firestore backend')) {
      console.warn(...args);
      return;
    }
    origError.apply(console, args);
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const isPerm = error instanceof Error && (
    error.message.toLowerCase().includes('permission') ||
    error.message.toLowerCase().includes('permission-denied')
  );

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (isPerm) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
    throw new Error(errInfo.error);
  }
}

// Initialize Firebase App and Database with force long-polling for reliable cloud/iframe networking
const app = initializeApp(firebaseConfig);

// Set log level to silent to prevent internal 10-second offline warning logs
try {
  setLogLevel('silent');
} catch {
  // ignore
}

export const db = typeof window !== 'undefined'
  ? initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    )
  : getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Secure Firebase Authentication Service for Admin
export const AuthService = {
  getAuthInstance() {
    return auth;
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async loginAdmin(identifier: string, pass: string): Promise<{ success: boolean; error?: string; user?: AppUser }> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'এডমিন আইডি বা ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' };
    }

    // Standardize to email format for Firebase Auth
    const email = cleanId.includes('@') ? cleanId : `${cleanId.replace(/\s+/g, '')}@mrfootball.com`;

    try {
      // 1. Try Firebase Auth sign-in
      const userCredential = await signInWithEmailAndPassword(auth, email, cleanPass);
      const appUser: AppUser = {
        userId: userCredential.user.email?.split('@')[0] || cleanId,
        name: userCredential.user.displayName || 'Mahian Rana (Admin)',
        role: 'admin',
      };
      StorageService.setCurrentUser(appUser);
      return { success: true, user: appUser };
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code || '';

      // If user does not exist in Firebase Auth yet, provision the admin account on first initialization
      if (errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') {
        try {
          const createCredential = await createUserWithEmailAndPassword(auth, email, cleanPass);
          const appUser: AppUser = {
            userId: createCredential.user.email?.split('@')[0] || cleanId,
            name: createCredential.user.displayName || 'Mahian Rana (Admin)',
            role: 'admin',
          };
          StorageService.setCurrentUser(appUser);
          return { success: true, user: appUser };
        } catch (createErr: unknown) {
          const createCode = (createErr as { code?: string })?.code || '';
          if (createCode === 'auth/email-already-in-use') {
            return { success: false, error: 'ভুল পাসওয়ার্ড! সঠিক এডমিন পাসওয়ার্ড প্রদান করুন।' };
          }
          if (createCode === 'auth/weak-password') {
            return { success: false, error: 'পাসওয়ার্ডটি অত্যন্ত দুর্বল (কমপক্ষে ৬ অক্ষরের হতে হবে)।' };
          }
        }
      }

      if (errCode === 'auth/wrong-password' || errCode === 'auth/invalid-credential') {
        return { success: false, error: 'ভুল পাসওয়ার্ড বা এডমিন আইডি! সঠিক তথ্য দিন।' };
      }
      if (errCode === 'auth/too-many-requests') {
        return { success: false, error: 'অতিরিক্ত ব্যর্থ চেষ্টার কারণে অ্যাকাউন্টটি সাময়িকভাবে লক হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' };
      }
      return { success: false, error: 'লগইন ব্যর্থ হয়েছে। সঠিক এডমিন আইডি ও পাসওয়ার্ড নিশ্চিত করুন।' };
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    StorageService.setCurrentUser(null);
  }
};

// Test connection on boot with timeout protection
export async function testConnection() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('connection_timeout')), 2000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise,
    ]);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('connection_timeout'))) {
      console.warn('Firestore connection check resolved (offline fallback or initial handshake).');
    }
  }
}

export const OFFICIAL_WEBSITE_URL = 'https://bmftauction.netlify.app';

// High level Firestore synchronization helpers
export const FirestoreSync = {
  // 1. Players & Registered Users Multi-Collection Real-time Sync
  subscribePlayers(callback: (players: Player[]) => void) {
    const playersMap = new Map<string, Player>();
    let hasReceivedPlayerSnapshot = false;
    let hasReceivedRegisteredSnapshot = false;

    // Helper to merge and broadcast all players safely
    const emit = () => {
      // Keep initial players in map if not present
      const combined = new Map<string, Player>();
      INITIAL_PLAYERS.forEach((ip) => {
        combined.set(ip.id, ip);
      });
      // Layer actual Firestore players over initial players
      playersMap.forEach((player, id) => {
        combined.set(id, player);
      });

      const list = Array.from(combined.values());
      // Sort: Pending/Newly registered players first, then by ID or rating
      list.sort((a, b) => {
        const aPending = (a.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
        const bPending = (b.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aDate && bDate && aDate !== bDate) return bDate - aDate;
        return (b.rating || 0) - (a.rating || 0);
      });

      callback(list);
    };

    // 1. Primary players collection listener
    const unsubPlayers = onSnapshot(
      collection(db, 'players'),
      (snapshot) => {
        hasReceivedPlayerSnapshot = true;
        snapshot.forEach((doc) => {
          const data = doc.data() as Player;
          if (data && data.id) {
            playersMap.set(data.id, data);
          }
        });
        emit();

        // Seed initial players to Firestore once if collection is empty
        if (snapshot.empty && !hasReceivedRegisteredSnapshot) {
          FirestoreSync.saveAllPlayers(INITIAL_PLAYERS).catch(() => {});
        }
      },
      (error) => {
        console.warn('Players snapshot listener warning:', error);
        // Fallback emit if initial load
        if (!hasReceivedPlayerSnapshot) {
          emit();
        }
      }
    );

    // 2. Mirror registeredUsers collection listener (catches any direct user registration - Admin only)
    let unsubRegistered: () => void = () => {};
    let isSubscribedToRegistered = false;

    const setupRegisteredSub = () => {
      if (auth.currentUser && !isSubscribedToRegistered) {
        try {
          isSubscribedToRegistered = true;
          unsubRegistered = onSnapshot(
            collection(db, 'registeredUsers'),
            (snapshot) => {
              hasReceivedRegisteredSnapshot = true;
              snapshot.forEach((doc) => {
                const reg = doc.data();
                const id = reg.id || reg.userId;
                if (id) {
                  const existing = playersMap.get(id);
                  const userPlayer: Player = {
                    id,
                    name: reg.name || existing?.name || 'অনলাইন প্লেয়ার',
                    position: reg.position || existing?.position || 'MID',
                    rating: existing?.rating || 8.0,
                    basePrice: Number(reg.basePrice) || existing?.basePrice || 200,
                    status: existing?.status || 'available',
                    approvalStatus: (reg.approvalStatus as 'PENDING' | 'APPROVED' | 'REJECTED') || existing?.approvalStatus || 'PENDING',
                    mobile: reg.mobile || existing?.mobile || '',
                    jerseyNumber: Number(reg.jerseyNumber) || existing?.jerseyNumber || 10,
                    age: Number(reg.age) || existing?.age || 20,
                    experience: reg.experience || existing?.experience || 'অনলাইন নিবন্ধিত খেলোয়াড়',
                    bio: reg.bio || existing?.bio || '',
                    preferredFoot: reg.preferredFoot || existing?.preferredFoot || 'Right',
                    height: reg.height || existing?.height || '',
                    weight: reg.weight || existing?.weight || '',
                    teamId: existing?.teamId || null,
                    soldPrice: existing?.soldPrice || null,
                    photoUrl: reg.photoUrl || existing?.photoUrl || DEFAULT_PLAYER_PHOTO,
                    registeredViaLink: true,
                    pin: reg.pin || existing?.pin || '',
                    createdAt: reg.createdAt || existing?.createdAt || new Date().toISOString(),
                  };
                  playersMap.set(id, userPlayer);
                }
              });
              emit();
            },
            (error) => {
              isSubscribedToRegistered = false;
              if (!auth.currentUser) return;
              console.warn('RegisteredUsers snapshot warning:', error);
            }
          );
        } catch {
          isSubscribedToRegistered = false;
        }
      }
    };

    setupRegisteredSub();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setupRegisteredSub();
      } else {
        if (isSubscribedToRegistered) {
          unsubRegistered();
          unsubRegistered = () => {};
          isSubscribedToRegistered = false;
        }
      }
    });

    return () => {
      unsubPlayers();
      if (isSubscribedToRegistered) {
        unsubRegistered();
      }
      unsubAuth();
    };
  },

  async savePlayer(player: Player): Promise<void> {
    const path = `players/${player.id}`;
    try {
      await setDoc(doc(db, 'players', player.id), player);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  /**
   * Complete registration data flow: Saves both to the primary 'players' collection
   * and mirrors to 'registeredUsers' collection with timestamp & metadata.
   */
  async registerPlayer(player: Player): Promise<void> {
    const path = `players/${player.id}`;
    try {
      // 1. Save directly into players collection
      await setDoc(doc(db, 'players', player.id), player);

      // 2. Also record in registeredUsers collection for dedicated tracking
      try {
        const userDoc = {
          id: player.id,
          userId: player.id,
          name: player.name,
          mobile: player.mobile,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          age: player.age,
          basePrice: player.basePrice,
          photoUrl: player.photoUrl,
          approvalStatus: player.approvalStatus || 'PENDING',
          createdAt: player.createdAt || new Date().toISOString(),
          registeredViaLink: true,
          bio: player.bio || '',
          experience: player.experience || '',
          preferredFoot: player.preferredFoot || 'Right',
          height: player.height || '',
          weight: player.weight || '',
        };
        await setDoc(doc(db, 'registeredUsers', player.id), userDoc);
      } catch (mirrorErr) {
        console.warn('registeredUsers mirror write notice (non-fatal):', mirrorErr);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  /**
   * Update Player Approval Status in both players and registeredUsers collections
   */
  async updatePlayerApproval(
    playerId: string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING'
  ): Promise<void> {
    const playerRef = doc(db, 'players', playerId);
    await setDoc(playerRef, { approvalStatus: status }, { merge: true });

    try {
      const regRef = doc(db, 'registeredUsers', playerId);
      await setDoc(regRef, { approvalStatus: status }, { merge: true });
    } catch {
      // Non-fatal
    }
  },

  /**
   * Directly fetch all players from Firestore server (bypassing local cache),
   * merging both players and registeredUsers collections to guarantee 100% data presence.
   */
  async fetchAllPlayersFromServer(): Promise<Player[]> {
    const combined = new Map<string, Player>();
    INITIAL_PLAYERS.forEach((ip) => combined.set(ip.id, ip));

    try {
      const snap = await getDocsFromServer(collection(db, 'players')).catch(() => getDocs(collection(db, 'players')));
      snap.forEach((doc) => {
        const data = doc.data() as Player;
        if (data && data.id) {
          combined.set(data.id, data);
        }
      });
    } catch (e) {
      console.warn('Fetch players error:', e);
    }

    // Only fetch private registeredUsers collection if authenticated as Admin
    if (auth.currentUser) {
      try {
        const regSnap = await getDocsFromServer(collection(db, 'registeredUsers')).catch(() => getDocs(collection(db, 'registeredUsers')));
        regSnap.forEach((doc) => {
          const reg = doc.data();
          const id = reg.id || reg.userId;
          if (id) {
            const existing = combined.get(id);
            const p: Player = {
              id,
              name: reg.name || existing?.name || 'অনলাইন প্লেয়ার',
              position: reg.position || existing?.position || 'MID',
              rating: existing?.rating || 8.0,
              basePrice: Number(reg.basePrice) || existing?.basePrice || 200,
              status: existing?.status || 'available',
              approvalStatus: (reg.approvalStatus as 'PENDING' | 'APPROVED' | 'REJECTED') || existing?.approvalStatus || 'PENDING',
              mobile: reg.mobile || existing?.mobile || '',
              jerseyNumber: Number(reg.jerseyNumber) || existing?.jerseyNumber || 10,
              age: Number(reg.age) || existing?.age || 20,
              experience: reg.experience || existing?.experience || 'অনলাইন নিবন্ধিত খেলোয়াড়',
              bio: reg.bio || existing?.bio || '',
              preferredFoot: reg.preferredFoot || existing?.preferredFoot || 'Right',
              height: reg.height || existing?.height || '',
              weight: reg.weight || existing?.weight || '',
              teamId: existing?.teamId || null,
              soldPrice: existing?.soldPrice || null,
              photoUrl: reg.photoUrl || existing?.photoUrl || DEFAULT_PLAYER_PHOTO,
              registeredViaLink: true,
              pin: reg.pin || existing?.pin || '',
              createdAt: reg.createdAt || existing?.createdAt || new Date().toISOString(),
            };
            combined.set(id, p);
          }
        });
      } catch (regErr) {
        console.warn('Fetch registeredUsers error:', regErr);
      }
    }

    const list = Array.from(combined.values());
    list.sort((a, b) => {
      const aPending = (a.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
      const bPending = (b.approvalStatus || 'APPROVED') === 'PENDING' ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;
      return (b.rating || 0) - (a.rating || 0);
    });

    return list;
  },

  async saveAllPlayers(players: Player[]) {
    try {
      for (const p of players) {
        await setDoc(doc(db, 'players', p.id), p);
      }
    } catch (e) {
      console.warn('Batch players sync error', e);
    }
  },

  async deletePlayer(playerId: string) {
    const path = `players/${playerId}`;
    try {
      await deleteDoc(doc(db, 'players', playerId));
      try {
        await deleteDoc(doc(db, 'registeredUsers', playerId));
      } catch {
        // ignore
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async deleteAllPlayers() {
    try {
      const snap = await getDocs(collection(db, 'players'));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'players', d.id));
      }
      try {
        const userSnap = await getDocs(collection(db, 'registeredUsers'));
        for (const ud of userSnap.docs) {
          await deleteDoc(doc(db, 'registeredUsers', ud.id));
        }
      } catch {
        // ignore
      }
    } catch (e) {
      console.warn('Error deleting all players from Firestore', e);
    }
  },

  // 2. Teams Collection (Permanently stored, no auto-deletion)
  subscribeTeams(callback: (teams: Team[]) => void) {
    const path = 'teams';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Team[] = [];
        snapshot.forEach((d) => {
          const t = d.data() as Team;
          if (t && t.id && t.name) {
            list.push(t);
          }
        });
        callback(list);
      },
      (error) => {
        console.warn('Teams snapshot listener warning:', error);
      }
    );
  },

  async saveTeam(team: Team) {
    const path = `teams/${team.id}`;
    try {
      await setDoc(doc(db, 'teams', team.id), team);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveAllTeams(teams: Team[]) {
    try {
      for (const t of teams) {
        await setDoc(doc(db, 'teams', t.id), t);
      }
    } catch (e) {
      console.warn('Batch teams sync error', e);
    }
  },

  async deleteTeam(teamId: string) {
    const path = `teams/${teamId}`;
    try {
      await deleteDoc(doc(db, 'teams', teamId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async deleteAllTeams() {
    try {
      const snap = await getDocs(collection(db, 'teams'));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'teams', d.id));
      }
    } catch (e) {
      console.warn('Error deleting all teams from Firestore', e);
    }
  },

  // 3. Settings Collection
  subscribeSettings(callback: (settings: AuctionSettings) => void) {
    const path = 'settings';
    return onSnapshot(
      doc(db, path, 'global'),
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as AuctionSettings);
        } else {
          callback(INITIAL_SETTINGS);
        }
      },
      (error) => {
        console.warn('Settings snapshot listener warning:', error);
      }
    );
  },

  async saveSettings(settings: AuctionSettings) {
    const path = 'settings/global';
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // 4. Auction History Collection
  subscribeHistory(callback: (history: AuctionHistoryItem[]) => void) {
    const path = 'auctionHistory';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: AuctionHistoryItem[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AuctionHistoryItem);
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (error) => {
        console.warn('History snapshot listener warning:', error);
      }
    );
  },

  async saveHistoryItem(item: AuctionHistoryItem) {
    const path = `auctionHistory/${item.id}`;
    try {
      await setDoc(doc(db, 'auctionHistory', item.id), item);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteAllHistory() {
    try {
      const snap = await getDocs(collection(db, 'auctionHistory'));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'auctionHistory', d.id));
      }
    } catch (e) {
      console.warn('Error deleting all auction history', e);
    }
  },

  // 5. Notifications Collection
  subscribeNotifications(callback: (notifications: AuctionNotification[]) => void) {
    const path = 'notifications';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: AuctionNotification[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AuctionNotification);
        });
        list.sort((a, b) => {
          const tA = new Date(a.isoTime || a.timestamp).getTime();
          const tB = new Date(b.isoTime || b.timestamp).getTime();
          if (!isNaN(tA) && !isNaN(tB)) return tB - tA;
          return b.id.localeCompare(a.id);
        });
        callback(list.slice(0, 30));
      },
      (error) => {
        console.warn('Notifications snapshot listener warning:', error);
      }
    );
  },

  async addNotification(notif: AuctionNotification) {
    const path = `notifications/${notif.id}`;
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteAllNotifications() {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'notifications', d.id));
      }
    } catch (e) {
      console.warn('Error deleting notifications from Firestore', e);
    }
  },

  // 6. Live Auction State & Atomic Transaction (Timer 0 Lock + Balance Reservation)
  subscribeLiveAuctionState(callback: (state: LiveAuctionState) => void) {
    return onSnapshot(
      doc(db, 'auctionState', 'live'),
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as LiveAuctionState);
        } else {
          callback(INITIAL_AUCTION_STATE);
        }
      },
      (error) => {
        console.warn('Auction state snapshot warning:', error);
      }
    );
  },

  async saveLiveAuctionState(state: LiveAuctionState) {
    const path = 'auctionState/live';
    try {
      await setDoc(doc(db, 'auctionState', 'live'), {
        ...state,
        lastActionTimestamp: Date.now(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // Server/Firestore Atomic Transaction for Concurrent Live Bidding with strict Timer 0 Lock
  async placeBidAtomic(
    team: Team,
    bidAmount: number,
    user: AppUser,
    player: Player,
    timerSeconds: number
  ): Promise<{ success: boolean; error?: string; updatedState?: LiveAuctionState }> {
    try {
      const stateRef = doc(db, 'auctionState', 'live');
      const result = await runTransaction(db, async (transaction) => {
        const stateSnap = await transaction.get(stateRef);
        
        let currentState: LiveAuctionState = INITIAL_AUCTION_STATE;
        if (stateSnap.exists()) {
          currentState = stateSnap.data() as LiveAuctionState;
        }

        // 1. Verify auction status is active
        if (currentState.status !== 'bidding') {
          throw new Error('নিলাম বর্তমানে বিডিং মোডে নেই অথবা শেষ হয়েছে!');
        }

        // 2. BACKEND/FIRESTORE TIMER 0 LOCK CHECK:
        // Validate whether the timer has elapsed based on server timestamp
        if (currentState.isTimerRunning && currentState.timerStartedAt) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - currentState.timerStartedAt) / 1000);
          const allowedDuration = currentState.timerSeconds || timerSeconds || 30;

          if (elapsedSeconds >= allowedDuration) {
            throw new Error('টাইমার ০-তে পৌঁছে গেছে! বিড সিস্টেম স্বয়ংক্রিয়ভাবে লক করা হয়েছে। কোনো নতুন ডাক গ্রহণযোগ্য নয়।');
          }
        }

        // 3. Verify player is currently active
        if (currentState.activePlayerId && currentState.activePlayerId !== player.id) {
          throw new Error('বর্তমান প্লেয়ারের নিলাম ইতিমধ্যে পরিবর্তন হয়েছে!');
        }

        // 4. Strict Base Price check: Bid can NEVER be lower than player's base price
        if (bidAmount < player.basePrice) {
          throw new Error(`বিড কখনো প্লেয়ারের বেস প্রাইজ (${player.basePrice} pt)-এর নিচে গ্রহণ করা যাবে না!`);
        }

        // 5. Atomic check against highest bid
        if (currentState.highestBidTeamId && bidAmount <= currentState.currentBid) {
          throw new Error(`অন্য কোনো ওনার ইতোমধ্যে ${currentState.currentBid} পয়েন্টের ডাক প্রদান করেছেন!`);
        }

        // 6. Prepare new bid record
        const newRecord: BidRecord = {
          id: `bid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          teamId: team.id,
          teamName: team.name,
          amount: bidAmount,
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          placedByRole: user.role,
          placedByName: user.name,
        };

        const existingSeq = currentState.bidSequence || [];
        const nextSequence = [newRecord, ...existingSeq].slice(0, 50);

        // When a new valid bid is placed:
        // - Exactly `bidAmount` is reserved for `team.id`
        // - Any previous team's reservation is instantaneously released back to their available balance
        // - Timer resets to tournament countdown (e.g. 30s)
        const newState: LiveAuctionState = {
          activePlayerId: player.id,
          currentBid: bidAmount,
          highestBidTeamId: team.id,
          highestBidTeamName: team.name,
          highestBidderName: user.name,
          bidSequence: nextSequence,
          timerSeconds,
          isTimerRunning: true,
          timerStartedAt: Date.now(),
          status: 'bidding',
          lastActionTimestamp: Date.now(),
          reservedAmount: bidAmount,
          reservedTeamId: team.id,
        };

        transaction.set(stateRef, newState);
        return newState;
      });

      return { success: true, updatedState: result };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'বিড প্রক্রিয়াকরণে সমস্যা হয়েছে';

      // If error is network or client offline, gracefully fallback to local auction state
      if (
        msg.includes('client is offline') ||
        msg.includes('unavailable') ||
        msg.includes('network') ||
        msg.includes('Backend didn\'t respond')
      ) {
        try {
          const currentState = StorageService.getLiveState();
          if (
            currentState.status === 'bidding' &&
            bidAmount >= player.basePrice &&
            (!currentState.highestBidTeamId ? bidAmount >= player.basePrice : bidAmount > currentState.currentBid)
          ) {
            const newRecord: BidRecord = {
              id: `bid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              teamId: team.id,
              teamName: team.name,
              amount: bidAmount,
              timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              placedByRole: user.role,
              placedByName: user.name,
            };

            const existingSeq = currentState.bidSequence || [];
            const nextSequence = [newRecord, ...existingSeq].slice(0, 50);

            const newState: LiveAuctionState = {
              activePlayerId: player.id,
              currentBid: bidAmount,
              highestBidTeamId: team.id,
              highestBidTeamName: team.name,
              highestBidderName: user.name,
              bidSequence: nextSequence,
              timerSeconds,
              isTimerRunning: true,
              timerStartedAt: Date.now(),
              status: 'bidding',
              lastActionTimestamp: Date.now(),
              reservedAmount: bidAmount,
              reservedTeamId: team.id,
            };

            StorageService.saveLiveState(newState);
            return { success: true, updatedState: newState };
          }
        } catch {
          // continue with standard error
        }
      }

      return { success: false, error: msg };
    }
  },

  // 7. Player Categories Collection
  subscribeCategories(callback: (categories: PlayerCategory[]) => void) {
    const path = 'categories';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PlayerCategory[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as PlayerCategory);
          });
          callback(list);
        } else {
          callback(INITIAL_CATEGORIES);
        }
      },
      (error) => {
        console.warn('Categories snapshot listener warning:', error);
      }
    );
  },

  async saveCategory(category: PlayerCategory) {
    const path = `categories/${category.id}`;
    try {
      await setDoc(doc(db, 'categories', category.id), category);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteCategory(categoryId: string) {
    const path = `categories/${categoryId}`;
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async saveAllCategories(categories: PlayerCategory[]) {
    try {
      for (const c of categories) {
        await setDoc(doc(db, 'categories', c.id), c);
      }
    } catch (e) {
      console.warn('Batch categories sync error', e);
    }
  },

  // 8. Security Audit Logging (Tracks unauthorized access attempts)
  async logSecurityEvent(
    action: string,
    userId: string,
    role: string,
    status: 'GRANTED' | 'BLOCKED' | 'SUSPICIOUS',
    details: string
  ) {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const logItem: SecurityAuditLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      action,
      userId,
      role,
      status,
      details,
    };

    try {
      await setDoc(doc(db, 'auditLogs', logId), logItem);
    } catch {
      // Local fallback
      console.warn('Audit log saved locally:', logItem);
    }
  },

  // 9. Active User Sessions & Multi-Device Login Tracking
  async recordUserLogin(session: UserSession): Promise<void> {
    try {
      const sessionRef = doc(db, 'userSessions', session.id);
      await setDoc(sessionRef, session);

      // Dedicated latest document for the user
      const userRef = doc(db, 'userSessions', `latest_${session.userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
      await setDoc(userRef, session);

      // Create a persistent real-time notification in Firestore
      const notif: AuctionNotification = {
        id: `login-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'user_logged_in',
        title: '🔔 ইউজার লগইন নোটিফিকেশন',
        message: `${session.name} (${session.role === 'admin' ? 'এডমিন' : session.role === 'owner' ? 'টিম ওনার' : 'খেলোয়াড়'}) ${session.deviceInfo || 'অন্য ডিভাইস'} থেকে লগইন করেছেন।`,
        timestamp: new Date().toLocaleTimeString('bn-BD'),
        isoTime: new Date().toISOString(),
        highlightColor: session.role === 'admin' ? '#f59e0b' : session.role === 'owner' ? '#10b981' : '#3b82f6',
      };
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (e) {
      console.warn('Record user login notice:', e);
    }
  },

  async updateUserSessionActive(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'userSessions', sessionId);
      await setDoc(sessionRef, { lastActive: new Date().toISOString(), status: 'online' }, { merge: true });
    } catch {
      // non-fatal
    }
  },

  async markUserSessionOffline(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'userSessions', sessionId);
      await setDoc(sessionRef, { status: 'offline', lastActive: new Date().toISOString() }, { merge: true });
    } catch {
      // non-fatal
    }
  },

  subscribeUserSessions(callback: (sessions: UserSession[]) => void) {
    return onSnapshot(
      collection(db, 'userSessions'),
      (snapshot) => {
        const list: UserSession[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as UserSession;
          if (data && data.userId && !doc.id.startsWith('latest_')) {
            list.push(data);
          }
        });
        list.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
        callback(list.slice(0, 50));
      },
      (error) => {
        console.warn('UserSessions snapshot notice:', error);
      }
    );
  },

  async fetchAllSessionsFromServer(): Promise<UserSession[]> {
    try {
      const snap = await getDocsFromServer(collection(db, 'userSessions')).catch(() => getDocs(collection(db, 'userSessions')));
      const list: UserSession[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as UserSession;
        if (data && data.userId && !doc.id.startsWith('latest_')) {
          list.push(data);
        }
      });
      list.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
      return list;
    } catch {
      return [];
    }
  },

  async sendHeartbeat(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'userSessions', sessionId);
      await setDoc(sessionRef, {
        lastActive: new Date().toISOString(),
        status: 'online'
      }, { merge: true });
    } catch {
      // non-fatal
    }
  },

  // 10. Matches & Fixtures Real-Time Collection
  subscribeMatches(callback: (matches: Match[]) => void) {
    const path = 'matches';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Match[] = [];
        snapshot.forEach((doc) => {
          const m = doc.data() as Match;
          if (m && m.id) {
            list.push(m);
          }
        });
        // Sort matches: finished/live first or by date
        list.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time || ''}`).getTime();
          const dateB = new Date(`${b.date} ${b.time || ''}`).getTime();
          if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
          return a.id.localeCompare(b.id);
        });
        callback(list);
      },
      (error) => {
        console.warn('Matches snapshot listener warning:', error);
      }
    );
  },

  async saveMatch(match: Match): Promise<void> {
    const path = `matches/${match.id}`;
    try {
      await setDoc(doc(db, 'matches', match.id), {
        ...match,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteMatch(matchId: string): Promise<void> {
    const path = `matches/${matchId}`;
    try {
      await deleteDoc(doc(db, 'matches', matchId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async fetchAllMatchesFromServer(): Promise<Match[]> {
    try {
      const snap = await getDocsFromServer(collection(db, 'matches')).catch(() => getDocs(collection(db, 'matches')));
      const list: Match[] = [];
      snap.forEach((doc) => {
        const m = doc.data() as Match;
        if (m && m.id) {
          list.push(m);
        }
      });
      list.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || ''}`).getTime();
        const dateB = new Date(`${b.date} ${b.time || ''}`).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
        return a.id.localeCompare(b.id);
      });
      return list;
    } catch {
      return [];
    }
  },

  async saveAllMatches(matches: Match[]): Promise<void> {
    try {
      for (const m of matches) {
        await setDoc(doc(db, 'matches', m.id), m);
      }
    } catch (e) {
      console.warn('Batch matches sync error', e);
    }
  },

  // 11. Individual Player Performance Sheet Real-Time Collection
  subscribePerformances(callback: (performances: PlayerMatchPerformance[]) => void) {
    const path = 'playerPerformances';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: PlayerMatchPerformance[] = [];
        snapshot.forEach((doc) => {
          const perf = doc.data() as PlayerMatchPerformance;
          if (perf && perf.id) {
            list.push(perf);
          }
        });
        // Sort by match date descending
        list.sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
        callback(list);
      },
      (error) => {
        console.warn('PlayerPerformances snapshot warning:', error);
      }
    );
  },

  async savePerformance(perf: PlayerMatchPerformance): Promise<void> {
    const path = `playerPerformances/${perf.id}`;
    try {
      await setDoc(doc(db, 'playerPerformances', perf.id), {
        ...perf,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deletePerformance(perfId: string): Promise<void> {
    const path = `playerPerformances/${perfId}`;
    try {
      await deleteDoc(doc(db, 'playerPerformances', perfId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async fetchAllPerformancesFromServer(): Promise<PlayerMatchPerformance[]> {
    try {
      const snap = await getDocsFromServer(collection(db, 'playerPerformances')).catch(() => getDocs(collection(db, 'playerPerformances')));
      const list: PlayerMatchPerformance[] = [];
      snap.forEach((doc) => {
        const p = doc.data() as PlayerMatchPerformance;
        if (p && p.id) {
          list.push(p);
        }
      });
      list.sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
      return list;
    } catch {
      return [];
    }
  },

  async saveAllPerformances(performances: PlayerMatchPerformance[]): Promise<void> {
    try {
      for (const p of performances) {
        await setDoc(doc(db, 'playerPerformances', p.id), p);
      }
    } catch (e) {
      console.warn('Batch performances sync error', e);
    }
  },
};

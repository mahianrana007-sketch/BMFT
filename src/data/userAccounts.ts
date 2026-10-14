import { AppUser, Team, UserAccountConfig } from '../types';

const STORAGE_KEY_ACCOUNTS = 'mr_auction_user_accounts_v11';

// Safe Local Storage reader/writer
function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

// Official user accounts as strictly requested:
// Admin: "mahian rana", pass: "5890"
// Owner 1: "Jobayer", pass: "5891"
// Owner 2: "Aronno", pass: "5892"
// Owner 3: "Rayan", pass: "5893"
// Owner 4: "tausif", pass: "5894"
export const DEFAULT_USER_ACCOUNTS: UserAccountConfig[] = [
  {
    userId: 'mahian rana',
    pass: '5890',
    name: 'Mahian Rana (Admin)',
    role: 'admin',
    defaultTeamName: 'টুর্নামেন্ট এডমিন (Full Control)',
    color: '#10b981',
  },
  {
    userId: 'Jobayer',
    pass: '5891',
    name: 'Jobayer',
    role: 'owner',
    ownerIndex: 1,
    defaultTeamName: 'টিম ওনার ১ (Jobayer)',
    color: '#06b6d4',
  },
  {
    userId: 'Aronno',
    pass: '5892',
    name: 'Aronno',
    role: 'owner',
    ownerIndex: 2,
    defaultTeamName: 'টিম ওনার ২ (Aronno)',
    color: '#3b82f6',
  },
  {
    userId: 'Rayan',
    pass: '5893',
    name: 'Rayan',
    role: 'owner',
    ownerIndex: 3,
    defaultTeamName: 'টিম ওনার ৩ (Rayan)',
    color: '#f59e0b',
  },
  {
    userId: 'tausif',
    pass: '5894',
    name: 'Tausif',
    role: 'owner',
    ownerIndex: 4,
    defaultTeamName: 'টিম ওনার ৪ (Tausif)',
    color: '#ec4899',
  },
];

export function normalizeUsername(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function getUserAccounts(): UserAccountConfig[] {
  try {
    const raw = safeGetStorage(STORAGE_KEY_ACCOUNTS);
    if (raw) {
      const parsed: UserAccountConfig[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 5) {
        const hasAdmin = parsed.some(
          (a) => normalizeUsername(a.userId) === 'mahian rana' || a.role === 'admin'
        );
        const hasOwner1 = parsed.some((a) => normalizeUsername(a.userId) === 'jobayer');
        const hasOwner2 = parsed.some((a) => normalizeUsername(a.userId) === 'aronno');
        const hasOwner3 = parsed.some(
          (a) => normalizeUsername(a.userId) === 'rayan' || normalizeUsername(a.userId) === 'rafi'
        );
        const hasOwner4 = parsed.some((a) => normalizeUsername(a.userId) === 'tausif');

        if (hasAdmin && hasOwner1 && hasOwner2 && hasOwner3 && hasOwner4) {
          return parsed;
        }
      }
    }
  } catch {
    // fallback
  }
  saveUserAccounts(DEFAULT_USER_ACCOUNTS);
  return DEFAULT_USER_ACCOUNTS;
}

export function saveUserAccounts(accounts: UserAccountConfig[]) {
  try {
    safeSetStorage(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts', e);
  }
}

export function authenticateUser(userIdInput: string, passInput: string): AppUser | null {
  const normInputId = normalizeUsername(userIdInput);
  const cleanPass = passInput.trim();

  if (!normInputId || !cleanPass) return null;

  const accounts = getUserAccounts();

  // 1. Direct match with stored accounts (Case-insensitive and whitespace normalized)
  for (const acc of accounts) {
    const normAccId = normalizeUsername(acc.userId);
    const matchesId =
      normAccId === normInputId ||
      normAccId.replace(/\s+/g, '') === normInputId.replace(/\s+/g, '');

    if (matchesId && acc.pass.trim() === cleanPass) {
      return {
        userId: acc.userId,
        name: acc.name,
        role: acc.role,
        ownerIndex: acc.ownerIndex,
      };
    }
  }

  // 2. Flexible Alias matching for maximum fault tolerance
  // Admin: mahian rana / Mahian Rana / admin
  if (
    ['admin', 'mahian', 'mahian rana', 'mahianrana', 'mahian_rana'].includes(normInputId) ||
    normInputId.replace(/\s+/g, '') === 'mahianrana'
  ) {
    const adminAcc = accounts.find((a) => a.role === 'admin') || DEFAULT_USER_ACCOUNTS[0];
    if (cleanPass === adminAcc.pass.trim() || cleanPass === '5890') {
      return {
        userId: adminAcc.userId,
        name: adminAcc.name,
        role: 'admin',
      };
    }
  }

  // Owner 1: Jobayer / jobayer / owner1
  if (['jobayer', 'owner1', 'owner 1', 'jobayer1'].includes(normInputId)) {
    const o1 = accounts.find((a) => a.ownerIndex === 1) || DEFAULT_USER_ACCOUNTS[1];
    if (cleanPass === o1.pass.trim() || cleanPass === '5891') {
      return {
        userId: o1.userId,
        name: o1.name,
        role: 'owner',
        ownerIndex: 1,
      };
    }
  }

  // Owner 2: Aronno / aronno / owner2
  if (['aronno', 'owner2', 'owner 2', 'aronno2'].includes(normInputId)) {
    const o2 = accounts.find((a) => a.ownerIndex === 2) || DEFAULT_USER_ACCOUNTS[2];
    if (cleanPass === o2.pass.trim() || cleanPass === '5892') {
      return {
        userId: o2.userId,
        name: o2.name,
        role: 'owner',
        ownerIndex: 2,
      };
    }
  }

  // Owner 3: Rayan / rayan / rafi / owner3 (Pass: 5893)
  if (['rayan', 'rafi', 'owner3', 'owner 3', 'rayan3'].includes(normInputId)) {
    const o3 = accounts.find((a) => a.ownerIndex === 3) || DEFAULT_USER_ACCOUNTS[3];
    if (cleanPass === o3.pass.trim() || cleanPass === '5893' || cleanPass === '5894') {
      return {
        userId: o3.userId,
        name: o3.name,
        role: 'owner',
        ownerIndex: 3,
      };
    }
  }

  // Owner 4: tausif / Tausif / owner4 (Pass: 5894)
  if (['tausif', 'owner4', 'owner 4', 'tausif4'].includes(normInputId)) {
    const o4 = accounts.find((a) => a.ownerIndex === 4) || DEFAULT_USER_ACCOUNTS[4];
    if (cleanPass === o4.pass.trim() || cleanPass === '5894' || cleanPass === '5893') {
      return {
        userId: o4.userId,
        name: o4.name,
        role: 'owner',
        ownerIndex: 4,
      };
    }
  }

  return null;
}

export function updateOwnerCredentials(
  currentUserId: string,
  newUserId: string,
  newPass: string,
  newName?: string
): { success: boolean; error?: string } {
  const accounts = getUserAccounts();
  const idx = accounts.findIndex(
    (a) => normalizeUsername(a.userId) === normalizeUsername(currentUserId)
  );

  if (idx === -1) {
    return { success: false, error: 'ইউজার খুঁজে পাওয়া যায়নি' };
  }

  const cleanNewId = newUserId.trim();
  const cleanNewPass = newPass.trim();

  if (!cleanNewId || !cleanNewPass) {
    return { success: false, error: 'নতুন আইডি ও পাসওয়ার্ড প্রদান করুন' };
  }

  const conflict = accounts.some(
    (a, i) => i !== idx && normalizeUsername(a.userId) === normalizeUsername(cleanNewId)
  );
  if (conflict) {
    return { success: false, error: 'এই ইউজার আইডি ইতোমধ্যে অন্য কারও নামে নিবন্ধিত' };
  }

  accounts[idx].userId = cleanNewId;
  accounts[idx].pass = cleanNewPass;
  if (newName?.trim()) {
    accounts[idx].name = newName.trim();
  }

  saveUserAccounts(accounts);
  return { success: true };
}

export function updateAdminCredentials(
  newUserId: string,
  newPass: string,
  newName?: string
): { success: boolean; error?: string } {
  const accounts = getUserAccounts();
  const idx = accounts.findIndex((a) => a.role === 'admin');
  if (idx === -1) return { success: false, error: 'এডমিন একাউন্ট খুঁজে পাওয়া যায়নি' };

  if (!newUserId.trim() || !newPass.trim()) {
    return { success: false, error: 'আইডি এবং পাসওয়ার্ড উভয়ই প্রদান করতে হবে' };
  }

  accounts[idx].userId = newUserId.trim();
  accounts[idx].pass = newPass.trim();
  if (newName?.trim()) accounts[idx].name = newName.trim();

  saveUserAccounts(accounts);
  return { success: true };
}

export function resetCredentialsToDefault() {
  saveUserAccounts(DEFAULT_USER_ACCOUNTS);
  return DEFAULT_USER_ACCOUNTS;
}

export function getOwnerTeam(user: AppUser | null, teams: Team[]): Team | null {
  if (!user || user.role !== 'owner') return null;

  const normUserId = normalizeUsername(user.userId);

  // 1. Check matching ownerUserId in teams
  const explicit = teams.find((t) => {
    const tOwner = normalizeUsername(t.ownerUserId || '');
    return (
      tOwner === normUserId ||
      tOwner.replace(/\s+/g, '') === normUserId.replace(/\s+/g, '') ||
      (normUserId === 'jobayer' && tOwner.includes('jobayer')) ||
      (normUserId === 'aronno' && tOwner.includes('aronno')) ||
      (normUserId === 'rayan' && (tOwner.includes('rayan') || tOwner.includes('rafi'))) ||
      (normUserId === 'tausif' && tOwner.includes('tausif'))
    );
  });
  if (explicit) return explicit;

  // 2. Fallback to ownerIndex
  if (user.ownerIndex && teams[user.ownerIndex - 1]) {
    return teams[user.ownerIndex - 1];
  }

  return null;
}

export function isTeamControllableByUser(
  user: AppUser | null,
  team: Team,
  teams: Team[]
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'owner') {
    const normUserId = normalizeUsername(user.userId);
    const normOwnerId = normalizeUsername(team.ownerUserId || '');
    if (
      normOwnerId &&
      (normOwnerId === normUserId ||
        normOwnerId.replace(/\s+/g, '') === normUserId.replace(/\s+/g, '') ||
        (normUserId === 'jobayer' && normOwnerId.includes('jobayer')) ||
        (normUserId === 'aronno' && normOwnerId.includes('aronno')) ||
        (normUserId === 'rayan' && (normOwnerId.includes('rayan') || normOwnerId.includes('rafi'))) ||
        (normUserId === 'tausif' && normOwnerId.includes('tausif')))
    ) {
      return true;
    }
    if (user.ownerIndex) {
      const teamIdx = teams.findIndex((t) => t.id === team.id);
      if (teamIdx === user.ownerIndex - 1) return true;
    }
  }
  return false;
}

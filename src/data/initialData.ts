import { Player, Team, AuctionSettings, AuctionHistoryItem, PlayerCategory, LiveAuctionState } from '../types';

export const INITIAL_SETTINGS: AuctionSettings = {
  tournamentName: 'MR Football Auction Premier League',
  seasonYear: '2026',
  initialBudgetPerTeam: 10000,
  totalTournamentBudget: 40000,
  defaultBasePrice: 200,
  bidIncrement: 100,
  maxBidIncrement: 1000,
  squadLimit: 7, // Max 7 auction players per team (Total 8 squad size with Owner)
  timerSeconds: 30,
  soundEnabled: true,
  allowPlayerSelfRegistration: true,
};

export const INITIAL_CATEGORIES: PlayerCategory[] = [
  { id: 'cat-icon', name: 'Iconic Player', code: 'ICON', basePrice: 1000, color: '#f59e0b', description: 'আইকন ও শীর্ষ তারকা প্লেয়ার' },
  { id: 'cat-a', name: 'Category A Player', code: 'A', basePrice: 500, color: '#10b981', description: 'উচ্চমানের এ-গ্রেড প্লেয়ার' },
  { id: 'cat-b', name: 'Category B Player', code: 'B', basePrice: 300, color: '#3b82f6', description: 'মধ্যমানের বি-গ্রেড প্লেয়ার' },
  { id: 'cat-c', name: 'Category C Player', code: 'C', basePrice: 150, color: '#8b5cf6', description: 'সি-গ্রেড ও সম্ভাবনাময় প্লেয়ার' },
];

export function findCategoryForPlayer(
  categories: PlayerCategory[],
  categoryNameOrCode?: string
): PlayerCategory | undefined {
  if (!categoryNameOrCode) return undefined;
  const target = categoryNameOrCode.trim().toLowerCase();

  return categories.find((c) => {
    const cName = c.name.toLowerCase();
    const cCode = c.code.toLowerCase();
    const cId = c.id.toLowerCase();

    if (cName === target || cCode === target || cId === target) return true;

    // Iconic Player matches "icon", "iconic", "icon player"
    if (target.includes('icon') && (cCode === 'icon' || cName.includes('icon'))) return true;

    // Category A matches "category a", "a category", "cat a"
    if ((target === 'a' || target === 'a category' || target === 'category a' || target === 'category a player') && (cCode === 'a' || cName.includes('a'))) return true;

    // Category B matches "category b", "b category", "cat b"
    if ((target === 'b' || target === 'b category' || target === 'category b' || target === 'category b player') && (cCode === 'b' || cName.includes('b'))) return true;

    // Category C matches "category c", "c category", "cat c"
    if ((target === 'c' || target === 'c category' || target === 'category c' || target === 'category c player') && (cCode === 'c' || cName.includes('c'))) return true;

    return false;
  });
}

export const INITIAL_AUCTION_STATE: LiveAuctionState = {
  activePlayerId: null,
  currentBid: 0,
  highestBidTeamId: null,
  highestBidTeamName: null,
  highestBidderName: null,
  bidSequence: [],
  timerSeconds: 30,
  isTimerRunning: false,
  status: 'idle',
  lastActionTimestamp: Date.now(),
  reservedAmount: 0,
  reservedTeamId: null,
};

export const INITIAL_TEAMS: Team[] = [];

export const INITIAL_PLAYERS: Player[] = [];

export const INITIAL_AUCTION_HISTORY: AuctionHistoryItem[] = [];

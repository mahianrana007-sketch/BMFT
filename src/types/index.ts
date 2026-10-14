export type Position = 'GK' | 'DEF' | 'MID' | 'ST';

export type PlayerStatus = 'available' | 'live' | 'sold' | 'unsold';

export type PlayerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CareerStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets?: number;
  yellowCards: number;
  redCards: number;
  passAccuracy?: number;
  shotAccuracy?: number;
}

export interface PreviousTeamHistory {
  year: string;
  teamName: string;
  tournament: string;
  achievement?: string;
}

export interface PlayerCategory {
  id: string;
  name: string;
  code: string;
  basePrice: number;
  color: string;
  description?: string;
}

export interface Player {
  id: string; // e.g., "PL-101"
  name: string;
  age: number;
  mobile: string;
  jerseyNumber: number;
  position: Position;
  rating: number; // 1 to 10
  experience: string;
  basePrice: number;
  status: PlayerStatus;
  approvalStatus?: PlayerApprovalStatus;
  category?: string; // e.g. "Icon Player", "A Category", "B Category", "C Category"
  teamId?: string | null;
  soldPrice?: number | null;
  photoUrl: string;
  notes?: string;
  bio?: string;
  preferredFoot?: 'Right' | 'Left' | 'Both';
  height?: string;
  weight?: string;
  careerStats?: CareerStats;
  previousTeams?: PreviousTeamHistory[];
  createdAt: string;
  registeredViaLink?: boolean;
  pin?: string;
}

export interface LiveAuctionState {
  activePlayerId: string | null;
  currentBid: number;
  highestBidTeamId: string | null;
  highestBidTeamName: string | null;
  highestBidderName?: string | null;
  bidSequence: BidRecord[];
  timerSeconds: number;
  isTimerRunning: boolean;
  timerStartedAt?: number;
  status: 'idle' | 'bidding' | 'paused' | 'sold' | 'unsold';
  lastActionTimestamp?: number;
  // Reservation System for Owner balance locks
  reservedAmount?: number;
  reservedTeamId?: string | null;
}

export interface Team {
  id: string;
  name: string;
  ownerName?: string;
  ownerUserId?: string; // 'Jobayer' | 'Aronno' | 'Rayan' | 'tausif'
  logoUrl: string;
  initialBudget: number; // e.g. 10,000 pts
  color: string;
  shortName?: string;
  stadium?: string;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'postponed';

export interface GoalEvent {
  id: string;
  playerId?: string;
  playerName: string;
  teamId: string;
  minute?: number;
  assistPlayerId?: string;
  assistPlayerName?: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
}

export interface AssistEvent {
  id: string;
  playerId?: string;
  playerName: string;
  teamId: string;
  minute?: number;
}

export interface Match {
  id: string;
  matchNumber?: number;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo?: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo?: string;
  homeScore?: number;
  awayScore?: number;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "04:30 PM"
  venue: string; // e.g. "Faridpur Stadium"
  status: MatchStatus;
  round?: string; // e.g. "ম্যাচডে ১"
  goals?: GoalEvent[];
  assists?: AssistEvent[];
  manOfTheMatchPlayerId?: string;
  manOfTheMatchName?: string;
  notes?: string;
  updatedAt?: string;
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  color?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  recentForm: ('W' | 'D' | 'L')[];
}

export interface PlayerLeaderboardItem {
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  teamId?: string | null;
  teamName?: string;
  jerseyNumber?: number;
  position?: Position;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export interface BidRecord {
  id: string;
  teamId: string;
  teamName: string;
  amount: number;
  timestamp: string;
  placedByRole?: 'admin' | 'owner' | 'player';
  placedByName?: string;
}

export interface AuctionHistoryItem {
  id: string;
  playerId: string;
  playerName: string;
  playerPhoto: string;
  jerseyNumber: number;
  position: Position;
  teamId?: string | null;
  teamName?: string | null;
  winningBid: number;
  basePrice: number;
  status: 'sold' | 'unsold' | 'cancelled';
  actionBy: string;
  timestamp: string;
  bidSequence: BidRecord[];
  editNote?: string;
  previousRecord?: {
    teamId?: string | null;
    winningBid?: number;
    status?: string;
    editedAt: string;
  };
}

export interface AuctionSettings {
  tournamentName: string;
  seasonYear: string;
  initialBudgetPerTeam: number;
  totalTournamentBudget: number;
  defaultBasePrice: number;
  bidIncrement: number;
  maxBidIncrement: number;
  squadLimit: number;
  timerSeconds: number;
  soundEnabled: boolean;
  allowPlayerSelfRegistration: boolean;
}

export type NotificationType =
  | 'bid_placed'
  | 'player_sold'
  | 'player_unsold'
  | 'auction_started'
  | 'settings_updated'
  | 'player_registered'
  | 'profile_updated'
  | 'user_logged_in';

export interface UserSession {
  id: string;
  userId: string;
  name: string;
  role: 'admin' | 'owner' | 'player' | 'spectator';
  deviceInfo?: string;
  loginTime: string;
  lastActive: string;
  status: 'online' | 'offline';
  ip?: string;
}

export interface AuctionNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isoTime?: string;
  highlightColor?: string;
  data?: Record<string, unknown>;
}

export type UserRole = 'admin' | 'owner' | 'player' | 'spectator';

export interface AppUser {
  userId: string;
  name: string;
  role: 'admin' | 'owner' | 'player';
  ownerIndex?: number; // 1, 2, 3, 4
  assignedTeamId?: string;
  playerId?: string;
  mobile?: string;
}

export interface UserAccountConfig {
  userId: string;
  pass: string;
  name: string;
  role: 'admin' | 'owner';
  ownerIndex?: number;
  defaultTeamName: string;
  color: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  role: string;
  status: 'GRANTED' | 'BLOCKED' | 'SUSPICIOUS';
  details: string;
}

export interface PlayerMatchPerformance {
  id: string; // Unique performance entry ID (e.g., "PERF-123456")
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  teamId?: string | null;
  teamName?: string;
  matchId?: string;
  matchTitle: string; // e.g. "ম্যাচ ১: ব্রাদার্স ইউনিয়ন বনাম আবাহনী"
  matchDate: string; // YYYY-MM-DD
  matchesPlayed: number; // 1 or 0
  minutesPlayed: number; // Minutes on pitch
  goals: number;
  assists: number;
  keyPasses: number;
  shotsOnTarget: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  cleanSheets: number; // 0 or 1
  saves: number; // Goalkeeper Saves
  goalsConceded: number; // Goals Conceded
  yellowCards: number;
  redCards: number;
  rating: number; // 1.0 to 10.0
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlayerAggregatedStats {
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  jerseyNumber?: number;
  position?: Position;
  teamId?: string | null;
  teamName?: string;
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  keyPasses: number;
  shotsOnTarget: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  cleanSheets: number;
  saves: number;
  goalsConceded: number;
  yellowCards: number;
  redCards: number;
  averageRating: number;
  matchLogs: PlayerMatchPerformance[];
}

export interface TournamentAwardLeaderboard {
  playerOfTheTournament: (PlayerAggregatedStats & { mvpScore: number })[];
  bestDefenders: (PlayerAggregatedStats & { defenseScore: number })[];
  bestGoalkeepers: (PlayerAggregatedStats & { gkScore: number })[];
  topScorers: PlayerAggregatedStats[];
  topPlaymakers: PlayerAggregatedStats[];
}

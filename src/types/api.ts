/**
 * API Type Definitions
 * These types define the structure of data exchanged with the backend
 */

// ============================================================================
// USER & WALLET TYPES
// ============================================================================

export interface User {
  id: string;
  username: string;
  walletAddress: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  address: string;
  balance: number; // SOL balance
  encryptedPrivateKey?: string; // Encrypted on backend
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'game_stake' | 'game_win' | 'referral_reward';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string; // Solana transaction hash
  createdAt: string;
}

// ============================================================================
// GAME TYPES
// ============================================================================

export interface GameLobby {
  id: string;
  mode: 'random' | 'friend';
  stake: number;
  createdBy: string;
  playerCount: number;
  maxPlayers: 2;
  status: 'waiting' | 'starting' | 'in_progress' | 'completed';
  code?: string; // For friend games
  createdAt: string;
}

export interface GameSession {
  id: string;
  lobbyId: string;
  players: GamePlayer[];
  stake: number;
  platformFee: number;
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GamePlayer {
  userId: string;
  username: string;
  avatar?: string;
  walletAddress: string;
  reactionTime?: number;
  position?: number;
  ready: boolean;
}

export interface GameResult {
  sessionId: string;
  winner: GamePlayer;
  loser: GamePlayer;
  winnerReactionTime: number;
  loserReactionTime: number;
  prizeAmount: number;
  platformFee: number;
  timestamp: string;
}

// ============================================================================
// AMBASSADOR/REFERRAL TYPES
// ============================================================================

export interface AmbassadorProfile {
  userId: string;
  referralCode: string;
  tier: 'bronze' | 'silver' | 'gold';
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pointsPerReferral: number;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUsername: string;
  status: 'pending' | 'active' | 'inactive';
  totalGamesPlayed: number;
  totalEarnings: number;
  joinedAt: string;
}

export interface ReferralReward {
  id: string;
  referrerId: string;
  referredUserId: string;
  gameSessionId: string;
  points: number;
  amount: number;
  createdAt: string;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface PlayerStats {
  userId: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageReactionTime: number;
  bestReactionTime: number;
  totalWinnings: number;
  totalLosses: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  wins: number;
  winRate: number;
  totalWinnings: number;
  averageReactionTime: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth
export interface LoginRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Wallet
export interface CreateWalletRequest {
  username: string;
  encryptedSeed: string; // Encrypted seed phrase
  password: string; // For encryption
}

export interface DepositRequest {
  amount: number;
  txHash: string;
}

export interface WithdrawRequest {
  amount: number;
  toAddress: string;
}

// Game
export interface CreateLobbyRequest {
  mode: 'random' | 'friend';
  stake: number;
}

export interface JoinLobbyRequest {
  lobbyId?: string;
  code?: string;
}

export interface GameActionRequest {
  sessionId: string;
  action: 'ready' | 'click' | 'forfeit';
  timestamp: number;
  reactionTime?: number;
}

// Ambassador
export interface CreateReferralCodeRequest {
  customCode?: string;
}

// ============================================================================
// WEBSOCKET MESSAGE TYPES
// ============================================================================

export type WSPayloadMap = {
  'lobby:update': WSLobbyUpdate;
  'lobby:player_joined': WSLobbyUpdate;
  'lobby:player_left': WSLobbyUpdate;
  'game:start': WSGameStart;
  'game:countdown': WSGameCountdown;
  'game:show_button': WSGameShowButton;
  'game:player_clicked': WSGamePlayerClicked;
  'game:result': WSGameResult;
  'game:end': WSGameResult;
  error: WSError;
  ping: Record<string, never>;
  pong: Record<string, never>;
};

export type WSMessageType = keyof WSPayloadMap;

export interface WSMessage<T extends WSMessageType = WSMessageType> {
  type: T;
  payload: WSPayloadMap[T];
  timestamp: number;
}

export interface WSLobbyUpdate {
  lobby: GameLobby;
}

export interface WSGameStart {
  sessionId: string;
  players: GamePlayer[];
  stake: number;
}

export interface WSGameCountdown {
  count: number;
}

export interface WSGameShowButton {
  showTime: number;
}

export interface WSGamePlayerClicked {
  userId: string;
  reactionTime: number;
}

export interface WSGameResult {
  result: GameResult;
}

export interface WSError {
  code: string;
  message: string;
}

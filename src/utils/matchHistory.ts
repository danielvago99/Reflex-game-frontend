// Match History System - Store recent matches in localStorage

export interface MatchRecord {
  id: string;
  matchType: 'ranked' | 'friend' | 'bot'; // Only ranked and friend count for daily challenges
  result: 'win' | 'loss';
  stakeAmount: number;
  profit: number; // Net profit/loss (after platform fee)
  timestamp: number;
  playerScore: number;
  opponentScore: number;
}

const STORAGE_KEY = 'reflex_match_history';
const MAX_STORED_MATCHES = 20; // Store up to 20 recent matches
export const MATCH_HISTORY_UPDATED_EVENT = 'match-history-updated';

// Get match history from localStorage
export function getMatchHistory(): MatchRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const matches: MatchRecord[] = JSON.parse(stored);
    return matches;
  } catch (error) {
    console.error('Error loading match history:', error);
    return [];
  }
}

// Add a new match to history
export function addMatchToHistory(match: Omit<MatchRecord, 'id' | 'timestamp'>): void {
  try {
    const history = getMatchHistory();
    
    const newMatch: MatchRecord = {
      ...match,
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    // Add to beginning of array (most recent first)
    history.unshift(newMatch);
    
    // Keep only the most recent matches
    const trimmedHistory = history.slice(0, MAX_STORED_MATCHES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(MATCH_HISTORY_UPDATED_EVENT, {
          detail: newMatch,
        })
      );
    }
  } catch (error) {
    console.error('Error saving match to history:', error);
  }
}

// Get recent matches for dashboard display (last 5)
export function getRecentMatches(limit: number = 5): Array<{
  result: string;
  amount: string;
  time: string;
  color: string;
  matchType: string;
}> {
  const history = getMatchHistory();
  
  return history.slice(0, limit).map(match => {
    // Format time
    const now = Date.now();
    const diff = now - match.timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    let timeStr = '';
    if (days > 0) timeStr = `${days}d ago`;
    else if (hours > 0) timeStr = `${hours}h ago`;
    else if (minutes > 0) timeStr = `${minutes}m ago`;
    else timeStr = 'Just now';
    
    // Format result
    let resultStr = '';
    let color = '';
    let amountStr = '';
    
    if (match.result === 'win') {
      resultStr = match.matchType === 'bot' ? 'Practice Win' : 'Victory';
      color = '#00FFA3';
      amountStr = match.stakeAmount > 0 ? `+${match.profit.toFixed(4)} SOL` : 'Free Play';
    } else {
      resultStr = match.matchType === 'bot' ? 'Practice Loss' : 'Defeat';
      color = '#FF4444';
      amountStr = match.stakeAmount > 0 ? `-${match.stakeAmount.toFixed(4)} SOL` : 'Free Play';
    }
    
    // Add match type indicator
    const matchTypeLabel = match.matchType === 'friend' ? ' (Friend)' : match.matchType === 'bot' ? ' (Practice)' : '';
    
    return {
      result: `${resultStr}${matchTypeLabel} (${match.playerScore}-${match.opponentScore})`,
      amount: amountStr,
      time: timeStr,
      color,
      matchType: match.matchType
    };
  });
}

// Clear all match history (for settings/reset)
export function clearMatchHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Get stats from match history
export function getMatchStats() {
  const history = getMatchHistory();
  
  const totalMatches = history.length;
  const wins = history.filter(m => m.result === 'win').length;
  const losses = history.filter(m => m.result === 'loss').length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  
  // Only ranked and friend matches
  const rankedMatches = history.filter(m => m.matchType === 'ranked' || m.matchType === 'friend');
  const totalEarnings = rankedMatches.reduce((sum, m) => {
    if (m.result === 'win') return sum + m.profit;
    if (m.result === 'loss') return sum - m.stakeAmount;
    return sum;
  }, 0);
  
  return {
    totalMatches,
    wins,
    losses,
    winRate,
    totalEarnings,
    rankedCount: rankedMatches.length
  };
}

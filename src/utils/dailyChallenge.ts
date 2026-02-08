// Daily Challenge System - Complete 5 Matches Daily
// Weekly Streak Bonus: 7 days = 50 bonus points

export interface DailyChallengeState {
  matchesCompleted: number; // Today's matches
  lastCompletedDate: string; // ISO date string
  currentStreak: number; // Consecutive days
  totalDaysCompleted: number; // All-time
  weeklyStreakClaimed: boolean; // If weekly bonus claimed this week
  lastStreakBonusDate: string; // Last time they got the 7-day bonus
}

const STORAGE_KEY = 'reflex_daily_challenge';
const MATCHES_TARGET = 5;
const DAILY_REWARD = 10;
const WEEKLY_STREAK_TARGET = 7;
const WEEKLY_BONUS = 50;

// Get current challenge state
export function getDailyChallengeState(): DailyChallengeState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initialState: DailyChallengeState = {
        matchesCompleted: 0,
        lastCompletedDate: '',
        currentStreak: 0,
        totalDaysCompleted: 0,
        weeklyStreakClaimed: false,
        lastStreakBonusDate: ''
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
      return initialState;
    }

    const state: DailyChallengeState = JSON.parse(stored);
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastDate = state.lastCompletedDate.split('T')[0];
    const lastMatchAt = state.lastCompletedDate ? new Date(state.lastCompletedDate) : null;
    const hoursSinceLastMatch = lastMatchAt ? now.getTime() - lastMatchAt.getTime() : 0;

    if (lastMatchAt && hoursSinceLastMatch >= 24 * 60 * 60 * 1000) {
      return {
        ...state,
        matchesCompleted: 0,
        currentStreak: 0
      };
    }

    // Check if it's a new day
    if (lastDate && lastDate !== today) {
      // Check if they completed yesterday's challenge
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (lastDate === yesterday && state.matchesCompleted >= MATCHES_TARGET) {
        // Streak continues - reset matches but keep streak
        return {
          ...state,
          matchesCompleted: 0,
          currentStreak: state.currentStreak
        };
      }

      // Didn't complete yesterday or missed the day - break streak
      return {
        ...state,
        matchesCompleted: 0,
        currentStreak: 0
      };
    }

    return state;
  } catch (error) {
    console.error('Error loading daily challenge:', error);
    const initialState: DailyChallengeState = {
      matchesCompleted: 0,
      lastCompletedDate: '',
      currentStreak: 0,
      totalDaysCompleted: 0,
      weeklyStreakClaimed: false,
      lastStreakBonusDate: ''
    };
    return initialState;
  }
}

// Save challenge state
function saveChallengeState(state: DailyChallengeState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Record a completed match
export function recordMatchCompletion(): {
  newProgress: number;
  dailyCompleted: boolean;
  rewardEarned: number;
  streakIncreased: boolean;
  newStreak: number;
  weeklyBonusEarned: boolean;
  weeklyBonus: number;
} {
  const state = getDailyChallengeState();
  const today = new Date().toISOString();
  
  // Increment matches
  const newMatchesCompleted = Math.min(state.matchesCompleted + 1, MATCHES_TARGET);
  const dailyCompleted = newMatchesCompleted === MATCHES_TARGET && state.matchesCompleted < MATCHES_TARGET;
  
  let rewardEarned = 0;
  let streakIncreased = false;
  let newStreak = state.currentStreak;
  let weeklyBonusEarned = false;
  let weeklyBonus = 0;
  let totalDaysCompleted = state.totalDaysCompleted;

  // If just completed the daily challenge
  if (dailyCompleted) {
    rewardEarned = DAILY_REWARD;
    newStreak = state.currentStreak + 1;
    streakIncreased = true;
    totalDaysCompleted += 1;

    // Add reward to Reflex Points
    const reflexPoints = parseInt(localStorage.getItem('reflexPoints') || '0');
    localStorage.setItem('reflexPoints', (reflexPoints + DAILY_REWARD).toString());

    // Check for weekly streak bonus
    if (newStreak >= WEEKLY_STREAK_TARGET) {
      const lastBonusDate = state.lastStreakBonusDate.split('T')[0];
      const todayDate = today.split('T')[0];
      
      // Only give bonus once per week
      if (lastBonusDate !== todayDate) {
        weeklyBonusEarned = true;
        weeklyBonus = WEEKLY_BONUS;
        localStorage.setItem('reflexPoints', (reflexPoints + DAILY_REWARD + WEEKLY_BONUS).toString());
        
        // Update state with bonus claim
        saveChallengeState({
          ...state,
          matchesCompleted: newMatchesCompleted,
          lastCompletedDate: today,
          currentStreak: newStreak,
          totalDaysCompleted,
          weeklyStreakClaimed: true,
          lastStreakBonusDate: today
        });
        
        return {
          newProgress: newMatchesCompleted,
          dailyCompleted,
          rewardEarned: DAILY_REWARD + WEEKLY_BONUS,
          streakIncreased,
          newStreak,
          weeklyBonusEarned,
          weeklyBonus
        };
      }
    }
  }

  // Save updated state
  saveChallengeState({
    ...state,
    matchesCompleted: newMatchesCompleted,
    lastCompletedDate: newMatchesCompleted > state.matchesCompleted ? today : state.lastCompletedDate,
    currentStreak: newStreak,
    totalDaysCompleted,
    weeklyStreakClaimed: state.weeklyStreakClaimed,
    lastStreakBonusDate: state.lastStreakBonusDate
  });

  return {
    newProgress: newMatchesCompleted,
    dailyCompleted,
    rewardEarned,
    streakIncreased,
    newStreak,
    weeklyBonusEarned,
    weeklyBonus
  };
}

// Get challenge info
export function getDailyChallengeInfo() {
  const state = getDailyChallengeState();
  const progressPercent = Math.round((state.matchesCompleted / MATCHES_TARGET) * 100);
  const matchesRemaining = Math.max(0, MATCHES_TARGET - state.matchesCompleted);
  const isCompleted = state.matchesCompleted >= MATCHES_TARGET;
  const daysUntilWeeklyBonus = Math.max(0, WEEKLY_STREAK_TARGET - state.currentStreak);

  return {
    matchesCompleted: state.matchesCompleted,
    matchesTarget: MATCHES_TARGET,
    matchesRemaining,
    progressPercent,
    isCompleted,
    currentStreak: state.currentStreak,
    daysUntilWeeklyBonus,
    dailyReward: DAILY_REWARD,
    weeklyBonus: WEEKLY_BONUS,
    totalDaysCompleted: state.totalDaysCompleted
  };
}

// Get time until daily reset
export function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

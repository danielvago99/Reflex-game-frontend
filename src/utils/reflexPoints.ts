// Reflex Points utility functions

export interface ReflexPointsData {
  points: number;
  dailyProgress: number;
  lastDailyClaim: number | null;
  dailyStreak: number;
  ambassadorRewards: number;
  freeStakes: FreeStake[];
}

export interface FreeStake {
  amount: number;
  id: string;
  redeemedAt: number;
}

// Get current Reflex Points balance
export function getReflexPoints(): number {
  return parseInt(localStorage.getItem('reflexPoints') || '0');
}

// Set Reflex Points balance
export function setReflexPoints(points: number): void {
  localStorage.setItem('reflexPoints', points.toString());
}

// Add Reflex Points
export function addReflexPoints(points: number): void {
  const current = getReflexPoints();
  setReflexPoints(current + points);
}

// Deduct Reflex Points
export function deductReflexPoints(points: number): boolean {
  const current = getReflexPoints();
  if (current >= points) {
    setReflexPoints(current - points);
    return true;
  }
  return false;
}

// Get daily match progress
export function getDailyProgress(): number {
  return parseInt(localStorage.getItem('dailyMatchProgress') || '0');
}

// Increment daily match progress
export function incrementDailyProgress(): void {
  const current = getDailyProgress();
  localStorage.setItem('dailyMatchProgress', (current + 1).toString());
}

// Get free stakes
export function getFreeStakes(): FreeStake[] {
  const stakes = localStorage.getItem('freeStakes');
  return stakes ? JSON.parse(stakes) : [];
}

// Add free stake
export function addFreeStake(amount: number): void {
  const stakes = getFreeStakes();
  stakes.push({
    amount,
    id: `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    redeemedAt: Date.now()
  });
  localStorage.setItem('freeStakes', JSON.stringify(stakes));
}

// Use free stake
export function useFreeStake(id: string): boolean {
  const stakes = getFreeStakes();
  const index = stakes.findIndex(stake => stake.id === id);
  if (index !== -1) {
    stakes.splice(index, 1);
    localStorage.setItem('freeStakes', JSON.stringify(stakes));
    return true;
  }
  return false;
}

// Redeem points for stake
export function redeemForStake(amount: number, cost: number): boolean {
  if (deductReflexPoints(cost)) {
    addFreeStake(amount);
    return true;
  }
  return false;
}

// Get ambassador rewards
export function getAmbassadorRewards(): number {
  return parseInt(localStorage.getItem('ambassadorRewardPoints') || '0');
}

// Add ambassador reward
export function addAmbassadorReward(points: number): void {
  const current = getAmbassadorRewards();
  localStorage.setItem('ambassadorRewardPoints', (current + points).toString());
}

// Get all data
export function getAllReflexData(): ReflexPointsData {
  return {
    points: getReflexPoints(),
    dailyProgress: getDailyProgress(),
    lastDailyClaim: localStorage.getItem('lastDailyRewardClaim') ? parseInt(localStorage.getItem('lastDailyRewardClaim')!) : null,
    dailyStreak: parseInt(localStorage.getItem('dailyStreak') || '0'),
    ambassadorRewards: getAmbassadorRewards(),
    freeStakes: getFreeStakes()
  };
}

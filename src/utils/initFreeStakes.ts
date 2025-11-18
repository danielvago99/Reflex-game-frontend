import { addFreeStake } from './reflexPoints';

// Initialize some free stakes for testing
export function initializeFreeStakes() {
  const stakes = localStorage.getItem('freeStakes');
  
  // Only initialize if there are no stakes
  if (!stakes || JSON.parse(stakes).length === 0) {
    // Add 3 free stakes for testing
    addFreeStake(0.05);
    addFreeStake(0.1);
    addFreeStake(0.2);
    
    console.log('✅ Initialized 3 free stakes for testing');
  }
}

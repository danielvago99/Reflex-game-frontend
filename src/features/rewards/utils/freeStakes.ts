import type { RewardsData } from '../hooks/useRewardsData';

export interface FreeStakeOption {
  amount: number;
  count: number;
}

const stakeConfig: Array<{ amount: number; key: keyof RewardsData }> = [
  { amount: 0.05, key: 'freeStakes005' },
  { amount: 0.1, key: 'freeStakes010' },
  { amount: 0.2, key: 'freeStakes020' },
];

export const getFreeStakeOptions = (data?: RewardsData | null): FreeStakeOption[] =>
  stakeConfig
    .map(({ amount, key }) => ({
      amount,
      count: data?.[key] ?? 0,
    }))
    .filter(option => option.count > 0);

export const getFreeStakeTotal = (options: FreeStakeOption[]): number =>
  options.reduce((total, option) => total + option.count, 0);

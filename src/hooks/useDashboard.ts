import { useCallback, useEffect, useState } from 'react';
import { ENV } from '../config/env';
import { useAuth } from '../features/auth/hooks/useAuth';

export interface DashboardResponse {
  profile: {
    id: string;
    username?: string | null;
    avatar?: string | null;
    walletAddress: string;
  };
  stats: {
    totalWins: number;
    totalMatches: number;
    totalReflexPoints: number;
    winRate: number;
    freeStakes: {
      stake005: number;
      stake010: number;
      stake020: number;
    };
  } | null;
  ambassador: {
    code: string;
    tier: string;
    totalReferrals: number;
    activeReferrals: number;
    totalReflexEarned: number;
    totalSolBonus: string;
  } | null;
  dailyChallenge: {
    date: string;
    matchesPlayed: number;
    completed: boolean;
    rewardClaimed: boolean;
  } | null;
}

interface UseDashboardResult {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${ENV.API_BASE_URL}/user/dashboard`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to load dashboard');
      }

      const body = (await response.json()) as DashboardResponse;
      setData(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refreshDashboard: fetchDashboard,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, type AuthUser, useAuth } from './useAuth';

export interface PlayerStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  bestReactionMs?: number | null;
  averageReactionMs?: number | null;
  totalReflexPoints: number;
  totalSolWagered?: string | number | null;
  totalSolWon?: string | number | null;
}

export interface DashboardUser extends AuthUser {
  stats?: PlayerStats | null;
}

interface DashboardResponse {
  user: DashboardUser;
}

export function useUserDashboard() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to load dashboard');
      }

      const data = (await response.json()) as DashboardResponse;
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      void fetchDashboard();
    } else {
      setUser(null);
    }
  }, [authUser, fetchDashboard]);

  return {
    user,
    loading: loading || authLoading,
    error,
    refresh: fetchDashboard,
  };
}

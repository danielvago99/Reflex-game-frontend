import { useCallback, useEffect, useState } from 'react';
import { MATCH_HISTORY_UPDATED_EVENT } from '../../../utils/matchHistory';
import { API_BASE_URL, type AuthUser, useAuth } from './useAuth';

export interface PlayerStats {
  userId?: string;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  avgReaction?: number | null;
  bestReaction?: number | null;
  totalSolWon: number;
  totalSolLost: number;
  totalVolumeSolPlayed: number;
  currentStreak: number;
  longestStreak: number;
}

export interface DashboardUser extends AuthUser {
  stats?: PlayerStats | null;
}

interface DashboardResponse {
  user: DashboardUser;
}

export function useUserDashboard() {
  const { user: authUser, loading: authLoading, refresh: refreshAuth } = useAuth();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeStats = useCallback((stats?: Partial<PlayerStats> | null): PlayerStats | null => {
    if (!stats) return null;

    const toNumber = (value?: number | string | null, defaultValue = 0) => {
      if (value == null) return defaultValue;
      const parsed = typeof value === 'string' ? Number(value) : value;
      return Number.isFinite(parsed) ? parsed : defaultValue;
    };

    const toNullableNumber = (value?: number | string | null) => {
      if (value == null) return null;
      const parsed = typeof value === 'string' ? Number(value) : value;
      return Number.isFinite(parsed) ? parsed : null;
    };

    const winRate = typeof stats.winRate === 'number' ? stats.winRate : toNumber(stats.winRate, 0);
    const bestReaction = toNullableNumber(stats.bestReaction);
    const normalizedBestReaction =
      bestReaction != null && bestReaction >= 9999 ? null : bestReaction;

    return {
      userId: stats.userId,
      totalMatches: toNumber(stats.totalMatches),
      totalWins: toNumber(stats.totalWins),
      totalLosses: toNumber(stats.totalLosses),
      winRate,
      avgReaction: toNullableNumber(stats.avgReaction),
      bestReaction: normalizedBestReaction,
      totalSolWon: toNumber(stats.totalSolWon),
      totalSolLost: toNumber(stats.totalSolLost),
      totalVolumeSolPlayed: toNumber(stats.totalVolumeSolPlayed),
      currentStreak: toNumber(stats.currentStreak),
      longestStreak: toNumber(stats.longestStreak),
    };
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401) {
        setUser(null);
        setError('Please log in to view your dashboard.');
        localStorage.removeItem('auth_token');
        await refreshAuth();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to load dashboard');
      }

      const data = (await response.json()) as DashboardResponse;
      const normalizedStats = normalizeStats(data.user?.stats ?? null);

      setUser({ ...data.user, stats: normalizedStats ?? undefined });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authUser, normalizeStats, refreshAuth]);

  useEffect(() => {
    if (authUser) {
      void fetchDashboard();
    } else {
      setUser(null);
    }
  }, [authUser, fetchDashboard]);

  useEffect(() => {
    const handleMatchUpdate = () => {
      void fetchDashboard();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(MATCH_HISTORY_UPDATED_EVENT, handleMatchUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(MATCH_HISTORY_UPDATED_EVENT, handleMatchUpdate);
      }
    };
  }, [fetchDashboard]);

  return {
    user,
    loading: loading || authLoading,
    error,
    refresh: fetchDashboard,
  };
}

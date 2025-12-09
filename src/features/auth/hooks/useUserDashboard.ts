import { useCallback, useEffect, useState } from 'react';
import { MATCH_HISTORY_UPDATED_EVENT } from '../../../utils/matchHistory';
import { API_BASE_URL, type AuthUser, useAuth } from './useAuth';

export interface PlayerStats {
  id?: string;
  userId?: string;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  bestReactionMs?: number | null;
  averageReactionMs?: number | null;
  currentStreak?: number | null;
  bestStreak?: number | null;
  totalReflexPoints: number;
  totalSolWagered?: number | string | null;
  totalSolWon?: number | string | null;
  freeStakes005?: number;
  freeStakes010?: number;
  freeStakes020?: number;
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

  const normalizeStats = useCallback((stats?: PlayerStats | null): PlayerStats | null => {
    if (!stats) return null;

    const toNumber = (value?: number | string | null, defaultValue = 0) => {
      if (typeof value === 'string') return Number(value);
      return value ?? defaultValue;
    };

    const winRate = typeof stats.winRate === 'number' ? stats.winRate : toNumber(stats.winRate, 0);

    return {
      ...stats,
      totalMatches: toNumber(stats.totalMatches),
      totalWins: toNumber(stats.totalWins),
      totalLosses: toNumber(stats.totalLosses),
      winRate,
      bestReactionMs: stats.bestReactionMs ?? null,
      averageReactionMs: stats.averageReactionMs ?? null,
      currentStreak: stats.currentStreak ?? 0,
      bestStreak: stats.bestStreak ?? 0,
      totalReflexPoints: toNumber(stats.totalReflexPoints),
      totalSolWagered: toNumber(stats.totalSolWagered),
      totalSolWon: toNumber(stats.totalSolWon),
      freeStakes005: stats.freeStakes005 ?? 0,
      freeStakes010: stats.freeStakes010 ?? 0,
      freeStakes020: stats.freeStakes020 ?? 0,
    };
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        setUser(null);
        setError('Please log in to view your dashboard.');
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

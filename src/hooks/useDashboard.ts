import { useCallback, useEffect, useState } from 'react';
import { MATCH_HISTORY_UPDATED_EVENT } from '../utils/matchHistory';

export interface DashboardUser {
  id: string;
  username: string;
  avatar?: string | null;
  walletAddress: string;
  stats?: PlayerStats | null;
  ambassadorProfile?: AmbassadorProfile | null;
  dailyChallenge?: unknown;
}

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

export interface AmbassadorProfile {
  id: string;
  referralCode: string;
  totalReferrals: number;
}

interface DashboardResponse {
  user: DashboardUser;
}

export function useDashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [ambassador, setAmbassador] = useState<AmbassadorProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/dashboard', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }

      const data = (await response.json()) as DashboardResponse;
      const normalizedStats = normalizeStats(data.user?.stats as PlayerStats | undefined | null);

      setUser({ ...data.user, stats: normalizedStats ?? undefined });
      setStats(normalizedStats);
      setAmbassador(
        (data.user?.ambassadorProfile as AmbassadorProfile | undefined | null) ?? null,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [normalizeStats]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
    stats,
    ambassador,
    loading,
    error,
    refreshDashboard: fetchDashboard,
  };
}

export default useDashboard;

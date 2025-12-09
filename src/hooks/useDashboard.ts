import { useCallback, useEffect, useState } from 'react';

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
  id: string;
  userId: string;
  wins: number;
  losses: number;
  reflexPoints: number;
  freeStakes: number;
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

      setUser(data.user);
      setStats((data.user?.stats as PlayerStats | undefined | null) ?? null);
      setAmbassador(
        (data.user?.ambassadorProfile as AmbassadorProfile | undefined | null) ?? null,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
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

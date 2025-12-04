import { useCallback, useEffect, useState } from 'react';
import type { PlayerStats } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

export function usePlayerStats() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/me/stats`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        setStats(null);
        return;
      }

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to load stats');
      }

      setStats(body.stats as PlayerStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

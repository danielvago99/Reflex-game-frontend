import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../features/auth/hooks/useAuth';

export interface JackpotProgressData {
  currentWinStreak: number;
}

export function useJackpotProgress(open: boolean) {
  const [data, setData] = useState<JackpotProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!open) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${API_BASE_URL}/api/jackpot/progress`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        setData(null);
        setError('Please log in to view jackpot progress.');
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load jackpot progress');
      }

      const payload = (await response.json()) as JackpotProgressData;
      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch jackpot progress';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  return {
    data,
    loading,
    error,
    refresh: fetchProgress,
  };
}

export default useJackpotProgress;

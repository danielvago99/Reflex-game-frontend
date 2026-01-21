import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../auth/hooks/useAuth';

export interface RewardsData {
  reflexPoints: number;
  dailyProgress: number;
  dailyTarget: number;
  streak: number;
  freeStakes005: number;
  freeStakes010: number;
  freeStakes020: number;
}

interface RedeemResponse extends RewardsData {}

export function useRewardsData() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${API_BASE_URL}/api/rewards`, {
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
        setError('Please log in to view rewards data.');
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load rewards data');
      }

      const payload = (await response.json()) as RewardsData;
      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch rewards data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const redeemStake = useCallback(async (amount: number, cost: number) => {
    setLoading(true);
    setError(null);

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${API_BASE_URL}/api/rewards/redeem`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount, cost }),
      });

      if (response.status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        setData(null);
        throw new Error('Please log in to redeem stakes.');
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to redeem stake');
      }

      const payload = (await response.json()) as RedeemResponse;
      setData(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to redeem stake';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRewards();
  }, [fetchRewards]);

  return {
    data,
    loading,
    error,
    refresh: fetchRewards,
    redeemStake,
  };
}

export default useRewardsData;

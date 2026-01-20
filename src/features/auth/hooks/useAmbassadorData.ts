import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './useAuth';

export interface AmbassadorData {
  referralCode?: string;
  referralLink?: string;
  totalReferrals?: number;
  activeReferrals?: number;
  totalRewards?: number;
}

interface AmbassadorProfileResponse {
  referralCode?: string;
  referralLink?: string;
}

interface AmbassadorStatsResponse {
  totalReferrals?: number;
  activeReferrals?: number;
  activePlayers?: number;
  totalRewards?: number;
  rewardBalance?: number;
}

export function useAmbassadorData() {
  const [data, setData] = useState<AmbassadorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const [profileRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ambassador/profile`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/ambassador/stats`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
      ]);

      if (profileRes.status === 401 || statsRes.status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        setData(null);
        setError('Please log in to view ambassador data.');
        return;
      }

      if (!profileRes.ok) {
        const message = await profileRes.text();
        throw new Error(message || 'Failed to load ambassador profile');
      }

      if (!statsRes.ok) {
        const message = await statsRes.text();
        throw new Error(message || 'Failed to load ambassador stats');
      }

      const profile = (await profileRes.json()) as AmbassadorProfileResponse;
      const stats = (await statsRes.json()) as AmbassadorStatsResponse;

      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'https://reflex.game';
      const generatedLink = profile.referralCode
        ? `${origin}/ref/${profile.referralCode}`
        : undefined;

      setData({
        referralCode: profile.referralCode,
        referralLink: profile.referralLink ?? generatedLink,
        totalReferrals: stats.totalReferrals ?? 0,
        activeReferrals: stats.activeReferrals ?? stats.activePlayers ?? 0,
        totalRewards: stats.totalRewards ?? stats.rewardBalance ?? 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load ambassador data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}

export default useAmbassadorData;

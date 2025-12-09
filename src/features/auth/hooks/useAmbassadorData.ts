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
      const [profileRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ambassador/profile`, {
          method: 'GET',
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/ambassador/stats`, {
          method: 'GET',
          credentials: 'include',
        }),
      ]);

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

      setData({
        referralCode: profile.referralCode,
        referralLink:
          profile.referralLink ??
          (profile.referralCode ? `https://reflex.game/ref/${profile.referralCode}` : undefined),
        totalReferrals: stats.totalReferrals,
        activeReferrals: stats.activeReferrals ?? stats.activePlayers,
        totalRewards: stats.totalRewards ?? stats.rewardBalance,
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

import { useCallback, useEffect, useState } from 'react';
import type { PlayerProfile } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

interface UpdateProfileInput {
  username?: string;
  avatar?: string | null;
}

export function usePlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/me/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        setProfile(null);
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load profile');
      }

      const data = (await response.json()) as { profile: PlayerProfile };
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: UpdateProfileInput) => {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/me/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized');
      }

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to update profile');
      }

      const nextProfile = body.profile as PlayerProfile;
      setProfile(nextProfile);
      return nextProfile;
    },
    [],
  );

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    updateProfile,
  };
}

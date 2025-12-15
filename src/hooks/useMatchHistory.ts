import { useCallback, useEffect, useState } from 'react';
import { ENV } from '../config/env';

export type MatchType = 'ranked' | 'friend' | 'bot';

export interface MatchHistoryEntry {
  id: string;
  opponent?: string;
  result?: 'win' | 'loss';
  stakeAmount?: number;
  profit?: number;
  reactionTimeMs?: number;
  playerScore?: number;
  opponentScore?: number;
  createdAt?: string;
  matchType?: MatchType;
}

interface HistoryResponse {
  history?: MatchHistoryEntry[];
  matches?: MatchHistoryEntry[];
  data?: MatchHistoryEntry[];
}

interface UseMatchHistoryOptions {
  matchTypes?: MatchType[];
}

export function useMatchHistory(limit = 5, options?: UseMatchHistoryOptions) {
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = ENV.API_BASE_URL.replace(/\/$/, '');
      const apiBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${apiBaseUrl}/game/history?page=1&limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
        }
        const message = await response.text();
        throw new Error(message || 'Failed to load match history');
      }

      const data = (await response.json()) as HistoryResponse | MatchHistoryEntry[];
      const historyArray = Array.isArray(data)
        ? data
        : data.history ?? data.matches ?? data.data ?? [];

      const filteredMatches = options?.matchTypes?.length
        ? historyArray.filter((match) =>
            match.matchType ? options.matchTypes?.includes(match.matchType) : true
          )
        : historyArray;

      setMatches(filteredMatches.slice(0, limit));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch history';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit, options?.matchTypes]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return {
    matches,
    loading,
    error,
    refresh: fetchHistory,
  };
}

export default useMatchHistory;

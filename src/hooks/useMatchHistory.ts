import { useCallback, useEffect, useState } from 'react';
import { ENV } from '../config/env';

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
}

interface HistoryResponse {
  history?: MatchHistoryEntry[];
  matches?: MatchHistoryEntry[];
  data?: MatchHistoryEntry[];
}

export function useMatchHistory(limit = 5) {
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = ENV.API_BASE_URL.replace(/\/$/, '');
      const apiBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const response = await fetch(`${apiBaseUrl}/game/history?page=1&limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load match history');
      }

      const data = (await response.json()) as HistoryResponse | MatchHistoryEntry[];
      const historyArray = Array.isArray(data)
        ? data
        : data.history ?? data.matches ?? data.data ?? [];

      setMatches(historyArray.slice(0, limit));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch history';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

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

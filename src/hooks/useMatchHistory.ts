import { useCallback, useEffect, useState } from 'react';
import { ENV } from '../config/env';
import {
  getMatchHistory as getLocalMatchHistory,
  MATCH_HISTORY_UPDATED_EVENT,
} from '../utils/matchHistory';

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

  const hydrateFromLocal = useCallback(() => {
    if (typeof localStorage === 'undefined') return;

    const localMatches = getLocalMatchHistory()
      .map<MatchHistoryEntry>((match) => ({
        id: match.id,
        matchType: match.matchType,
        result: match.result,
        stakeAmount: match.stakeAmount,
        profit: match.profit,
        createdAt: new Date(match.timestamp).toISOString(),
        playerScore: match.playerScore,
        opponentScore: match.opponentScore,
      }))
      .sort((a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
        (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      );

    setMatches(localMatches.slice(0, limit));
  }, [limit]);

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

      if (filteredMatches.length === 0) {
        hydrateFromLocal();
      } else {
        setMatches(filteredMatches.slice(0, limit));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch history';
      setError(message);
      hydrateFromLocal();
    } finally {
      setLoading(false);
    }
  }, [hydrateFromLocal, limit, options?.matchTypes]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const handler = () => {
      hydrateFromLocal();
    };

    if (typeof window === 'undefined') return;

    window.addEventListener(MATCH_HISTORY_UPDATED_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(MATCH_HISTORY_UPDATED_EVENT, handler as EventListener);
    };
  }, [hydrateFromLocal]);

  return {
    matches,
    loading,
    error,
    refresh: fetchHistory,
  };
}

export default useMatchHistory;

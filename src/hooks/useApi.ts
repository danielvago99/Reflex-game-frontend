/**
 * useApi Hook
 * React hook for making API calls with loading and error states
 */

import { useState, useCallback } from 'react';
import type { ApiResponse } from '../types/api';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

/**
 * Generic hook for API calls
 */
export function useApi<T>(
  apiCall: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiCall(...args);

        if (response.success && response.data) {
          setData(response.data);
          options.onSuccess?.(response.data);
        } else {
          const errorMessage = response.error || 'Request failed';
          setError(errorMessage);
          options.onError?.(errorMessage);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        options.onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [apiCall, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T>(
  apiCall: (page: number) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(page);

      if (response.success && response.data) {
        const newData = response.data as any;
        
        // Handle paginated response
        if (Array.isArray(newData)) {
          setData(prev => [...prev, ...newData]);
          setHasMore(newData.length > 0);
        } else if (newData.items) {
          setData(prev => [...prev, ...newData.items]);
          setHasMore(newData.hasMore);
        }
        
        setPage(prev => prev + 1);
        options.onSuccess?.(response.data);
      } else {
        const errorMessage = response.error || 'Request failed';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiCall, loading, hasMore, page, options]);

  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(false);
    setPage(1);
    setHasMore(true);
  }, []);

  return { data, loading, error, hasMore, loadMore, reset };
}

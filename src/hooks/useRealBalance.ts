import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';

interface UseRealBalanceReturn {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRealBalance(): UseRealBalanceReturn {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (!publicKey) {
      return;
    }

    const subscriptionId = connection.onAccountChange(publicKey, (accountInfo) => {
      setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
    });

    return () => {
      void connection.removeAccountChangeListener(subscriptionId);
    };
  }, [connection, publicKey]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}

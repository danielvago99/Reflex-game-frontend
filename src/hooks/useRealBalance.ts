import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection } from '../utils/solana';
import { useActiveWallet } from './useActiveWallet';

interface RealBalanceState {
  balance: number | null;
  loading: boolean;
}

export function useRealBalance(): RealBalanceState {
  const { publicKey } = useActiveWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!publicKey) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        setLoading(true);
        const lamports = await connection.getBalance(publicKey);
        if (mounted) {
          setBalance(lamports / LAMPORTS_PER_SOL);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBalance();

    const subscriptionId = connection.onAccountChange(publicKey, (accountInfo) => {
      if (mounted) {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      }
    });

    return () => {
      mounted = false;
      connection.removeAccountChangeListener(subscriptionId).catch(() => undefined);
    };
  }, [publicKey]);

  return { balance, loading };
}

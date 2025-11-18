/**
 * useSolana Hook
 * React hook for Solana blockchain operations
 */

import { useState, useCallback } from 'react';
import { Solana } from '../utils/solana';

interface UseSolanaReturn {
  loading: boolean;
  error: string | null;
  generateWallet: () => Promise<{ publicKey: string; secretKey: Uint8Array } | null>;
  getBalance: (address: string) => Promise<number | null>;
  sendSol: (from: any, to: string, amount: number) => Promise<string | null>;
  signMessage: (message: string, keypair: any) => Promise<string | null>;
  verifySignature: (message: string, signature: string, publicKey: string) => Promise<boolean>;
  isValidAddress: (address: string) => boolean;
}

/**
 * Hook for Solana blockchain operations
 */
export function useSolana(): UseSolanaReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const wallet = await Solana.generateWallet();
      return wallet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate wallet';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBalance = useCallback(async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      const balance = await Solana.getBalance(address);
      return balance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get balance';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendSol = useCallback(async (from: any, to: string, amount: number) => {
    try {
      setLoading(true);
      setError(null);
      const signature = await Solana.sendSol(from, to, amount);
      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SOL';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const signMessage = useCallback(async (message: string, keypair: any) => {
    try {
      setLoading(true);
      setError(null);
      const signature = await Solana.signMessage(message, keypair);
      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign message';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifySignature = useCallback(
    async (message: string, signature: string, publicKey: string) => {
      try {
        setLoading(true);
        setError(null);
        const isValid = await Solana.verifySignature(message, signature, publicKey);
        return isValid;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to verify signature';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const isValidAddress = useCallback((address: string) => {
    return Solana.isValidAddress(address);
  }, []);

  return {
    loading,
    error,
    generateWallet,
    getBalance,
    sendSol,
    signMessage,
    verifySignature,
    isValidAddress,
  };
}

/**
 * Hook for wallet balance with auto-refresh
 */
export function useWalletBalance(address: string | null, refreshInterval = 30000) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newBalance = await Solana.getBalance(address);
      setBalance(newBalance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Auto-refresh balance
  useState(() => {
    if (!address || !refreshInterval) return;

    fetchBalance();
    const interval = setInterval(fetchBalance, refreshInterval);
    return () => clearInterval(interval);
  });

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}

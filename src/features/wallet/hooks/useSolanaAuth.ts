import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
export interface SolanaAuthResult {
  address: string;
  user?: {
    id: string;
    walletAddress: string;
    username: string;
    avatar?: string | null;
  };
}

export function useSolanaAuth() {
  const { connected, publicKey, signMessage } = useWallet();

  const login = useCallback(async (): Promise<SolanaAuthResult> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet is not connected.');
    }

    if (!signMessage) {
      throw new Error('Wallet does not support message signing.');
    }

    const address = publicKey.toBase58();
    const nonceResponse = await fetch(`/api/auth/nonce?address=${address}`, {
      credentials: 'include',
    });

    if (!nonceResponse.ok) {
      throw new Error('Failed to fetch nonce.');
    }

    const { nonce } = (await nonceResponse.json()) as { nonce?: string };

    if (!nonce) {
      throw new Error('Nonce response missing.');
    }

    const message = `Reflex Game Login\nDomain: ${window.location.host}\nAddress: ${address}\nNonce: ${nonce}`;
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await signMessage(messageBytes);
    const signature = btoa(String.fromCharCode(...signatureBytes));

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ address, message, signature }),
    });

    if (!response.ok) {
      throw new Error('Login failed.');
    }

    const payload = (await response.json()) as SolanaAuthResult;

    return { address, user: payload.user };
  }, [connected, publicKey, signMessage]);

  return { login };
}

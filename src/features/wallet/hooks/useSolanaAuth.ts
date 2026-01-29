import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import nacl from 'tweetnacl';

export interface SolanaAuthResult {
  publicKey: NonNullable<ReturnType<typeof useWallet>['publicKey']>;
  signature: Uint8Array;
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

    const message = new TextEncoder().encode(`Login to Reflex Game: ${new Date().toISOString()}`);
    const signature = await signMessage(message);
    const isValid = nacl.sign.detached.verify(message, signature, publicKey.toBytes());

    if (!isValid) {
      throw new Error('Signature verification failed.');
    }

    return { publicKey, signature };
  }, [connected, publicKey, signMessage]);

  return { login };
}

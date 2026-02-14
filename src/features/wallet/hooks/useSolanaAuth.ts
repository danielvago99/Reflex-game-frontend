import { useCallback } from 'react';
import { useUnifiedWallet } from './useUnifiedWallet';
import nacl from 'tweetnacl';

export interface SolanaAuthResult {
  publicKey: NonNullable<ReturnType<typeof useUnifiedWallet>['publicKey']>;
  signature: Uint8Array;
  message: string;
}

export function useSolanaAuth() {
  const { connected, publicKey, signMessage } = useUnifiedWallet();

  const login = useCallback(async (): Promise<SolanaAuthResult> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet is not connected.');
    }

    if (!signMessage) {
      throw new Error('Wallet does not support message signing.');
    }

    const message = `Login to Reflex Game: ${new Date().toISOString()}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = await signMessage(messageBytes);
    const isValid = nacl.sign.detached.verify(messageBytes, signature, publicKey.toBytes());

    if (!isValid) {
      throw new Error('Signature verification failed.');
    }

    return { publicKey, signature, message };
  }, [connected, publicKey, signMessage]);

  return { login };
}

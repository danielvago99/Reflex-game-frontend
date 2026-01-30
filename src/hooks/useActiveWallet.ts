import { useMemo } from 'react';
import { useWallet as useAdapterWallet } from '@solana/wallet-adapter-react';
import type { Connection, Transaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { useWallet as useInAppWallet } from '../features/wallet/context/WalletProvider';

type SendTransaction = (transaction: Transaction, connection: Connection) => Promise<string>;

interface ActiveWallet {
  publicKey: PublicKey | null;
  sendTransaction: SendTransaction | null;
  walletType: 'external' | 'in-app' | 'none';
}

export function useActiveWallet(): ActiveWallet {
  const { publicKey: externalPublicKey, connected, sendTransaction: externalSendTransaction } =
    useAdapterWallet();
  const { address, sendTransaction: inAppSendTransaction } = useInAppWallet();

  return useMemo(() => {
    if (connected && externalPublicKey && externalSendTransaction) {
      return {
        publicKey: externalPublicKey,
        sendTransaction: externalSendTransaction,
        walletType: 'external',
      };
    }

    if (address) {
      try {
        return {
          publicKey: new PublicKey(address),
          sendTransaction: inAppSendTransaction,
          walletType: 'in-app',
        };
      } catch {
        return {
          publicKey: null,
          sendTransaction: null,
          walletType: 'none',
        };
      }
    }

    return {
      publicKey: null,
      sendTransaction: null,
      walletType: 'none',
    };
  }, [address, connected, externalPublicKey, externalSendTransaction, inAppSendTransaction]);
}

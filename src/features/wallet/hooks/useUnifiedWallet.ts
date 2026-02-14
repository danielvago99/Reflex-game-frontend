import { useMemo } from 'react';
import { useAnchorWallet, useWallet as useAdapterWallet } from '@solana/wallet-adapter-react';
import type { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import type { Wallet as AnchorWallet } from '@coral-xyz/anchor';
import { useWallet as useInAppWallet } from '../context/WalletProvider';

type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;
type SendTransaction = (transaction: Transaction, connection: Connection) => Promise<string>;

export interface UnifiedWallet {
  publicKey: PublicKey | null;
  connected: boolean;
  signMessage: SignMessage | null;
  sendTransaction: SendTransaction | null;
  walletType: 'external' | 'in-app' | 'none';
  anchorWallet: AnchorWallet | null;
}

export function useUnifiedWallet(): UnifiedWallet {
  const anchorWallet = useAnchorWallet();
  const {
    connected: adapterConnected,
    publicKey: adapterPublicKey,
    signMessage: adapterSignMessage,
    sendTransaction: adapterSendTransaction,
  } = useAdapterWallet();
  const {
    address: inAppAddress,
    signMessage: inAppSignMessage,
    sendTransaction: inAppSendTransaction,
    signTransaction: inAppSignTransaction,
    signAllTransactions: inAppSignAllTransactions,
  } = useInAppWallet();

  return useMemo(() => {
    if (
      adapterConnected &&
      adapterPublicKey &&
      adapterSignMessage &&
      adapterSendTransaction &&
      anchorWallet
    ) {
      return {
        publicKey: adapterPublicKey,
        connected: true,
        signMessage: adapterSignMessage,
        sendTransaction: adapterSendTransaction,
        walletType: 'external' as const,
        anchorWallet,
      };
    }

    if (inAppAddress) {
      try {
        const publicKey = new PublicKey(inAppAddress);
        const inAppAnchorWallet: AnchorWallet = {
          publicKey,
          signTransaction: async <T extends Transaction | VersionedTransaction>(transaction: T) =>
            inAppSignTransaction(transaction),
          signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]) =>
            inAppSignAllTransactions(transactions),
        };

        return {
          publicKey,
          connected: true,
          signMessage: async (message: Uint8Array) => inAppSignMessage(message),
          sendTransaction: inAppSendTransaction,
          walletType: 'in-app' as const,
          anchorWallet: inAppAnchorWallet,
        };
      } catch {
        return {
          publicKey: null,
          connected: false,
          signMessage: null,
          sendTransaction: null,
          walletType: 'none' as const,
          anchorWallet: null,
        };
      }
    }

    return {
      publicKey: null,
      connected: false,
      signMessage: null,
      sendTransaction: null,
      walletType: 'none' as const,
      anchorWallet: null,
    };
  }, [
    adapterConnected,
    adapterPublicKey,
    adapterSignMessage,
    adapterSendTransaction,
    anchorWallet,
    inAppAddress,
    inAppSignMessage,
    inAppSendTransaction,
    inAppSignTransaction,
    inAppSignAllTransactions,
  ]);
}

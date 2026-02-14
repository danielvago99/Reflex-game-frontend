import { useMemo } from 'react';
import { useUnifiedWallet } from '../features/wallet/hooks/useUnifiedWallet';

interface ActiveWallet {
  publicKey: ReturnType<typeof useUnifiedWallet>['publicKey'];
  sendTransaction: ReturnType<typeof useUnifiedWallet>['sendTransaction'];
  walletType: ReturnType<typeof useUnifiedWallet>['walletType'];
}

export function useActiveWallet(): ActiveWallet {
  const { publicKey, sendTransaction, walletType } = useUnifiedWallet();

  return useMemo(
    () => ({
      publicKey,
      sendTransaction,
      walletType,
    }),
    [publicKey, sendTransaction, walletType]
  );
}

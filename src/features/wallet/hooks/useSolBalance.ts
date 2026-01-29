import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function useSolBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    let isMounted = true;

    connection.getBalance(publicKey).then((lamports) => {
      if (isMounted) {
        setBalance(lamports / LAMPORTS_PER_SOL);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [connection, publicKey]);

  return balance;
}

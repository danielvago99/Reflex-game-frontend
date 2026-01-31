import { type ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { ENV } from '../../../config/env';

const resolveWalletNetwork = (network: string) => {
  if (network === 'mainnet' || network === 'mainnet-beta') {
    return WalletAdapterNetwork.Mainnet;
  }
  if (network === 'testnet') {
    return WalletAdapterNetwork.Testnet;
  }
  return WalletAdapterNetwork.Devnet;
};

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const network = resolveWalletNetwork(ENV.SOLANA_NETWORK);

  const endpoint = useMemo(() => ENV.SOLANA_RPC_URL, []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}

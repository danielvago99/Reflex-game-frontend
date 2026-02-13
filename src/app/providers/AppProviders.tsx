import { type ReactNode } from 'react';
import { WalletProvider } from '../../features/wallet/context/WalletProvider';
import { SolanaWalletProvider } from '../../features/wallet/context/SolanaWalletProvider';
import { SolanaProvider } from '../../features/wallet/context/SolanaProvider';
import { GameProvider } from '../../features/arena/context/GameProvider';
import { WebSocketProvider } from '../../features/websocket/WebSocketProvider';
import { AuthProvider } from '../../features/auth/hooks/useAuth';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SolanaWalletProvider>
      <WalletProvider>
        <SolanaProvider>
          <AuthProvider>
            <WebSocketProvider>
              <GameProvider>{children}</GameProvider>
            </WebSocketProvider>
          </AuthProvider>
        </SolanaProvider>
      </WalletProvider>
    </SolanaWalletProvider>
  );
}

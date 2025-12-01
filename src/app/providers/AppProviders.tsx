import { type ReactNode } from 'react';
import { WalletProvider } from '../../features/wallet/context/WalletProvider';
import { GameProvider } from '../../features/arena/context/GameProvider';
import { WebSocketProvider } from '../../features/websocket/WebSocketProvider';
import { AuthProvider } from '../../features/auth/hooks/useAuth';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider>
      <WalletProvider>
        <AuthProvider>
          <GameProvider>{children}</GameProvider>
        </AuthProvider>
      </WalletProvider>
    </WebSocketProvider>
  );
}

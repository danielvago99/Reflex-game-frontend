import { type ReactNode } from 'react';
import { WalletProvider } from '../../features/wallet/context/WalletProvider';
import { GameProvider } from '../../features/arena/context/GameProvider';
import { WebSocketProvider } from '../../features/websocket/WebSocketProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider>
      <WalletProvider>
        <GameProvider>{children}</GameProvider>
      </WalletProvider>
    </WebSocketProvider>
  );
}

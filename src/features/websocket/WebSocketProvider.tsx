import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { wsService } from '../../utils/websocket';
import type { WSMessageType } from '../../types/api';

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WebSocketContextValue {
  status: WebSocketStatus;
  error?: string;
  connect: (token?: string) => Promise<void>;
  disconnect: () => void;
  send: <T>(type: WSMessageType, payload: T) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<string | undefined>(undefined);

  const connect = async (token?: string) => {
    setStatus('connecting');
    try {
      await wsService.connect(token);
      setStatus('connected');
      setError(undefined);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const disconnect = () => {
    wsService.disconnect();
    setStatus('disconnected');
  };

  const send = <T,>(type: WSMessageType, payload: T) => wsService.send(type, payload);

  useEffect(() => {
    const unsubOpen = wsService.onOpen(() => {
      setStatus('connected');
      setError(undefined);
    });
    const unsubClose = wsService.onClose(() => setStatus('disconnected'));
    const unsubError = wsService.onError(() => setStatus('error'));

    connect().catch(() => setStatus('error'));

    return () => {
      unsubOpen();
      unsubClose();
      unsubError();
      disconnect();
    };
  }, []);

  const value = useMemo<WebSocketContextValue>(
    () => ({ status, error, connect, disconnect, send }),
    [status, error]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocketContext must be used within WebSocketProvider');
  return context;
};

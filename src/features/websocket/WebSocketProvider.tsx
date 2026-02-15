import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { wsService } from '../../utils/websocket';
import type { WSMessageType } from '../../types/api';

const getStoredAuthToken = () =>
  (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null);

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
  const { user } = useAuth();

  const connect = useCallback(async (token?: string) => {
    setStatus('connecting');
    try {
      const authToken = token ?? getStoredAuthToken() ?? undefined;
      await wsService.connect(authToken);
      setStatus('connected');
      setError(undefined);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setStatus('disconnected');
  }, []);

  const send = <T,>(type: WSMessageType, payload: T) => wsService.send(type, payload);

  useEffect(() => {
    const unsubOpen = wsService.onOpen(() => {
      setStatus('connected');
      setError(undefined);
    });
    const unsubClose = wsService.onClose(() => setStatus('disconnected'));
    const unsubError = wsService.onError(() => setStatus('error'));

    return () => {
      unsubOpen();
      unsubClose();
      unsubError();
    };
  }, []);

  useEffect(() => {
    if (!user?.username) {
      return;
    }

    if (wsService.isConnected() || status === 'connecting') {
      return;
    }

    connect().catch(() => setStatus('error'));
  }, [user?.username, status, connect]);

  const value = useMemo<WebSocketContextValue>(
    () => ({ status, error, connect, disconnect, send }),
    [status, error, connect, disconnect]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocketContext must be used within WebSocketProvider');
  return context;
};

/**
 * useWebSocket Hook
 * React hook for WebSocket connections and event handling
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { wsService, WS_EVENTS } from '../utils/websocket';
import type { WSMessage, WSMessageType } from '../types/api';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

const getStoredAuthToken = () =>
  (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null);

/**
 * Hook for WebSocket connection management
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConnecting = useRef(false);

  const connect = useCallback(async () => {
    if (isConnecting.current) return;
    
    try {
      isConnecting.current = true;
      setError(null);
      const token = options.token ?? getStoredAuthToken() ?? undefined;
      await wsService.connect(token);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      isConnecting.current = false;
    }
  }, [options.token]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setIsConnected(false);
  }, []);

  const send = useCallback(<T,>(type: WSMessageType, payload: T) => {
    wsService.send(type, payload);
  }, []);

  useEffect(() => {
    // Subscribe to connection events
    const unsubOpen = wsService.onOpen(() => {
      setIsConnected(true);
      setError(null);
    });

    const unsubClose = wsService.onClose(() => {
      setIsConnected(false);
    });

    const unsubError = wsService.onError((err) => {
      setError('Connection error');
      setIsConnected(false);
    });

    // Auto-connect if enabled
    if (options.autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      unsubOpen();
      unsubClose();
      unsubError();
    };
  }, [options.autoConnect, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    send,
  };
}

/**
 * Hook for subscribing to WebSocket messages
 */
export function useWebSocketEvent<T = any>(
  type: WSMessageType,
  handler: (payload: T) => void,
  deps: any[] = []
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const messageHandler = (message: WSMessage<T>) => {
      handlerRef.current(message.payload);
    };

    const unsubscribe = wsService.on(type, messageHandler);
    return unsubscribe;
  }, [type, ...deps]);
}

/**
 * Hook for game lobby events
 */
export function useLobbyEvents(handlers: {
  onUpdate?: (data: any) => void;
  onPlayerJoined?: (data: any) => void;
  onPlayerLeft?: (data: any) => void;
}) {
  useWebSocketEvent('lobby:update', handlers.onUpdate || (() => {}), [handlers.onUpdate]);
  useWebSocketEvent('lobby:player_joined', handlers.onPlayerJoined || (() => {}), [handlers.onPlayerJoined]);
  useWebSocketEvent('lobby:player_left', handlers.onPlayerLeft || (() => {}), [handlers.onPlayerLeft]);
}

/**
 * Hook for game events
 */
export function useGameEvents(handlers: {
  onStart?: (data: any) => void;
  onCountdown?: (data: any) => void;
  onShowButton?: (data: any) => void;
  onPlayerClicked?: (data: any) => void;
  onResult?: (data: any) => void;
  onEnd?: (data: any) => void;
}) {
  useWebSocketEvent('game:start', handlers.onStart || (() => {}), [handlers.onStart]);
  useWebSocketEvent('game:countdown', handlers.onCountdown || (() => {}), [handlers.onCountdown]);
  useWebSocketEvent('game:show_button', handlers.onShowButton || (() => {}), [handlers.onShowButton]);
  useWebSocketEvent('game:player_clicked', handlers.onPlayerClicked || (() => {}), [handlers.onPlayerClicked]);
  useWebSocketEvent('game:result', handlers.onResult || (() => {}), [handlers.onResult]);
  useWebSocketEvent('game:end', handlers.onEnd || (() => {}), [handlers.onEnd]);
}

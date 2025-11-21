/**
 * useWebSocket Hook
 * React hook for WebSocket connections and event handling
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { wsService, WS_EVENTS } from '../utils/websocket';
import type {
  WSGameCountdown,
  WSGamePlayerClicked,
  WSGameResult,
  WSGameShowButton,
  WSGameStart,
  WSLobbyUpdate,
  WSMessage,
  WSMessageType,
  WSPayloadMap
} from '../types/api';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

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
      await wsService.connect(options.token);
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
      if (options.autoConnect) {
        disconnect();
      }
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
export function useWebSocketEvent<T extends WSMessageType>(
  type: T,
  handler: (payload: WSPayloadMap[T]) => void,
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
  onUpdate?: (data: WSLobbyUpdate) => void;
  onPlayerJoined?: (data: WSLobbyUpdate) => void;
  onPlayerLeft?: (data: WSLobbyUpdate) => void;
}) {
  useWebSocketEvent('lobby:update', handlers.onUpdate || (() => {}), [handlers.onUpdate]);
  useWebSocketEvent('lobby:player_joined', handlers.onPlayerJoined || (() => {}), [handlers.onPlayerJoined]);
  useWebSocketEvent('lobby:player_left', handlers.onPlayerLeft || (() => {}), [handlers.onPlayerLeft]);
}

/**
 * Hook for game events
 */
export function useGameEvents(handlers: {
  onStart?: (data: WSGameStart) => void;
  onCountdown?: (data: WSGameCountdown) => void;
  onShowButton?: (data: WSGameShowButton) => void;
  onPlayerClicked?: (data: WSGamePlayerClicked) => void;
  onResult?: (data: WSGameResult) => void;
  onEnd?: (data: WSGameResult) => void;
}) {
  useWebSocketEvent('game:start', handlers.onStart || (() => {}), [handlers.onStart]);
  useWebSocketEvent('game:countdown', handlers.onCountdown || (() => {}), [handlers.onCountdown]);
  useWebSocketEvent('game:show_button', handlers.onShowButton || (() => {}), [handlers.onShowButton]);
  useWebSocketEvent('game:player_clicked', handlers.onPlayerClicked || (() => {}), [handlers.onPlayerClicked]);
  useWebSocketEvent('game:result', handlers.onResult || (() => {}), [handlers.onResult]);
  useWebSocketEvent('game:end', handlers.onEnd || (() => {}), [handlers.onEnd]);
}

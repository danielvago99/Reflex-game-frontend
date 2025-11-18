/**
 * WebSocket Service
 * Handles real-time communication for game lobbies and matches
 * 
 * INTEGRATION STEPS:
 * 1. Connect to your WebSocket server
 * 2. Implement authentication handshake
 * 3. Add reconnection logic
 * 4. Handle all game events
 */

import { ENV } from '../config/env';
import type { WSMessage, WSMessageType } from '../types/api';

type MessageHandler = (message: WSMessage) => void;
type ErrorHandler = (error: Event) => void;
type ConnectionHandler = () => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<WSMessageType, Set<MessageHandler>> = new Map();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private openHandlers: Set<ConnectionHandler> = new Set();
  private closeHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // If using mock data, simulate connection
        if (ENV.USE_MOCK_DATA || !ENV.ENABLE_WEBSOCKET) {
          console.log('[WebSocket Mock] Connection simulated');
          this.simulateMockConnection();
          resolve();
          return;
        }

        const url = token ? `${ENV.WS_URL}?token=${token}` : ENV.WS_URL;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.openHandlers.forEach(handler => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.errorHandlers.forEach(handler => handler(error));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.stopHeartbeat();
          this.closeHandlers.forEach(handler => handler());
          
          if (!this.isIntentionalClose) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send<T>(type: WSMessageType, payload: T): void {
    const message: WSMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    if (ENV.USE_MOCK_DATA || !ENV.ENABLE_WEBSOCKET) {
      console.log('[WebSocket Mock Send]', message);
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('[WebSocket] Cannot send message, not connected');
    }
  }

  /**
   * Subscribe to message type
   */
  on(type: WSMessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * Subscribe to error events
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to connection open
   */
  onOpen(handler: ConnectionHandler): () => void {
    this.openHandlers.add(handler);
    return () => {
      this.openHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to connection close
   */
  onClose(handler: ConnectionHandler): () => void {
    this.closeHandlers.add(handler);
    return () => {
      this.closeHandlers.delete(handler);
    };
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WSMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    // Handle ping/pong
    if (message.type === 'ping') {
      this.send('pong', {});
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send('ping', {});
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Simulate mock connection for development
   */
  private simulateMockConnection(): void {
    setTimeout(() => {
      this.openHandlers.forEach(handler => handler());
    }, 100);
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

// ============================================================================
// WEBSOCKET EVENT HELPERS
// ============================================================================

export const WS_EVENTS = {
  // Lobby events
  lobby: {
    subscribe: (handler: MessageHandler) => wsService.on('lobby:update', handler),
    playerJoined: (handler: MessageHandler) => wsService.on('lobby:player_joined', handler),
    playerLeft: (handler: MessageHandler) => wsService.on('lobby:player_left', handler),
  },

  // Game events
  game: {
    start: (handler: MessageHandler) => wsService.on('game:start', handler),
    countdown: (handler: MessageHandler) => wsService.on('game:countdown', handler),
    showButton: (handler: MessageHandler) => wsService.on('game:show_button', handler),
    playerClicked: (handler: MessageHandler) => wsService.on('game:player_clicked', handler),
    result: (handler: MessageHandler) => wsService.on('game:result', handler),
    end: (handler: MessageHandler) => wsService.on('game:end', handler),
  },

  // Error events
  error: (handler: MessageHandler) => wsService.on('error', handler),
};

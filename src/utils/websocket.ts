/**
 * WebSocket Service with backoff, validation, and heartbeat controls
 */
import { z } from 'zod';
import { ENV } from '../config/env';
import type { WSMessage, WSMessageType } from '../types/api';

const MessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  timestamp: z.number().optional()
});

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
  private heartbeatInterval: number | null = null;
  private isIntentionalClose = false;
  private visibilityListenerAttached = false;

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (ENV.USE_MOCK_DATA || !ENV.ENABLE_WEBSOCKET) {
          this.simulateMockConnection();
          resolve();
          return;
        }

        if (
          this.ws &&
          (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
        ) {
          resolve();
          return;
        }

        const url = token ? `${ENV.WS_URL}?token=${token}` : ENV.WS_URL;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.openHandlers.forEach((handler) => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          const parsed = MessageSchema.safeParse(JSON.parse(event.data));
          if (!parsed.success) {
            console.error('[WebSocket] Invalid message schema');
            return;
          }
          this.handleMessage(parsed.data as WSMessage);
        };

        this.ws.onerror = (error) => {
          this.errorHandlers.forEach((handler) => handler(error));
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            reject(error);
          }
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          this.closeHandlers.forEach((handler) => handler());

          if (!this.isIntentionalClose) {
            this.attemptReconnect(token);
          }
        };

        if (!this.visibilityListenerAttached) {
          document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
              this.stopHeartbeat();
            } else if (this.isConnected()) {
              this.startHeartbeat();
            }
          });
          this.visibilityListenerAttached = true;
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send<T>(type: WSMessageType, payload: T): void {
    const message: WSMessage<T> = {
      type,
      payload,
      timestamp: Date.now()
    };

    if (ENV.USE_MOCK_DATA || !ENV.ENABLE_WEBSOCKET) {
      return;
    }

    const validation = MessageSchema.safeParse(message);
    if (!validation.success) {
      console.error('[WebSocket] Outgoing message failed validation');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  on(type: WSMessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
    return () => this.messageHandlers.get(type)?.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onOpen(handler: ConnectionHandler): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  onClose(handler: ConnectionHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  private handleMessage(message: WSMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    handlers?.forEach((handler) => handler(message));
    if (message.type === 'ping') {
      this.send('pong', {});
    }
  }

  private attemptReconnect(token?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts += 1;
    const jitter = Math.random() * 200;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + jitter;

    window.setTimeout(() => {
      this.connect(token).catch(() => undefined);
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (document.hidden) return;
      this.send('ping', {});
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private simulateMockConnection(): void {
    window.setTimeout(() => {
      this.openHandlers.forEach((handler) => handler());
    }, 100);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();

export const WS_EVENTS = {
  lobby: {
    subscribe: (handler: MessageHandler) => wsService.on('lobby:update', handler),
    playerJoined: (handler: MessageHandler) => wsService.on('lobby:player_joined', handler),
    playerLeft: (handler: MessageHandler) => wsService.on('lobby:player_left', handler)
  },
  game: {
    start: (handler: MessageHandler) => wsService.on('game:start', handler),
    countdown: (handler: MessageHandler) => wsService.on('game:countdown', handler),
    showButton: (handler: MessageHandler) => wsService.on('game:show_button', handler),
    playerClicked: (handler: MessageHandler) => wsService.on('game:player_clicked', handler),
    result: (handler: MessageHandler) => wsService.on('game:result', handler),
    end: (handler: MessageHandler) => wsService.on('game:end', handler)
  },
  round: {
    prepare: (handler: MessageHandler) => wsService.on('round:prepare', handler),
    showTarget: (handler: MessageHandler) => wsService.on('round:show_target', handler),
    result: (handler: MessageHandler) => wsService.on('round:result', handler)
  },
  error: (handler: MessageHandler) => wsService.on('error', handler)
};

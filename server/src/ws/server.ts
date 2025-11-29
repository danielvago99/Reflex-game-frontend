import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import { logger } from '../utils/logger';

export function createWsServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  wss.on('connection', (socket: WebSocket) => {
    logger.info('WS client connected');

    socket.on('message', (data) => {
      // Later: parse JSON and route by message.type
      logger.debug({ data: data.toString() }, 'WS message');
    });

    socket.on('close', () => {
      logger.info('WS client disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err }, 'WS error');
    });
  });

  return wss;
}

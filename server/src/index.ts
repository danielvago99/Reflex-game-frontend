import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { createWsServer } from './ws/server';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Attach WebSocket server
createWsServer(server);

server.listen(env.PORT, () => {
  logger.info(`Backend server listening on http://localhost:${env.PORT}`);
});

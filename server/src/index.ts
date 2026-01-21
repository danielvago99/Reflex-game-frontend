import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { updateLeaderboards } from './services/leaderboard';
import { createWsServer } from './ws/server';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Attach WebSocket server
createWsServer(server);

const LEADERBOARD_INTERVAL = 5 * 60 * 1000;

void updateLeaderboards();

setInterval(() => {
  void updateLeaderboards();
}, LEADERBOARD_INTERVAL);

server.listen(env.PORT, () => {
  logger.info(`Backend server listening on http://localhost:${env.PORT}`);
});

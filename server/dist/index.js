"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const server_1 = require("./ws/server");
const logger_1 = require("./utils/logger");
const server = http_1.default.createServer(app_1.app);
// Attach WebSocket server
(0, server_1.createWsServer)(server);
server.listen(env_1.env.PORT, () => {
    logger_1.logger.info(`Backend server listening on http://localhost:${env_1.env.PORT}`);
});

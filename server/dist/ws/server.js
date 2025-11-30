"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWsServer = createWsServer;
const ws_1 = require("ws");
const logger_1 = require("../utils/logger");
function createWsServer(server) {
    const wss = new ws_1.WebSocketServer({
        server,
        path: '/ws',
    });
    wss.on('connection', (socket) => {
        logger_1.logger.info('WS client connected');
        socket.on('message', (data) => {
            // Later: parse JSON and route by message.type
            logger_1.logger.debug({ data: data.toString() }, 'WS message');
        });
        socket.on('close', () => {
            logger_1.logger.info('WS client disconnected');
        });
        socket.on('error', (err) => {
            logger_1.logger.error({ err }, 'WS error');
        });
    });
    return wss;
}

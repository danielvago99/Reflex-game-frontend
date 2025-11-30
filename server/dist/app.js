"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const logger_1 = require("./utils/logger");
const sentry_1 = require("./config/sentry");
exports.app = (0, express_1.default)();
// Security headers
exports.app.use((0, helmet_1.default)());
// CORS
exports.app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_ORIGIN,
    credentials: true,
}));
// JSON body parsing
exports.app.use(express_1.default.json());
// Logging
exports.app.use((0, pino_http_1.default)({
    logger: logger_1.logger,
}));
// Basic in-memory rate limiter (Redis store can be added later)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
exports.app.use(limiter);
// Sentry (optional; only active if SENTRY_DSN is set)
(0, sentry_1.initSentry)(exports.app);
// Routes
exports.app.use('/api', routes_1.router);
// Sentry error handler (must be after routes)
exports.app.use(sentry_1.sentryErrorHandler);
// Generic error handler fallback
exports.app.use(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
(err, _req, res, _next) => {
    logger_1.logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
});

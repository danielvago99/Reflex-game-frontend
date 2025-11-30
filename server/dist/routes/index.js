"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const health_1 = require("./health");
exports.router = (0, express_1.Router)();
exports.router.use('/health', health_1.healthRouter);
// TODO: router.use('/auth', authRouter);
// TODO: router.use('/matchmaking', matchmakingRouter);

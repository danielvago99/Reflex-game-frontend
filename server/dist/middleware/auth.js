"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.attachUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const attachUser = (req, _res, next) => {
    const token = req.cookies?.auth_token;
    if (!token) {
        return next();
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = { id: payload.sub, address: payload.address };
    }
    catch (error) {
        req.user = undefined;
    }
    return next();
};
exports.attachUser = attachUser;
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
};
exports.requireAuth = requireAuth;

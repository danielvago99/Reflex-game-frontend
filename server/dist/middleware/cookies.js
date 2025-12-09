"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieParser = void 0;
const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (!cookieHeader)
        return cookies;
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
        const index = pair.indexOf('=');
        if (index < 0)
            continue;
        const key = pair.slice(0, index).trim();
        const value = pair.slice(index + 1).trim();
        if (!key)
            continue;
        try {
            cookies[key] = decodeURIComponent(value);
        }
        catch (error) {
            cookies[key] = value;
        }
    }
    return cookies;
};
const cookieParser = () => (req, _res, next) => {
    req.cookies = parseCookies(req.headers.cookie);
    next();
};
exports.cookieParser = cookieParser;

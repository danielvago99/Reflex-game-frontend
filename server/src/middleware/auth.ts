import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedUser {
  id: string;
  address: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const attachUser = (req: Request, _res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.auth_token;
  const authHeader = req.get('authorization');

  const headerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;

  const token = cookieToken ?? headerToken;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; address: string };
    req.user = { id: payload.sub, address: payload.address };
  } catch (error) {
    req.user = undefined;
  }

  return next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};

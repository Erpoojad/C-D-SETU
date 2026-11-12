import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { one } from './db';

export type Role = 'generator' | 'buyer' | 'transporter' | 'recycler' | 'authority';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  city: string;
  company: string;
  points: number;
}

const COOKIE = 'setu_session';
const MAX_AGE_S = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set (16+ characters) in production');
  }
  return 'dev-only-insecure-secret-change-me';
}

export function setSession(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, secret(), { expiresIn: MAX_AGE_S });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_S * 1000,
    path: '/',
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { path: '/' });
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export const USER_COLUMNS = 'id, email, name, phone, role, city, company, points';

/** Attaches req.user when a valid session cookie is present. Never rejects. */
export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, secret()) as { sub: string };
    req.user = await one<SessionUser>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [payload.sub]);
  } catch {
    // invalid or expired token: treat as signed out
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in first.' });
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Please sign in first.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Only ${roles.join(' or ')} accounts can do this.` });
    }
    next();
  };
}

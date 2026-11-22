import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'No autenticado. Inicia sesión.' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión de nuevo.' });
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.token;

  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
      req.userId = payload.userId;
    } catch {
      // Token inválido, continuar sin auth
    }
  }

  next();
};


import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth';
import { config } from '../config';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export class AuthController {
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { user, token } = await AuthService.register(req.body);
      res.cookie('token', token, COOKIE_OPTIONS);
      res.status(201).json({ user });
    } catch (error) {
      if ((error as Error).message.includes('Ya existe')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { user, token } = await AuthService.login(req.body);
      res.cookie('token', token, COOKIE_OPTIONS);
      res.json({ user });
    } catch (error) {
      if ((error as Error).message.includes('incorrectos')) {
        res.status(401).json({ error: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  static async logout(_req: AuthRequest, res: Response) {
    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Sesión cerrada' });
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.userId!);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
}


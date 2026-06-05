import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import type { JwtPayload } from '../../middleware/authenticate';

export const AuthController = {
  // POST /auth/register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  // POST /auth/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  // POST /auth/2fa/setup  (authenticate gerektirir — full veya pre-auth olmadan, sadece full token ile)
  async setup2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.setup2FA(req.user!.userId);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  // POST /auth/2fa/enable  (setup sonrası ilk doğrulama)
  async enable2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.enable2FA(req.user!.userId, req.body.code);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  // POST /auth/2fa/verify  (login akışı — pre-auth token ile)
  async verifyTotp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // pre-auth token'dan userId al
      const authHeader = req.headers.authorization;
      const token = authHeader?.slice(7) ?? '';
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      if (payload.stage !== 'pre-auth') {
        res.status(401).json({ status: 'error', message: 'pre-auth token gerekli' });
        return;
      }

      const result = await AuthService.verifyTotp(payload.userId, req.body.code);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  // POST /auth/refresh
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  // POST /auth/logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.logout(req.user!.userId);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  },

  // GET /auth/me
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        status: 'success',
        data: { userId: req.user!.userId, role: req.user!.role },
      });
    } catch (err) {
      next(err);
    }
  },
};

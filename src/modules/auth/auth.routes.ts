import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rate-limit';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTotpDto } from './dto/verify-totp.dto';
import { RefreshDto } from './dto/refresh.dto';

const router = Router();

// Genel auth rate limiter — brute-force koruması
router.use(authLimiter);

// ── Açık endpoint'ler ──────────────────────────────────────────────────────
router.post('/register', validate(RegisterDto), AuthController.register);
router.post('/login',    validate(LoginDto),    AuthController.login);
router.post('/refresh',  validate(RefreshDto),  AuthController.refresh);

// ── 2FA Verify: pre-auth token yeterli (stage kontrolü controller'da) ──────
router.post('/2fa/verify', validate(VerifyTotpDto), AuthController.verifyTotp);

// ── Korumalı endpoint'ler: tam JWT (full stage) gerektirir ─────────────────
router.post('/2fa/setup',   authenticate, AuthController.setup2FA);
router.post('/2fa/enable',  authenticate, validate(VerifyTotpDto), AuthController.enable2FA);
router.post('/logout',      authenticate, AuthController.logout);
router.get('/me',           authenticate, AuthController.me);

export default router;

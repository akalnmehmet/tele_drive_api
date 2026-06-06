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

router.use(authLimiter);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Yeni kullanıcı kaydı
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterDto' }
 *     responses:
 *       201: { description: Kullanıcı oluşturuldu }
 *       409: { description: E-posta zaten kayıtlı }
 */
router.post('/register', validate(RegisterDto), AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Giriş yap
 *     description: 2FA kapalıysa preAuthToken (stage:full) direkt tüm endpoint'lerde kullanılabilir.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginDto' }
 *     responses:
 *       200:
 *         description: Token döner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     preAuthToken:  { type: string }
 *                     totpRequired:  { type: boolean }
 *                     refreshToken:  { type: string }
 */
router.post('/login',    validate(LoginDto),    AuthController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Access token yenile (refresh token rotasyonu)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Yeni token çifti }
 *       401: { description: Geçersiz refresh token }
 */
router.post('/refresh',  validate(RefreshDto),  AuthController.refresh);

/**
 * @openapi
 * /auth/2fa/verify:
 *   post:
 *     tags: [Auth]
 *     summary: TOTP kodunu doğrula (2FA akışı 2. adım)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TotpDto' }
 *     responses:
 *       200: { description: Full access token + refresh token }
 *       401: { description: Geçersiz TOTP kodu }
 */
router.post('/2fa/verify', validate(VerifyTotpDto), AuthController.verifyTotp);

/**
 * @openapi
 * /auth/2fa/setup:
 *   post:
 *     tags: [Auth]
 *     summary: TOTP kurulumu başlat — QR kodu üret
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: QR URI ve secret
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     qrUri:  { type: string }
 *                     secret: { type: string }
 */
router.post('/2fa/setup',   authenticate, AuthController.setup2FA);

/**
 * @openapi
 * /auth/2fa/enable:
 *   post:
 *     tags: [Auth]
 *     summary: TOTP'yi aktifleştir
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TotpDto' }
 *     responses:
 *       200: { description: 2FA aktif }
 */
router.post('/2fa/enable',  authenticate, validate(VerifyTotpDto), AuthController.enable2FA);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Oturumu kapat
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Çıkış yapıldı }
 */
router.post('/logout',      authenticate, AuthController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Aktif kullanıcı bilgisi
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Kullanıcı profili }
 */
router.get('/me',           authenticate, AuthController.me);

export default router;

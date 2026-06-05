import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import qrcode from 'qrcode';
import { totpUtil } from '../../common/utils/totp';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/AppError';
import { UserRepository } from '../users/user.repository';
import { User, UserRole } from '../users/user.entity';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { JwtPayload } from '../../middleware/authenticate';

// ─── Token helpers ─────────────────────────────────────────────────────────

function signAccessToken(user: User, stage: 'pre-auth' | 'full'): string {
  const payload: JwtPayload = { userId: user.id, role: user.role, stage };
  const expiresIn =
    stage === 'pre-auth' ? env.JWT_PRE_AUTH_EXPIRES_IN : env.JWT_ACCESS_EXPIRES_IN;
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

function signRefreshToken(user: User): string {
  return jwt.sign({ userId: user.id, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

// ─── Auth Service ───────────────────────────────────────────────────────────

export const AuthService = {
  // ── Register ──────────────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await UserRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppError('Bu e-posta adresi zaten kullanılıyor', 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = UserRepository.create({
      email: dto.email,
      passwordHash,
      role: dto.role as UserRole,
    });

    await UserRepository.save(user);
    return { message: 'Kayıt başarılı. Lütfen giriş yapın.' };
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<{
    preAuthToken: string;
    totpRequired: boolean;
    message: string;
  }> {
    const user = await UserRepository.findByEmail(dto.email);
    if (!user) {
      throw new AppError('E-posta veya şifre hatalı', 401);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('E-posta veya şifre hatalı', 401);
    }

    // 2FA aktif değilse direkt full token ver
    if (!user.totpEnabled) {
      const accessToken = signAccessToken(user, 'full');
      const refreshToken = signRefreshToken(user);

      user.refreshToken = await bcrypt.hash(refreshToken, 10);
      await UserRepository.save(user);

      return {
        preAuthToken: accessToken,
        totpRequired: false,
        message: '2FA aktif değil. Direkt erişim sağlandı.',
      };
    }

    // 2FA aktifse pre-auth token ver
    const preAuthToken = signAccessToken(user, 'pre-auth');
    return {
      preAuthToken,
      totpRequired: true,
      message: '2FA kodu gerekli.',
    };
  },

  // ── 2FA Setup ─────────────────────────────────────────────────────────────
  async setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string; manualKey: string }> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
    if (user.totpEnabled) throw new AppError('2FA zaten aktif', 400);

    const secret = totpUtil.generateSecret();
    const otpAuthUrl = totpUtil.toUri('TeleDrive API', user.email, secret);
    const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);

    // Secret'ı geçici olarak kaydet (henüz aktif değil)
    user.totpSecret = secret;
    await UserRepository.save(user);

    return { secret, qrCodeUrl, manualKey: secret };
  },

  // ── 2FA Enable (ilk kez doğrulama) ───────────────────────────────────────
  async enable2FA(userId: string, code: string): Promise<{ message: string }> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
    if (!user.totpSecret) throw new AppError('Önce /auth/2fa/setup endpoint\'ini çağırın', 400);
    if (user.totpEnabled) throw new AppError('2FA zaten aktif', 400);

    const isValid = totpUtil.verify(user.totpSecret, code);
    if (!isValid) throw new AppError('Geçersiz TOTP kodu', 401);

    user.totpEnabled = true;
    await UserRepository.save(user);

    return { message: '2FA başarıyla aktifleştirildi' };
  },

  // ── 2FA Verify (login akışı) ──────────────────────────────────────────────
  async verifyTotp(
    userId: string,
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
    if (!user.totpEnabled || !user.totpSecret) {
      throw new AppError('2FA bu hesap için aktif değil', 400);
    }

    const isValid = totpUtil.verify(user.totpSecret, code);
    if (!isValid) throw new AppError('Geçersiz veya süresi dolmuş TOTP kodu', 401);

    const accessToken = signAccessToken(user, 'full');
    const refreshToken = signRefreshToken(user);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await UserRepository.save(user);

    return { accessToken, refreshToken };
  },

  // ── Refresh Token ─────────────────────────────────────────────────────────
  async refresh(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { userId: string; type: string };

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as typeof payload;
    } catch {
      throw new AppError('Geçersiz veya süresi dolmuş refresh token', 401);
    }

    if (payload.type !== 'refresh') {
      throw new AppError('Geçersiz token tipi', 401);
    }

    const user = await UserRepository.findById(payload.userId);
    if (!user || !user.refreshToken) {
      throw new AppError('Oturum bulunamadı', 401);
    }

    const isMatch = await bcrypt.compare(token, user.refreshToken);
    if (!isMatch) throw new AppError('Refresh token eşleşmiyor', 401);

    // Token rotation: her refresh'te yeni token çifti
    const newAccessToken = signAccessToken(user, 'full');
    const newRefreshToken = signRefreshToken(user);

    user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
    await UserRepository.save(user);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  async logout(userId: string): Promise<{ message: string }> {
    const user = await UserRepository.findById(userId);
    if (user) {
      user.refreshToken = null;
      await UserRepository.save(user);
    }
    return { message: 'Çıkış yapıldı' };
  },
};

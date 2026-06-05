import rateLimit from 'express-rate-limit';

export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Çok fazla giriş denemesi. 15 dakika bekleyin.' },
});

export const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // araç başına dakikada 300 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Telemetri istek limiti aşıldı.' },
});

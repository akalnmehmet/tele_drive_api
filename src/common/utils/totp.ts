/**
 * RFC 6238 tabanlı TOTP implementasyonu
 * Node.js yerleşik crypto modülü — harici bağımlılık yok
 */
import crypto from 'crypto';

// Base32 decode (RFC 4648)
function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const str = input.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = Buffer.alloc(Math.floor((str.length * 5) / 8));

  for (const char of str) {
    const charIndex = alphabet.indexOf(char);
    if (charIndex === -1) continue;
    value = (value << 5) | charIndex;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output.slice(0, index);
}

// Base32 encode
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += '=';
  return output;
}

// HOTP — HMAC-SHA1 tabanlı OTP
function hotp(secret: string, counter: number, digits = 6): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, '0');
}

// ─── Public API ─────────────────────────────────────────────────────────────

const PERIOD = 30;
const DIGITS = 6;
const WINDOW = 1; // ±1 periyot toleransı (saat kayması için)

export const totpUtil = {
  /**
   * Kriptografik olarak güvenli base32 secret üretir
   */
  generateSecret(): string {
    return base32Encode(crypto.randomBytes(20));
  },

  /**
   * Verilen secret için mevcut TOTP kodunu üretir
   */
  generate(secret: string): string {
    const counter = Math.floor(Date.now() / 1000 / PERIOD);
    return hotp(secret, counter, DIGITS);
  },

  /**
   * TOTP kodunu doğrular (±WINDOW periyot toleransıyla)
   */
  verify(secret: string, token: string): boolean {
    const counter = Math.floor(Date.now() / 1000 / PERIOD);
    for (let i = -WINDOW; i <= WINDOW; i++) {
      if (hotp(secret, counter + i, DIGITS) === token) return true;
    }
    return false;
  },

  /**
   * Google Authenticator / Aegis ile uyumlu otpauth URI üretir
   */
  toUri(issuer: string, account: string, secret: string): string {
    const label = encodeURIComponent(`${issuer}:${account}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: String(DIGITS),
      period: String(PERIOD),
    });
    return `otpauth://totp/${label}?${params.toString()}`;
  },
};

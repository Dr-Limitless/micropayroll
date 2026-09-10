const crypto = require('crypto');

// Standard RFC 4648 Base32 alphabet
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to a Base32 string (without padding)
 */
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string to a Buffer
 */
function base32Decode(base32) {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 secret for TOTP (160 bits = 20 bytes = 32 Base32 characters)
 */
function generateSecret(byteLength = 20) {
  const randomBytes = crypto.randomBytes(byteLength);
  return base32Encode(randomBytes);
}

/**
 * Generates an RFC 6238 TOTP 6-digit code for a given counter / timestamp
 */
function generateTotp(secret, time = Date.now(), timeStep = 30) {
  const counter = Math.floor(time / 1000 / timeStep);
  const key = base32Decode(secret);

  // Buffer counter as 8-byte big-endian integer
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = code % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies an RFC 6238 TOTP code against a secret with time-drift tolerance window (default ±1 window = ±30s)
 */
function verifyTotp(token, secret, window = 1, time = Date.now(), timeStep = 30) {
  if (!token || !secret) return false;
  const cleanToken = String(token).trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const currentCounter = Math.floor(time / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const checkTime = (currentCounter + i) * timeStep * 1000;
    const generated = generateTotp(secret, checkTime, timeStep);
    if (generated === cleanToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an otpauth URI recognized by Google Authenticator, Authy, Microsoft Authenticator
 */
function generateOtpAuthUri(accountEmail, secret, issuer = 'Microfinancial MMS') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountEmail);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

let QRCode;
try {
  QRCode = require('qrcode');
} catch (_) {
  QRCode = null;
}

/**
 * Generates an official PNG DataURL QR code for Google Authenticator scanning
 */
async function generateQrCodeDataUrl(otpauthUri) {
  if (QRCode) {
    return QRCode.toDataURL(otpauthUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  }
  // Fallback to QuickChart standard public QR generator
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otpauthUri)}`;
}

module.exports = {
  generateSecret,
  generateTotp,
  verifyTotp,
  generateOtpAuthUri,
  generateQrCodeDataUrl,
  base32Decode,
  base32Encode
};


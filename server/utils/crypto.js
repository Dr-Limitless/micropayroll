const crypto = require('crypto');

// Default 256-bit key (32 bytes) from env or fallback
const secret = process.env.AES_SECRET_KEY || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const KEY = crypto.createHash('sha256').update(String(secret)).digest();
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string|number} text 
 * @returns {string} Encrypted string format: "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
function encryptAES256(text) {
  if (text === null || text === undefined || text === '') return '';
  const textStr = String(text);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(textStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt ciphertext encrypted with AES-256-GCM
 * @param {string} encryptedStr 
 * @returns {string} Plaintext
 */
function decryptAES256(encryptedStr) {
  if (!encryptedStr || typeof encryptedStr !== 'string') return '';
  if (!encryptedStr.startsWith('enc:v1:')) {
    // Not encrypted format or already plain
    return encryptedStr;
  }
  
  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 5) return encryptedStr;
    
    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const ciphertext = parts[4];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('AES-256 Decryption error:', err.message);
    return '[ENCRYPTED DATA]';
  }
}

/**
 * Mask sensitive string (e.g. Bank Account: ****-****-1234)
 */
function maskString(str, visibleEndChars = 4) {
  if (!str) return '';
  const s = String(str);
  if (s.length <= visibleEndChars) return s;
  return '*'.repeat(s.length - visibleEndChars) + s.slice(-visibleEndChars);
}

module.exports = {
  encryptAES256,
  decryptAES256,
  maskString,
  ALGORITHM
};

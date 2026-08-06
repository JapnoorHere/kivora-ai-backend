import crypto from 'node:crypto';
import { config } from '../config/env.config.js';

const ALGORITHM = 'aes-256-gcm';
// Hashed so any length/format of ENCRYPTION_KEY in .env always yields a valid 32-byte AES-256 key
const KEY = crypto.createHash('sha256').update(config.security.encryptionKey).digest();

/** Encrypts a plaintext API key for storage. Returns `iv:authTag:ciphertext` (all hex), or null. */
export const encrypt = (plainText) => {
  if (!plainText) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':');
};

/** Reverses `encrypt`. Returns null if given null/malformed input rather than throwing. */
export const decrypt = (payload) => {
  if (!payload) return null;
  const parts = payload.split(':');
  if (parts.length !== 3) return null;

  const [ivHex, tagHex, dataHex] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
};

/** Never send a full key back to the client — only enough to recognize it. */
export const maskKey = (plainText) => {
  if (!plainText) return null;
  if (plainText.length <= 8) return '••••••••';
  return `${plainText.slice(0, 4)}${'•'.repeat(8)}${plainText.slice(-4)}`;
};

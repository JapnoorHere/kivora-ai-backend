import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';

// Every token carries a unique `jti` so a single session can be revoked on logout
// without invalidating the user's other devices.
export const signToken = (payload) => {
  return jwt.sign({ ...payload, jti: randomUUID() }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

// Reads `exp` off an already-signed token rather than re-parsing JWT_EXPIRES_IN,
// so the auth cookie can be given exactly the token's own lifetime.
export const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  return decoded?.exp ? new Date(decoded.exp * 1000) : null;
};

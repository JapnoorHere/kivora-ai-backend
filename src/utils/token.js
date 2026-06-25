import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';

/**
 * Signs a payload to generate a JSON Web Token.
 * @param {Object} payload - Data payload to embed inside the token (typically holds user ID)
 * @returns {string} The signed JWT token string
 */
export const signToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verifies a JWT token against the application's secret.
 * @param {string} token - The JWT string to verify
 * @returns {Object} The decoded token payload if verified
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

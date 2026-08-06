import bcrypt from 'bcryptjs';
import { User } from '../user/user.model.js';
import { RevokedToken } from './auth.model.js';
import { signToken, verifyToken, getTokenExpiry } from '../../utils/token.js';
import { conflict, unauthorized } from '../../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';

const MONGO_DUPLICATE_KEY = 11000;

export const buildAuthUserView = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  onboardingCompleted: user.preferences?.onboardingCompleted || false,
});

export const signupUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw conflict(MESSAGES.AUTH.EMAIL_TAKEN, ERROR_CODES.AUTH_EMAIL_TAKEN);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await User.create({ name, email, password: hashedPassword });
  } catch (error) {
    // Two concurrent signups can both clear the findOne check above; the unique
    // index is what actually settles it, and losing that race is still a conflict.
    if (error?.code === MONGO_DUPLICATE_KEY) {
      throw conflict(MESSAGES.AUTH.EMAIL_TAKEN, ERROR_CODES.AUTH_EMAIL_TAKEN);
    }
    throw error;
  }

  return {
    user: buildAuthUserView(user),
    token: signToken({ id: user._id }),
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Same message for wrong email or wrong password — prevents email harvesting
    throw unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  return {
    user: buildAuthUserView(user),
    token: signToken({ id: user._id }),
  };
};

// Best-effort by design: logout must clear the caller's cookie even when the token
// it presents is already expired, malformed, or missing entirely.
export const revokeSessionToken = async (token) => {
  if (!token) return;

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return;
  }

  const expiresAt = getTokenExpiry(token);
  if (!decoded.jti || !expiresAt) return;

  await RevokedToken.updateOne(
    { jti: decoded.jti },
    { $setOnInsert: { jti: decoded.jti, expiresAt } },
    { upsert: true },
  );
};

export const isSessionTokenRevoked = async (jti) => {
  if (!jti) return false;
  return Boolean(await RevokedToken.exists({ jti }));
};

import bcrypt from 'bcryptjs';
import { User } from '../user/user.model.js';
import { signToken } from '../../utils/token.js';
import { conflict, unauthorized } from '../../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';

export const signupUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw conflict(MESSAGES.AUTH.EMAIL_TAKEN, ERROR_CODES.AUTH_EMAIL_TAKEN);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  const token = signToken({ id: user._id });

  return {
    user: { id: user._id, name: user.name, email: user.email },
    token,
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

  const token = signToken({ id: user._id });

  return {
    user: { id: user._id, name: user.name, email: user.email },
    token,
  };
};

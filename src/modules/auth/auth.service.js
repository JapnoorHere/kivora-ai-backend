import bcrypt from 'bcryptjs';
import { User } from '../user/user.model.js';
import { signToken } from '../../utils/token.js';
import { createError, unauthorized } from '../../errors/index.js';
import { HTTP_STATUS } from '../../constants/index.js';

/**
 * Registers a new user in the database.
 * @param {Object} credentials - User credentials
 * @param {string} credentials.name - User full name
 * @param {string} credentials.email - User email address
 * @param {string} credentials.password - User raw password
 * @returns {Promise<Object>} Object containing the created user metadata and authentication token
 */
export const signupUser = async ({ name, email, password }) => {
  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('Email is already registered to another account', HTTP_STATUS.CONFLICT);
  }

  // 2. Hash password securely
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 3. Create user document
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // 4. Generate JWT
  const token = signToken({ id: user._id });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  };
};

/**
 * Authenticates a user with email and password.
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email address
 * @param {string} credentials.password - User raw password
 * @returns {Promise<Object>} Object containing user details and the custom JWT
 */
export const loginUser = async ({ email, password }) => {
  // 1. Fetch user by email
  const user = await User.findOne({ email });
  if (!user) {
    // Avoid specifying whether the email or password was wrong to prevent email harvesting
    throw unauthorized('Invalid email or password');
  }

  // 2. Verify hashed password comparison
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw unauthorized('Invalid email or password');
  }

  // 3. Generate custom backend token
  const token = signToken({ id: user._id });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  };
};

import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables from .env file
dotenv.config();

// Define Joi schema for validating environment variables
const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  MONGO_URI: Joi.string().required().description('MongoDB connection URI'),
  GEMINI_API_KEY: Joi.string().required().description('Google Gemini API key'),
  JWT_SECRET: Joi.string().required().description('JWT signing secret key'),
  JWT_EXPIRES_IN: Joi.string().default('1d').description('JWT token lifetime'),
}).unknown().required();

// Validate variables
const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  port: envVars.PORT,
  env: envVars.NODE_ENV,
  db: {
    uri: envVars.MONGO_URI,
  },
  gemini: {
    apiKey: envVars.GEMINI_API_KEY,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
  },
};

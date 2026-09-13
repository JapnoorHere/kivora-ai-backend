import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  MONGO_URI: Joi.string().required().description('MongoDB connection URI'),
  GEMINI_API_KEY: Joi.string().required().description('Google Gemini API key — used as the free-tier fallback for users without their own key'),
  GROQ_API_KEY: Joi.string().allow('').optional().description('Groq API key — optional system fallback'),
  PEXELS_API_KEY: Joi.string().allow('').optional().description('Pexels API key — optional; powers ingredient/recipe photos, no-ops if unset'),
  ENCRYPTION_KEY: Joi.string().min(16).required().description('Symmetric secret used to encrypt user-supplied AI provider API keys at rest'),
  FREE_DAILY_LIMIT: Joi.number().integer().min(0).default(5).description('Recipe generations per day for users without their own API key'),
  JWT_SECRET: Joi.string().min(32).required().description('JWT signing secret key'),
  JWT_EXPIRES_IN: Joi.string().default('1d').description('JWT token lifetime'),
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:4200,http://127.0.0.1:4200').description('Comma-separated list of allowed CORS origins'),
}).unknown().required();

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
  ai: {
    geminiApiKey: envVars.GEMINI_API_KEY,
    groqApiKey: envVars.GROQ_API_KEY || null,
  },
  pexels: {
    apiKey: envVars.PEXELS_API_KEY || null,
  },
  security: {
    encryptionKey: envVars.ENCRYPTION_KEY,
  },
  freeDailyLimit: envVars.FREE_DAILY_LIMIT,
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
  },
  cors: {
    origins: envVars.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  },
};

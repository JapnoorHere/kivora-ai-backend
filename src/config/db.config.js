import mongoose from 'mongoose';
import { config } from './env.config.js';
import { logInfo, logWarn, logError } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.uri);
    logInfo(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logError(`Database connection error: ${error.message}`, error);
    process.exit(1); // Exit process with failure
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logWarn('MongoDB disconnected!');
});

mongoose.connection.on('error', (err) => {
  logError(`MongoDB connection error: ${err.message}`, err);
});

// Close Mongoose connection if node process terminates
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logInfo('MongoDB connection closed through app termination');
  process.exit(0);
});

import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/env.config.js';
import { connectDB } from './config/db.config.js';
import { logInfo, logError } from './utils/logger.js';

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logInfo(`Kivora AI Backend running in [${config.env}] on Port ${config.port}`);
  });

  const shutdown = (signal) => {
    logInfo(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await mongoose.disconnect();
      logInfo('MongoDB connection closed');
      process.exit(0);
    });
  };

  process.on('unhandledRejection', (err) => {
    logError('UNHANDLED REJECTION! Shutting down gracefully...', err);
    shutdown('unhandledRejection');
  });

  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('uncaughtException', (err) => {
  logError('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

startServer();

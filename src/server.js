import app from './app.js';
import { config } from './config/env.config.js';
import { connectDB } from './config/db.config.js';
import { logInfo, logError } from './utils/logger.js';

// Bootstrapping function
const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Start HTTP server
  const server = app.listen(config.port, () => {
    logInfo(`Kivora AI Backend running in [${config.env}] on Port ${config.port}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logError('UNHANDLED REJECTION! Shutting down gracefully...', err);
    server.close(() => {
      process.exit(1);
    });
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logError('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Run the bootstrap
startServer();

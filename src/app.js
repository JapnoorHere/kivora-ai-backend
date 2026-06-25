import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { errorHandler } from './errors/error.handler.js';
import { notFound } from './errors/index.js';
import { logHttp } from './utils/logger.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logging middleware
app.use((req, res, next) => {
  logHttp(`${req.method} ${req.path}`);
  next();
});

// Base health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Kivora AI Backend is running smoothly' });
});

// Register central master router
app.use('/api/v1', apiRouter);

// Catch-all 404 route handler
app.use((req, res, next) => {
  next(notFound(`Endpoint not found: ${req.method} ${req.path}`));
});

// Global error handler (must be the last middleware)
app.use(errorHandler);

export default app;

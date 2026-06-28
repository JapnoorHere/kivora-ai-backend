import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import apiRouter from './routes/index.js';
import { errorHandler } from './errors/error.handler.js';
import { notFound } from './errors/index.js';
import { logHttp } from './utils/logger.js';
import { MESSAGES, ERROR_CODES } from './constants/index.js';
import { config } from './config/env.config.js';
import { attachRequestContext } from './middlewares/request-context.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Strip MongoDB operators ($, .) from req.body, req.params, req.query
app.use(mongoSanitize());
app.use(attachRequestContext);

app.use((req, res, next) => {
  logHttp(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: MESSAGES.APP.HEALTH_OK });
});

app.use('/api/v1', apiRouter);

app.use((req, res, next) => {
  next(notFound(MESSAGES.APP.ENDPOINT_NOT_FOUND(req.method, req.path), ERROR_CODES.ENDPOINT_NOT_FOUND));
});

app.use(errorHandler);

export default app;

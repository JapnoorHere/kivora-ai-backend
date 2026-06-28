import { randomUUID } from 'crypto';
import { requestContext } from '../utils/request-context.js';

export const attachRequestContext = (req, res, next) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  requestContext.run({ requestId }, next);
};

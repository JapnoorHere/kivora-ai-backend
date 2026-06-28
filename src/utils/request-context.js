import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage();

export const getRequestId = () => requestContext.getStore()?.requestId ?? null;

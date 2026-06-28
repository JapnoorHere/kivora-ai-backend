import { getRequestId } from './request-context.js';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

const getCallerInfo = () => {
  const obj = {};
  Error.captureStackTrace(obj, getCallerInfo);
  const stack = obj.stack;
  if (!stack) return '';

  const lines = stack.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ? lines[i].trim() : '';
    const isLoggerSelf = line.includes('utils/logger.js') || line.includes('utils\\logger.js');
    if (line && !isLoggerSelf && !line.includes('node:internal')) {
      const match = line.match(/at\s+(?:([^\s(]+)\s+\()?(?:file:\/\/\/)?(.*?):(\d+):(\d+)\)?$/);
      if (match) {
        const functionName = match[1] || 'anonymous';
        let absolutePath = match[2].replace(/\\/g, '/');
        const srcIndex = absolutePath.indexOf('src/');
        const relativePath = srcIndex !== -1 ? absolutePath.substring(srcIndex) : absolutePath.split('/').pop();
        return `${COLORS.gray}[${relativePath}:${match[3]} (${functionName})]${COLORS.reset} `;
      }
    }
  }
  return '';
};

const formatLog = (level, color, message, meta) => {
  const timestamp = new Date().toISOString();
  const requestId = getRequestId();
  const requestIdStr = requestId ? ` ${COLORS.gray}[${requestId.slice(0, 8)}]${COLORS.reset}` : '';
  const callerInfo = getCallerInfo();
  let metaStr = '';
  if (meta && Object.keys(meta).length > 0) {
    metaStr = `\n${COLORS.gray}Metadata:${COLORS.reset}\n${JSON.stringify(meta, null, 2)}`;
  }
  return `[${COLORS.gray}${timestamp}${COLORS.reset}]${requestIdStr} ${color}${COLORS.bold}[${level}]${COLORS.reset} ${callerInfo}: ${message}${metaStr}`;
};

export const logInfo = (message, meta = null) => {
  console.log(formatLog('INFO', COLORS.green, message, meta));
};

export const logWarn = (message, meta = null) => {
  console.warn(formatLog('WARN', COLORS.yellow, message, meta));
};

export const logError = (message, error = null, meta = null) => {
  const logHeader = formatLog('ERROR', COLORS.red, message, meta);
  let errorStack = '';
  if (error) {
    if (error instanceof Error) {
      errorStack = `\n${COLORS.red}${error.stack}${COLORS.reset}`;
    } else {
      errorStack = `\n${COLORS.red}Details:\n${JSON.stringify(error, null, 2)}${COLORS.reset}`;
    }
  }
  console.error(logHeader + errorStack);
};

export const logDebug = (message, meta = null) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(formatLog('DEBUG', COLORS.cyan, message, meta));
  }
};

export const logHttp = (message, meta = null) => {
  console.log(formatLog('HTTP', COLORS.cyan, message, meta));
};

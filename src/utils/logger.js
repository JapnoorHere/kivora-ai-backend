// ANSI escape codes for coloring terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

/**
 * Utility to extract call site details (file, line number, function name)
 * from the runtime stack trace.
 * @returns {string} Formatted caller string (e.g. "[src/app.js:15 (handleGet)] ")
 */
const getCallerInfo = () => {
  const obj = {};
  Error.captureStackTrace(obj, getCallerInfo);
  const stack = obj.stack;
  
  if (!stack) return '';
  
  const lines = stack.split('\n');
  
  // Find the first line in the stack trace that is not logger.js, internal node code, or node modules
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ? lines[i].trim() : '';
    
    // Skip logger.js itself and node internal library calls
    const isLoggerSelf = line.includes('utils/logger.js') || line.includes('utils\\logger.js');
    if (line && !isLoggerSelf && !line.includes('node:internal')) {
      // Robust regex to extract function name, file path, line number, and column (anchored at the end of line)
      const match = line.match(/at\s+(?:([^\s(]+)\s+\()?(?:file:\/\/\/)?(.*?):(\d+):(\d+)\)?$/);
      if (match) {
        const functionName = match[1] || 'anonymous';
        let absolutePath = match[2];
        const lineNumber = match[3];
        
        // Clean up Windows backslashes
        absolutePath = absolutePath.replace(/\\/g, '/');
        
        // Make path relative to project source folder
        const srcIndex = absolutePath.indexOf('src/');
        const relativePath = srcIndex !== -1 ? absolutePath.substring(srcIndex) : absolutePath.split('/').pop();
        
        return `${COLORS.gray}[${relativePath}:${lineNumber} (${functionName})]${COLORS.reset} `;
      }
    }
  }
  return '';
};

/**
 * Format a log message with timestamp, colorized level, and optional metadata.
 * @param {string} level - Log level name (INFO, WARN, etc.)
 * @param {string} color - ANSI color code
 * @param {string} message - Main log message
 * @param {Object} [meta] - Optional metadata object
 * @returns {string} Fully formatted log string
 */
const formatLog = (level, color, message, meta) => {
  const timestamp = new Date().toISOString();
  let metaStr = '';
  
  if (meta && Object.keys(meta).length > 0) {
    metaStr = `\n${COLORS.gray}Metadata:${COLORS.reset}\n${JSON.stringify(meta, null, 2)}`;
  }
  
  const callerInfo = getCallerInfo();
  
  return `[${COLORS.gray}${timestamp}${COLORS.reset}] ${color}${COLORS.bold}[${level}]${COLORS.reset} ${callerInfo}: ${message}${metaStr}`;
};

/**
 * Log informational messages (green)
 */
export const logInfo = (message, meta = null) => {
  console.log(formatLog('INFO', COLORS.green, message, meta));
};

/**
 * Log warnings (yellow)
 */
export const logWarn = (message, meta = null) => {
  console.warn(formatLog('WARN', COLORS.yellow, message, meta));
};

/**
 * Log errors (red) and prints call stack
 */
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

/**
 * Log debug messages (cyan) - only printed in development mode
 */
export const logDebug = (message, meta = null) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(formatLog('DEBUG', COLORS.cyan, message, meta));
  }
};

/**
 * Log HTTP requests (cyan)
 */
export const logHttp = (message, meta = null) => {
  console.log(formatLog('HTTP', COLORS.cyan, message, meta));
};

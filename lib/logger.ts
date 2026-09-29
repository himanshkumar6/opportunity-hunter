/**
 * Opportunity Hunter — Structured Observability & Security-Safe Logger
 *
 * Automatically sanitizes secrets, tokens, API keys, passwords, and service-role credentials
 * from log outputs, ensuring zero credential leakage in logs or observability pipelines.
 */

const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'service_role',
  'service_role_key',
  'supabase_service_role_key',
  'serpapi_key',
  'bearer',
]);

function sanitizeValue(key: string, val: unknown): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    return REDACTED;
  }
  if (typeof val === 'string') {
    // Check if string contains JWT or Bearer token patterns
    if (val.startsWith('Bearer ') || val.startsWith('eyJ')) {
      return REDACTED;
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(key, item));
  }
  if (val !== null && typeof val === 'object') {
    return sanitizeObject(val as Record<string, unknown>);
  }
  return val;
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = sanitizeValue(k, v);
  }
  return result;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload: LogPayload = {
    level,
    message,
    context: context ? sanitizeObject(context) : undefined,
    timestamp: new Date().toISOString(),
  };

  const output = `[${payload.timestamp}] [${level.toUpperCase()}] ${message}${
    payload.context ? ' ' + JSON.stringify(payload.context) : ''
  }`;

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.info(output);
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    writeLog('info', message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    writeLog('warn', message, context);
  },
  error(message: string, context?: Record<string, unknown>) {
    writeLog('error', message, context);
  },
  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      writeLog('debug', message, context);
    }
  },
};

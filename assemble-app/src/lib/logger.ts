import pino from 'pino';

/**
 * Centralized logger instance using Pino
 * Configured for structured JSON logging with appropriate log levels
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with additional context
 * @param bindings - Additional context to include in all log entries
 * @returns Child logger instance
 */
export function createLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

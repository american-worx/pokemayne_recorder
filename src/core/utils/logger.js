import winston from 'winston';
import path from 'path';
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pokemayne-recorder' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    }),

    // Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Write recording-specific logs
    new winston.transports.File({
      filename: path.join(logsDir, 'recording.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Write automation-specific logs
    new winston.transports.File({
      filename: path.join(logsDir, 'automation.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Add session-specific logging
logger.addSessionLogger = (sessionId) => {
  const sessionTransport = new winston.transports.File({
    filename: path.join(logsDir, `session_${sessionId}.log`),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  });

  logger.add(sessionTransport);
  return sessionTransport;
};

// Recording-specific logging methods
logger.recordAction = (action, details) => {
  logger.info(`[RECORDING] ${action}`, {
    category: 'recording',
    action,
    ...details
  });
};

logger.recordError = (error, context) => {
  logger.error(`[RECORDING ERROR] ${error.message}`, {
    category: 'recording_error',
    error: error.stack,
    ...context
  });
};

// Automation-specific logging methods
logger.automationStep = (step, details) => {
  logger.info(`[AUTOMATION] ${step}`, {
    category: 'automation',
    step,
    ...details
  });
};

logger.automationError = (error, context) => {
  logger.error(`[AUTOMATION ERROR] ${error.message}`, {
    category: 'automation_error',
    error: error.stack,
    ...context
  });
};

// Monitor-specific logging methods
logger.monitorEvent = (event, details) => {
  logger.info(`[MONITOR] ${event}`, {
    category: 'monitor',
    event,
    ...details
  });
};

// Performance logging
logger.performance = (operation, duration, details) => {
  logger.info(`[PERFORMANCE] ${operation} took ${duration}ms`, {
    category: 'performance',
    operation,
    duration,
    ...details
  });
};

export default logger;
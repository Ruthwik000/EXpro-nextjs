import pino from 'pino';
import { config } from './config';

export const logger = pino({
    level: config.logging.level,
    // Simplified logging for Next.js - no transport needed
    browser: {
        asObject: true
    },
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;

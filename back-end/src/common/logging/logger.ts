import { mkdirSync } from 'node:fs';
import * as winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import { LOG_DIR } from '../paths';

mkdirSync(LOG_DIR, { recursive: true });

const datePattern = process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD';
const maxSize = process.env.LOG_MAX_SIZE || '20m';
const maxFiles = process.env.LOG_MAX_FILES || '14d';

// Records are routed to a file by their `kind` field. Every log call in this
// codebase MUST pass a `kind`; combined-*.log is the unfiltered safety net that
// catches any record where a caller forgot one.
const onlyKind = (kind: string) =>
  winston.format((info) => (info.kind === kind ? info : false))();

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const rotate = (opts: { filename: string; level: string; format?: winston.Logform.Format }) =>
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: opts.filename,
    level: opts.level,
    datePattern,
    maxSize,
    maxFiles,
    zippedArchive: true,
    format: opts.format ? winston.format.combine(opts.format, baseFormat) : baseFormat,
  });

const transports: winston.transport[] = [
  // One line per HTTP request, written by morgan.
  rotate({ filename: 'access-%DATE%.log', level: 'http', format: onlyKind('access') }),
  // Application / lifecycle events.
  rotate({ filename: 'app-%DATE%.log', level: 'info', format: onlyKind('app') }),
  // 4xx warnings and 5xx errors with stack traces. Level is `warn`, NOT `error`:
  // the exception filter logs 4xx at warn, and an error-level transport would
  // drop those records into no file at all.
  rotate({ filename: 'error-%DATE%.log', level: 'warn', format: onlyKind('error') }),
  // Catch-all safety net -- deliberately unfiltered.
  rotate({ filename: 'combined-%DATE%.log', level: 'silly' }),
];

if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
    }),
  );
}

export const logger = winston.createLogger({
  // Deliberately the most permissive level. winston applies the LOGGER level
  // before any transport level, so a root level of 'info' would silently drop
  // every 'http' access record and everything the 'silly' combined transport
  // exists to catch. Per-file gating is the transport `level`s above; LOG_LEVEL
  // tunes console verbosity only.
  level: 'silly',
  levels: winston.config.npm.levels,
  format: baseFormat,
  transports,
});

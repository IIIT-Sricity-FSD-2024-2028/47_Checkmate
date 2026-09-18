import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../logging/logger';

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

// TWO independent rateLimit() calls = TWO buckets. One shared instance across
// several forRoutes paths would be one shared budget, so exhausting auth/login
// would also lock out staff/signup.
export const loginLimiter = rateLimit({
  windowMs,
  limit: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn({ message: `rate limit hit ${req.originalUrl}`, ip: req.ip, kind: 'error' });
    res.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many attempts, try again later.',
    });
  },
});

export const signupLimiter = rateLimit({
  windowMs,
  limit: Number(process.env.RATE_LIMIT_SIGNUP_MAX) || 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn({ message: `rate limit hit ${req.originalUrl}`, ip: req.ip, kind: 'error' });
    res.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many attempts, try again later.',
    });
  },
});

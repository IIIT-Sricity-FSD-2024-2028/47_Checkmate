import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { logger } from '../logging/logger';

const allowlist = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / Postman / same-origin
    if (allowlist.includes(origin)) return cb(null, true);
    logger.warn({ message: `CORS blocked origin ${origin}`, kind: 'error' });
    // NOT cb(new Error(...)) -- that surfaces as a 500 instead of a clean block.
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // x-email is required by GET/PUT /api/users/profile and the avatar upload.
  allowedHeaders: ['Content-Type', 'x-role', 'x-email', 'Authorization'],
  credentials: false,
};

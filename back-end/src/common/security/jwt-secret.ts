import { randomBytes } from 'node:crypto';
import { logger } from '../logging/logger';

/**
 * The secret that signs and verifies login tokens.
 *
 * It used to fall back to a fixed string written in the source code, so anyone
 * who read the repository could sign their own admin token. Now:
 *   - JWT_SECRET from .env is used when it is set (at least 32 characters);
 *   - in production the server refuses to start without it;
 *   - in development a random secret is made once per server start (a warning
 *     is logged; everyone simply has to sign in again after a restart).
 * The value is cached so AuthModule (signing) and JwtStrategy (checking) agree.
 */
let cachedSecret: string | null = null;

// Public values that must never be accepted (old fallback + .env.example placeholder)
const KNOWN_PUBLIC_SECRETS = ['eventpro_secret_key', 'change-me-to-a-long-random-string'];

export function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  const fromEnv = (process.env.JWT_SECRET || '').trim();
  if (fromEnv.length >= 32 && !KNOWN_PUBLIC_SECRETS.includes(fromEnv)) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to your own random value (at least 32 characters) in production.');
  }

  logger.warn({
    message: 'JWT_SECRET is missing, too short or the example placeholder: using a random secret for this run. Set it in back-end/.env to keep sessions across restarts.',
    kind: 'app',
  });
  cachedSecret = randomBytes(48).toString('hex');
  return cachedSecret;
}

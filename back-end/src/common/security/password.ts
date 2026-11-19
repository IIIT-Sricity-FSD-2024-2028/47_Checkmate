// PASSWORD HASHING (bcrypt)
//
// New passwords are hashed with bcrypt: a random salt per password and a slow,
// tunable cost, so identical passwords never share a hash and guessing is
// expensive. The hash looks like "$2a$10$<salt><hash>".
//
// Older accounts were stored as SHA-256 of one fixed salt + the password (fast,
// and the same salt for everyone). Those hashes still verify, and AuthService
// upgrades them to bcrypt the next time that user signs in (needsRehash).
import { createHash } from 'node:crypto';
import * as bcrypt from 'bcryptjs';

// Work factor: 2^10 rounds (~70 ms per check in bcryptjs) -- slow for an attacker, fine for a login
const BCRYPT_ROUNDS = 10;

// The old scheme, kept ONLY to check passwords saved before the switch
const LEGACY_SALT = 'checkmate-event-platform';
function legacySha256(password: string): string {
  return createHash('sha256').update(`${LEGACY_SALT}:${password}`).digest('hex');
}

/** Hashes a new password with bcrypt. */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

/** True when it is a bcrypt hash (otherwise it is an old SHA-256 one). */
export function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(String(hash || ''));
}

// Checks an attempt against a stored hash of either kind -- a hash is never reversed back to text.
export function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  if (isBcryptHash(hash)) return bcrypt.compareSync(password, hash);
  return legacySha256(password) === hash;
}

/** True for an old SHA-256 hash that should be replaced with bcrypt after a successful login. */
export function needsRehash(hash: string): boolean {
  return Boolean(hash) && !isBcryptHash(hash);
}

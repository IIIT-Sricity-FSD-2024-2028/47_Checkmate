// Passwords are stored as a SHA-256 hash of a fixed salt + the password.
// The salt is shared by every user rather than per-user, and SHA-256 is fast
// by design, so this is a course-project scheme -- bcrypt/argon2 is what a
// production app would use.
import { createHash } from 'node:crypto';

const SALT = 'checkmate-event-platform';

export function hashPassword(password: string): string {
  return createHash('sha256').update(`${SALT}:${password}`).digest('hex');
}

// Hash the attempt and compare -- a stored hash is never reversed back to text.
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

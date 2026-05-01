import { createHash } from 'node:crypto';

const SALT = 'checkmate-event-platform';

export function hashPassword(password: string): string {
  return createHash('sha256').update(`${SALT}:${password}`).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

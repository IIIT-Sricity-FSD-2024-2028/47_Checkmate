import { join } from 'node:path';

// __dirname is dist/common at runtime -> back-end/
export const BACKEND_ROOT = join(__dirname, '..', '..');
export const PUBLIC_ROOT = join(BACKEND_ROOT, 'public');
export const UPLOAD_DIR = join(PUBLIC_ROOT, 'uploads');
// Applicants' ID documents. Deliberately outside public/, so no URL reaches them.
export const STAFF_DOCS_DIR = join(BACKEND_ROOT, 'private', 'staff-documents');
export const LOG_DIR = join(BACKEND_ROOT, process.env.LOG_DIR || 'logs');

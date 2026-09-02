import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { diskStorage } from 'multer';
import { UPLOAD_DIR } from '../paths';

mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
]);

export const avatarMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    // randomUUID: blocks path traversal via originalname, and stops one user
    // guessing another user's avatar URL.
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${ALLOWED.get(file.mimetype) ?? '.bin'}`),
  }),
  // fileSize stops disk exhaustion; files:1 stops a multi-file flood through a
  // single-file endpoint.
  limits: { fileSize: Number(process.env.UPLOAD_MAX_BYTES) || 5 * 1024 * 1024, files: 1 },
  // The MIME whitelist blocks .html/.svg uploads, which ServeStatic would serve
  // straight back from the same origin -- a stored-XSS path, since public/ is
  // published at /.
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype)
      ? cb(null, true)
      : cb(new BadRequestException(`Unsupported file type ${file.mimetype}. Allowed: PNG, JPEG, WebP.`), false),
};

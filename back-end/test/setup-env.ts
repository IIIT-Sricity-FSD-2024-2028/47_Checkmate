// Runs before every test file. Points DataService at a fresh temp folder, so the
// tests never read or overwrite the real back-end/data/database.json.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'eventpro-test-'));

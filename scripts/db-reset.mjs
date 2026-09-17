import {existsSync} from 'node:fs';
import {unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dbPath = join(root, 'data', 'tissu.db');

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log('Local database deleted:', dbPath);
  console.log('It will be recreated and seeded automatically on next run.');
} else {
  console.log('No local database found at', dbPath);
}
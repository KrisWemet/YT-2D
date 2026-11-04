// Load studio/.env.local for CLI scripts (Node 22's built-in loader). Values are never printed.
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(file)) process.loadEnvFile(file);

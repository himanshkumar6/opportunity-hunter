import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('../digital-horizon-lead-hunter-main/digital-horizon-lead-hunter-main/.env');
console.info('Path:', envPath);
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const key = trimmed.split('=')[0].trim();
    console.info('Sibling key:', key);
  }
} else {
  console.info('Not found');
}

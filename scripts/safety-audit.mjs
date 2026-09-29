import * as fs from 'fs';
import * as path from 'path';

const SEARCH_TERMS = [
  'axios',
  'nodemailer',
  'resend',
  'sendgrid',
  'twilio',
  'smtp'
];

const SCAN_DIRS = ['app', 'components', 'lib', 'types'];

function scanDirectory(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDirectory(fullPath, results);
      }
    } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const term of SEARCH_TERMS) {
        if (content.toLowerCase().includes(term)) {
          results.push({ file: fullPath, term });
        }
      }
    }
  }
  return results;
}

console.info('=== CRITICAL SAFETY AUDIT: OUTBOUND MESSAGING ===\n');

let findings = [];
for (const dir of SCAN_DIRS) {
  scanDirectory(dir, findings);
}

console.info(`Found ${findings.length} occurrences of blacklisted messaging keywords.`);
if (findings.length > 0) {
  for (const f of findings) {
    console.info(`- [${f.term}] in ${f.file}`);
  }
} else {
  console.info('PASSED: Zero outbound messaging libraries (nodemailer, resend, sendgrid, twilio, smtp, axios) detected in application source.');
}

// Check fetch occurrences
console.info('\nAuditing fetch() calls in codebase...');
const fetchOccurrences = [];
function scanFetch(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanFetch(fullPath);
      }
    } else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('fetch(') && !line.includes('//') && !line.includes('*')) {
          fetchOccurrences.push({ file: fullPath, line: idx + 1, code: line.trim() });
        }
      });
    }
  }
}

for (const dir of SCAN_DIRS) {
  scanFetch(dir);
}

console.info(`Total fetch() calls found: ${fetchOccurrences.length}`);
fetchOccurrences.forEach(f => {
  console.info(`  ${f.file}:${f.line} -> ${f.code}`);
});

console.info('\n=== SAFETY AUDIT COMPLETE ===');

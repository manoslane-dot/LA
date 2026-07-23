#!/usr/bin/env node
const { execSync } = require('child_process');

if (process.env.VERCEL) {
  console.log('Skipping prisma generate on Vercel deployment');
  process.exit(0);
}

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (e) {
  console.error('prisma generate failed:', e);
  process.exit(1);
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning build artifacts...');

const dirsToClean = [
  '.next',
  '.swc',
  'node_modules/.cache'
];

dirsToClean.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Removed ${dir}`);
  }
});

console.log('\n🚀 Starting development server...\n');

try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start dev server');
  process.exit(1);
}

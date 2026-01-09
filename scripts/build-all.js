#!/usr/bin/env node

/**
 * Complete Build Script
 * Builds both the Chrome extension and Next.js app
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function step(message) {
  log(`\n${colors.bright}${colors.blue}▶ ${message}${colors.reset}`);
}

function success(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function error(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function run(command, description) {
  try {
    step(description);
    execSync(command, { stdio: 'inherit' });
    success(`${description} completed`);
    return true;
  } catch (err) {
    error(`${description} failed`);
    return false;
  }
}

async function buildAll() {
  log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.bright}${colors.blue}║   Complete Build - Extension + API    ║${colors.reset}`);
  log(`${colors.bright}${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  // Check if .env.local exists
  if (!fs.existsSync('.env.local')) {
    log(`${colors.yellow}⚠ Warning: .env.local not found${colors.reset}`);
    log(`${colors.yellow}  Copy .env.local.example to .env.local and add your API keys${colors.reset}\n`);
  }

  // 1. Build Chrome Extension
  if (!run('npm run build:extension', 'Building Chrome Extension')) {
    process.exit(1);
  }

  // 2. Build Next.js App
  if (!run('npm run build', 'Building Next.js Application')) {
    process.exit(1);
  }

  // 3. Create build info
  const buildInfo = {
    timestamp: new Date().toISOString(),
    extension: {
      location: './dist',
      files: fs.readdirSync('./dist').length,
    },
    nextjs: {
      location: './.next',
      mode: 'production',
    },
  };

  fs.writeFileSync(
    'build-info.json',
    JSON.stringify(buildInfo, null, 2)
  );

  // Success summary
  log(`\n${colors.bright}${colors.green}╔════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.bright}${colors.green}║         Build Successful! 🎉           ║${colors.reset}`);
  log(`${colors.bright}${colors.green}╚════════════════════════════════════════╝${colors.reset}\n`);

  log(`${colors.bright}Chrome Extension:${colors.reset}`);
  log(`  📁 Location: ${colors.blue}./dist/${colors.reset}`);
  log(`  📦 Files: ${buildInfo.extension.files}`);
  log(`  🔧 Load in Chrome: chrome://extensions/\n`);

  log(`${colors.bright}Next.js Application:${colors.reset}`);
  log(`  📁 Location: ${colors.blue}./.next/${colors.reset}`);
  log(`  🚀 Start: ${colors.blue}npm start${colors.reset}`);
  log(`  🌐 Deploy: ${colors.blue}vercel --prod${colors.reset}\n`);

  log(`${colors.bright}Next Steps:${colors.reset}`);
  log(`  1. Load extension: Open chrome://extensions/, enable Developer mode, load ./dist/`);
  log(`  2. Start API: ${colors.blue}npm start${colors.reset} (or deploy to Vercel)`);
  log(`  3. Test: Navigate to a GitHub repository\n`);
}

buildAll().catch((err) => {
  error(`Build failed: ${err.message}`);
  process.exit(1);
});

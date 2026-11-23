#!/usr/bin/env node

/**
 * ==============================================================================
 * WORKVERSE PLATFORM — CONCURRENT DEVELOPMENT ORCHESTRATOR
 * ==============================================================================
 * Concurrently spawns the Express backend (port 5000) and Vite frontend (port 5173).
 */

const { spawn } = require('node:child_process');
const path = require('node:path');

console.log('\n======================================================================');
console.log('🚀 WORKVERSE UNIFIED LOCAL DEVELOPMENT ORCHESTRATOR');
console.log('   • Backend API Server:     http://localhost:5000');
console.log('   • Frontend Client App:    http://localhost:5173');
console.log('======================================================================\n');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

function prefixStream(stream, prefix, color) {
  stream.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim().length > 0) {
        process.stdout.write(`${color}[${prefix}]\x1b[0m ${line}\n`);
      }
    }
  });
}

// 1. Spawn Backend
const backendProc = spawn(process.execPath, [path.join(rootDir, 'backend', 'server.js')], {
  cwd: path.join(rootDir, 'backend'),
  env: process.env,
});

prefixStream(backendProc.stdout, 'BACKEND', '\x1b[32m');
prefixStream(backendProc.stderr, 'BACKEND:ERR', '\x1b[31m');

// 2. Spawn Frontend
const frontendProc = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
  cwd: rootDir,
  env: process.env,
  shell: isWin,
});

prefixStream(frontendProc.stdout, 'FRONTEND', '\x1b[36m');
prefixStream(frontendProc.stderr, 'FRONTEND:ERR', '\x1b[33m');

function cleanup() {
  console.log('\n\x1b[33mGracefully terminating Workverse development services...\x1b[0m');
  try { backendProc.kill('SIGTERM'); } catch {}
  try { frontendProc.kill('SIGTERM'); } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

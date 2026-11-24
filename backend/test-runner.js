/**
 * ==============================================================================
 * WORKVERSE PLATFORM — UNIFIED MASTER TEST RUNNER & VERIFICATION CLI
 * ==============================================================================
 * Orchestrates database relational checks, API integration tests, and health audits.
 */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const startTime = Date.now();

console.log('\n======================================================================');
console.log('🛡️  WORKVERSE FULL PLATFORM AUTOMATED TEST SUITE RUNNER');
console.log(`⏰ Started At: ${new Date().toISOString()}`);
console.log('======================================================================\n');

function runStep(title, scriptName, env = process.env) {
  console.log(`\n\x1b[35m>>> RUNNING STAGE: ${title} (${scriptName})\x1b[0m\n`);
  const scriptPath = path.resolve(__dirname, scriptName);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env,
  });

  if (result.status !== 0) {
    console.error(`\n\x1b[31mStage "${title}" failed with exit code ${result.status}.\x1b[0m\n`);
    return false;
  }
  return true;
}

async function isServerRunning(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(baseUrl, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    if (await isServerRunning(baseUrl)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function main() {
  const testPort = 5052;
  const testBaseUrl = `http://127.0.0.1:${testPort}`;
  const testDbPath = path.join(os.tmpdir(), `workverse-integration-${process.pid}.sqlite`);
  const testEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(testPort),
    TEST_API_URL: testBaseUrl,
    WORKVERSE_DB_PATH: testDbPath,
    WORKVERSE_SEED_DEMO_DATA: 'true',
    JWT_SECRET: 'workverse-isolated-integration-test',
  };
  let spawnedServer = null;

  try {
    console.log(`\x1b[36m⚙️  Starting isolated integration server on port ${testPort}...\x1b[0m`);
    const serverPath = path.resolve(__dirname, 'server.js');
    spawnedServer = spawn(process.execPath, [serverPath], {
      stdio: 'ignore',
      env: testEnv,
    });
    const ready = await waitForServer(testBaseUrl);
    if (!ready) {
      throw new Error(`Failed to start isolated backend server on port ${testPort}`);
    }

    // Stage 1: SQLite Relational Integrity Suite (isolated fixture database)
    const dbPassed = runStep('Database Relational Integrity & Schema Audit', 'test-db.js', testEnv);
    if (!dbPassed) throw new Error('Database integrity stage failed');

    // Stage 2: REST API End-to-End Integration Suite
    const apiPassed = runStep('REST API End-to-End Integration Suite', 'test-api.js', testEnv);
    if (!apiPassed) throw new Error('REST API stage failed');

    spawnedServer.kill();
    spawnedServer = null;

    // Stage 3: Multi-user ownership and private-data isolation
    const isolationPassed = runStep('Live User Ownership & Data Isolation Suite', 'test-live-data.js', testEnv);
    if (!isolationPassed) throw new Error('User data isolation stage failed');
  } finally {
    if (spawnedServer) spawnedServer.kill();
    for (const file of [testDbPath, `${testDbPath}-wal`, `${testDbPath}-shm`]) {
      fs.rmSync(file, { force: true });
    }
  }

  // Stage 4: Automated Database Backup & Snapshot Integrity
  const backupPassed = runStep('Database Atomic Snapshot & Backup Verification', 'backup.js');
  if (!backupPassed) {
    process.exit(1);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n======================================================================');
  console.log('🏆 WORKVERSE PLATFORM VERIFICATION SUMMARY:');
  console.log('   • Stage 1 (Database Relational Schema):   \x1b[32mPASSED\x1b[0m');
  console.log('   • Stage 2 (REST API Integration Suite):   \x1b[32mPASSED\x1b[0m');
  console.log('   • Stage 3 (User Data Isolation Suite):    \x1b[32mPASSED\x1b[0m');
  console.log('   • Stage 4 (Database Atomic Snapshot):     \x1b[32mBACKUP VERIFIED\x1b[0m');
  console.log(`   • Total Test Duration:                    ${durationSec}s`);
  console.log('   • Platform Health Status:                 \x1b[32m100% OPERATIONAL & CERTIFIED\x1b[0m');
  console.log('======================================================================\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

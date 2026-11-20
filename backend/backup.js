/**
 * ==============================================================================
 * WORKVERSE PLATFORM — AUTOMATED DATABASE BACKUP & ROTATION RUNNER
 * ==============================================================================
 * Performs atomic SQLite WAL snapshots and retention rotation.
 */

const fs = require('node:fs');
const path = require('node:path');
const { db } = require('./db');

const BACKUP_DIR = path.resolve(__dirname, 'backups');
const MAX_BACKUPS = 7;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function createBackup() {
  ensureBackupDir();
  const filename = `backup_${getTimestamp()}.sqlite`;
  const targetPath = path.join(BACKUP_DIR, filename);

  console.log(`\n======================================================================`);
  console.log(`📦 WORKVERSE DATABASE ATOMIC BACKUP IN PROGRESS`);
  console.log(`📁 Destination: ${targetPath}`);
  console.log(`======================================================================\n`);

  try {
    // SQLite built-in atomic snapshot
    db.exec(`VACUUM INTO '${targetPath.replace(/\\/g, '/')}'`);
    const stats = fs.statSync(targetPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`\x1b[32m✔ Snapshot successfully created: ${filename} (${sizeKB} KB)\x1b[0m`);

    rotateBackups();
    return targetPath;
  } catch (err) {
    console.error(`\x1b[31m✖ Backup failed:\x1b[0m`, err.message);
    throw err;
  }
}

function listBackups() {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => {
      const fullPath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(fullPath);
      return {
        name: f,
        sizeKB: (stat.size / 1024).toFixed(1),
        created: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.created.localeCompare(a.created));

  console.log(`\n======================================================================`);
  console.log(`📂 WORKVERSE STORED BACKUP SNAPSHOTS (${files.length} Total)`);
  console.log(`======================================================================`);
  if (files.length === 0) {
    console.log('No backup snapshots found.');
  } else {
    for (const f of files) {
      console.log(`• ${f.name.padEnd(35)} | ${f.sizeKB.padStart(8)} KB | ${f.created}`);
    }
  }
  console.log(`======================================================================\n`);
  return files;
}

function rotateBackups() {
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => ({
      name: f,
      fullPath: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    console.log(`🧹 Rotating backups (retaining newest ${MAX_BACKUPS})...`);
    for (const b of toDelete) {
      try {
        fs.unlinkSync(b.fullPath);
        console.log(`  - Deleted expired snapshot: ${b.name}`);
      } catch (e) {
        console.warn(`  ! Could not delete ${b.name}:`, e.message);
      }
    }
  }
}

if (require.main === module) {
  const isList = process.argv.includes('--list');
  if (isList) {
    listBackups();
  } else {
    try {
      createBackup();
      listBackups();
    } catch {
      process.exit(1);
    }
  }
}

module.exports = { createBackup, listBackups, rotateBackups };

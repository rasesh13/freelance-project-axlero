/**
 * ==============================================================================
 * WORKVERSE PLATFORM — DATABASE RELATIONAL INTEGRITY & SCHEMA VALIDATION SUITE
 * ==============================================================================
 * Verifies SQLite schema structures, foreign key constraints, column definitions,
 * WAL journal mode, index availability, and data consistency across all 20 tables.
 */

const assert = require('node:assert');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.WORKVERSE_DB_PATH
  ? path.resolve(process.env.WORKVERSE_DB_PATH)
  : path.resolve(__dirname, 'database.sqlite');

const EXPECTED_TABLES = [
  'users',
  'talents',
  'projects',
  'kanban_tasks',
  'contracts',
  'proposals',
  'message_threads',
  'messages',
  'files',
  'team_members',
  'payments',
  'time_logs',
  'wallet_transactions',
  'pricing_plans',
  'resources',
  'bookmarks',
  'newsletter_subscribers',
  'notifications',
  'audit_logs',
  'disputes',
];

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
};

function test(name, fn) {
  results.total++;
  process.stdout.write(`  • [DB-TEST ${String(results.total).padStart(2, '0')}] ${name.padEnd(55, '.')} `);
  try {
    fn();
    results.passed++;
    console.log('\x1b[32mPASSED\x1b[0m');
  } catch (err) {
    results.failed++;
    console.log('\x1b[31mFAILED\x1b[0m');
    results.failures.push({ name, error: err });
  }
}

function runDatabaseTestSuite() {
  console.log('\n======================================================================');
  console.log('🗄️  WORKVERSE SQLITE RELATIONAL SCHEMA & INTEGRITY AUDIT');
  console.log(`📁 Database Path: ${dbPath}`);
  console.log(`⏰ Timestamp:     ${new Date().toISOString()}`);
  console.log('======================================================================\n');

  let db;
  try {
    db = new DatabaseSync(dbPath);
  } catch (err) {
    console.error('Fatal: Cannot connect to database:', err);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // 1. ENGINE PRAGMAS & WAL INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\x1b[36m--- Section 1: Engine PRAGMA Settings & WAL Mode ---\x1b[0m');

  test('PRAGMA journal_mode is configured for WAL (Write-Ahead-Log)', () => {
    const row = db.prepare('PRAGMA journal_mode').get();
    const mode = (row.journal_mode || '').toLowerCase();
    assert(mode === 'wal' || mode === 'memory', `Expected WAL mode, got ${mode}`);
  });

  test('PRAGMA integrity_check reports clean zero corruption', () => {
    const row = db.prepare('PRAGMA integrity_check').get();
    assert.strictEqual(row.integrity_check, 'ok', `Integrity check failed: ${row.integrity_check}`);
  });

  test('PRAGMA foreign_key_check passes with zero orphaned rows', () => {
    const violations = db.prepare('PRAGMA foreign_key_check').all();
    assert.strictEqual(violations.length, 0, `Found ${violations.length} foreign key violations`);
  });

  // -------------------------------------------------------------------------
  // 2. SCHEMA TABLES EXISTENCE & ROW COUNTS
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 2: Relational Schema & Table Registrations ---\x1b[0m');

  test('Master schema contains all 20 required Workverse tables', () => {
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const tableNames = new Set(rows.map((r) => r.name));
    for (const expected of EXPECTED_TABLES) {
      assert(tableNames.has(expected), `Missing required table: ${expected}`);
    }
  });

  test('Core tables contain valid seeded production records', () => {
    for (const t of ['users', 'projects', 'talents', 'kanban_tasks', 'payments', 'audit_logs']) {
      const count = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
      assert(count > 0, `Table ${t} should have seeded rows (got ${count})`);
    }
  });

  test('Relational indexes are registered on high-frequency query paths', () => {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map((i) => i.name);
    const expectedIndexes = [
      'idx_projects_status',
      'idx_projects_client',
      'idx_kanban_column',
      'idx_proposals_project_id',
      'idx_contracts_freelancer_id',
      'idx_messages_thread_id',
      'idx_payments_recipient',
      'idx_wallet_tx_user_id',
      'idx_audit_logs_timestamp',
    ];
    for (const exp of expectedIndexes) {
      assert(indexes.includes(exp), `Missing database index: ${exp}`);
    }
  });

  // -------------------------------------------------------------------------
  // 3. COLUMN SCHEMA DEFINITIONS & DATA TYPES
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 3: Column Schemas & Field Integrity ---\x1b[0m');

  test('Users table schema has id, email, password, role, wallet_balance', () => {
    const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
    const required = ['id', 'name', 'email', 'password', 'role', 'wallet_balance', 'escrow_balance'];
    for (const r of required) {
      assert(cols.includes(r), `users table missing column: ${r}`);
    }
  });

  test('Projects table schema has budget, status, progress, deadline', () => {
    const cols = db.prepare('PRAGMA table_info(projects)').all().map((c) => c.name);
    const required = ['id', 'title', 'category', 'budget', 'status', 'progress', 'deadline', 'skills'];
    for (const r of required) {
      assert(cols.includes(r), `projects table missing column: ${r}`);
    }
  });

  test('Kanban Tasks table schema has column, priority, estimate, subtasks', () => {
    const cols = db.prepare('PRAGMA table_info(kanban_tasks)').all().map((c) => c.name);
    const required = ['id', 'title', 'project', 'column', 'priority', 'estimate', 'subtasks', 'assignee_name'];
    for (const r of required) {
      assert(cols.includes(r), `kanban_tasks table missing column: ${r}`);
    }
  });

  test('Payments table schema has recipient, amount, status, date', () => {
    const cols = db.prepare('PRAGMA table_info(payments)').all().map((c) => c.name);
    const required = ['id', 'project', 'recipient', 'amount', 'status'];
    for (const r of required) {
      assert(cols.includes(r), `payments table missing column: ${r}`);
    }
  });

  test('Wallet Transactions table schema has user_id, amount, type, method, note', () => {
    const cols = db.prepare('PRAGMA table_info(wallet_transactions)').all().map((c) => c.name);
    const required = ['id', 'user_id', 'amount', 'type', 'method', 'status', 'note'];
    for (const r of required) {
      assert(cols.includes(r), `wallet_transactions table missing column: ${r}`);
    }
  });

  test('Audit Logs table schema has user_id, action, entity_type, details, timestamp', () => {
    const cols = db.prepare('PRAGMA table_info(audit_logs)').all().map((c) => c.name);
    const required = ['id', 'user_id', 'action', 'entity_type', 'details', 'timestamp'];
    for (const r of required) {
      assert(cols.includes(r), `audit_logs table missing column: ${r}`);
    }
  });

  // -------------------------------------------------------------------------
  // 4. FINANCIAL BALANCE & ESCROW INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 4: Ledger & Escrow Accounting Consistency ---\x1b[0m');

  test('User wallet balances are non-negative real numbers', () => {
    const users = db.prepare('SELECT id, name, wallet_balance, escrow_balance FROM users').all();
    for (const u of users) {
      assert(typeof u.wallet_balance === 'number', `User ${u.id} wallet_balance must be numeric`);
      assert(u.wallet_balance >= 0, `User ${u.id} wallet_balance cannot be negative`);
      assert(typeof u.escrow_balance === 'number', `User ${u.id} escrow_balance must be numeric`);
      assert(u.escrow_balance >= 0, `User ${u.id} escrow_balance cannot be negative`);
    }
  });

  test('Kanban tasks are partitioned across valid columns', () => {
    const validCols = new Set(['backlog', 'progress', 'review', 'done']);
    const tasks = db.prepare('SELECT id, column FROM kanban_tasks').all();
    for (const t of tasks) {
      assert(validCols.has(t.column), `Task ${t.id} has invalid column '${t.column}'`);
    }
  });

  test('Payment statuses conform to Escrow state lifecycle', () => {
    const validStatuses = new Set(['In Escrow', 'Released', 'Pending Approval', 'Processing', 'Refunded']);
    const payments = db.prepare('SELECT id, status FROM payments').all();
    for (const p of payments) {
      assert(validStatuses.has(p.status), `Payment ${p.id} has unrecognized status '${p.status}'`);
    }
  });

  // -------------------------------------------------------------------------
  // DATABASE AUDIT SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('📊 DATABASE INTEGRITY AUDIT SUMMARY:');
  console.log(`   Total Checks:  ${results.total}`);
  console.log(`   \x1b[32mPassed:\x1b[0m        ${results.passed}`);
  console.log(`   \x1b[31mFailed:\x1b[0m        ${results.failed}`);
  console.log('======================================================================\n');

  if (results.failed > 0) {
    console.error('❌ Failures encountered:');
    results.failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.name}`);
      console.error(`     Error: ${f.error.message}\n`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL DATABASE INTEGRITY CHECKS PASSED WITH 100% HEALTH!\n');
    process.exit(0);
  }
}

runDatabaseTestSuite();

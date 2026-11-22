/**
 * ==============================================================================
 * WORKVERSE PLATFORM — STANDALONE DATABASE SEED & RESET CLI UTILITY
 * ==============================================================================
 * Re-initializes or refreshes the SQLite database with full production demo seeds.
 */

const { db, seedDatabase } = require('./db');

function runSeed() {
  console.log('\n======================================================================');
  console.log('🌱 WORKVERSE DATABASE SEEDING UTILITY');
  console.log('======================================================================\n');

  const isFresh = process.argv.includes('--fresh');

  if (isFresh) {
    console.log('⚠️  --fresh flag supplied. Cleaning existing transient records...');
    const tablesToClean = [
      'messages',
      'message_threads',
      'files',
      'time_logs',
      'wallet_transactions',
      'bookmarks',
      'notifications',
    ];

    for (const t of tablesToClean) {
      try {
        db.prepare(`DELETE FROM ${t}`).run();
      } catch (e) {
        console.warn(`Could not clear ${t}:`, e.message);
      }
    }
    console.log('✔ Transient tables cleaned.\n');
  }

  // Execute idempotent seed
  seedDatabase();

  const tables = [
    'users',
    'talents',
    'projects',
    'kanban_tasks',
    'contracts',
    'proposals',
    'payments',
    'pricing_plans',
    'resources',
  ];

  console.log('📊 Current Seed Record Inventory:');
  for (const t of tables) {
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
    console.log(`  • ${t.padEnd(20)}: ${String(count).padStart(3)} records`);
  }

  console.log('\n======================================================================');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('======================================================================\n');
}

if (require.main === module) {
  try {
    runSeed();
    process.exit(0);
  } catch (err) {
    console.error('Seeding fatal error:', err);
    process.exit(1);
  }
}

module.exports = { runSeed };

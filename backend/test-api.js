/**
 * ==============================================================================
 * WORKVERSE PLATFORM — END-TO-END REST API INTEGRATION TEST SUITE
 * ==============================================================================
 * Validates core REST API endpoints, JWT session flows, database sync,
 * project lifecycle, Drag & Drop kanban state, and escrow disbursement logic.
 */

const assert = require('node:assert');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

let authToken = null;
let currentTestUser = null;
let createdProjectId = null;
let createdKanbanTaskId = null;
let createdFileId = null;

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
};

async function test(name, fn) {
  results.total++;
  process.stdout.write(`  • [TEST ${String(results.total).padStart(2, '0')}] ${name.padEnd(58, '.')} `);
  try {
    await fn();
    results.passed++;
    console.log('\x1b[32mPASSED\x1b[0m');
  } catch (err) {
    results.failed++;
    console.log('\x1b[31mFAILED\x1b[0m');
    results.failures.push({ name, error: err });
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

async function runApiTestSuite() {
  console.log('\n======================================================================');
  console.log('🚀 WORKVERSE REST API INTEGRATION SUITE');
  console.log(`🌐 Target Base URL: ${BASE_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // 1. HEALTH & CORE METADATA
  // -------------------------------------------------------------------------
  console.log('\x1b[36m--- Section 1: Healthcheck & Metadata Endpoints ---\x1b[0m');

  await test('GET /api/health returns 200 and SQLite WAL status', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(res.data.status, 'ok');
    assert(res.data.database.includes('SQLite'), 'Database status should mention SQLite');
    assert.strictEqual(typeof res.data.uptimeSeconds, 'number');
  });

  await test('GET /api returns service metadata and openapi link', async () => {
    const res = await request('/api');
    assert.strictEqual(res.status, 200);
    assert(res.data.service.includes('Workverse'));
    assert(res.data.openApiUrl.includes('openapi.json'));
  });

  await test('GET / returns 200 and Workverse root welcome payload', async () => {
    const res = await request('/');
    assert.strictEqual(res.status, 200);
    assert(res.data.service.includes('Workverse'));
  });

  // -------------------------------------------------------------------------
  // 2. AUTHENTICATION & JWT SECURITY
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 2: Authentication & JWT Security ---\x1b[0m');

  await test('POST /api/auth/login rejects invalid credentials with 401', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'arjun@workverse.io', password: 'wrongpassword' }),
    });
    assert.strictEqual(res.status, 401);
    assert(res.data.error, 'Should return error description');
  });

  await test('POST /api/auth/login succeeds for seed user and issues JWT', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'arjun@workverse.io', password: 'password123' }),
    });
    assert.strictEqual(res.status, 200);
    assert(res.data.token, 'Response must include JWT token');
    assert.strictEqual(res.data.user.email, 'arjun@workverse.io');
    authToken = res.data.token;
    currentTestUser = res.data.user;
  });

  await test('GET /api/auth/me authenticates Bearer token', async () => {
    const res = await request('/api/auth/me');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.email, 'arjun@workverse.io');
    assert.strictEqual(res.data.user.id, currentTestUser.id);
  });

  // -------------------------------------------------------------------------
  // 3. PROJECTS LIFECYCLE & HYDRATION
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 3: Projects Hub & Workspace CRUD ---\x1b[0m');

  await test('GET /api/projects returns populated projects array', async () => {
    const res = await request('/api/projects');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data), 'Expected array response');
    assert(res.data.length > 0, 'Seed projects should be present');
  });

  await test('POST /api/projects creates a new project with valid budget', async () => {
    const newProj = {
      title: 'E2E Automated Sprint Initiative',
      category: 'Web Development',
      description: 'End-to-end integration and smoke verification project.',
      budget: '$4,500',
      budgetType: 'Fixed Price',
      duration: '3 Weeks',
      deadline: '2026-12-15',
    };
    const res = await request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(newProj),
    });
    assert.strictEqual(res.status, 201);
    assert(res.data.project && res.data.project.id);
    assert.strictEqual(res.data.project.title, newProj.title);
    createdProjectId = res.data.project.id;
  });

  await test('GET /api/projects/:id retrieves newly created project', async () => {
    assert(createdProjectId, 'Need createdProjectId');
    const res = await request(`/api/projects/${createdProjectId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.id, createdProjectId);
    assert.strictEqual(res.data.title, 'E2E Automated Sprint Initiative');
  });

  // -------------------------------------------------------------------------
  // 4. KANBAN MILESTONES & DRAG AND DROP SYNC
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 4: Kanban Sprint & DND Synchronization ---\x1b[0m');

  await test('GET /api/kanban returns sprint milestone tasks', async () => {
    const res = await request('/api/kanban');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data), 'Expected tasks array');
    assert(res.data.length > 0, 'Expected seeded kanban cards');
  });

  await test('POST /api/kanban creates deliverable card with checklist', async () => {
    const taskPayload = {
      title: 'E2E API Test Verification Card',
      project: 'E2E Automated Sprint Initiative',
      column: 'backlog',
      priority: 'High',
      estimate: '6 hrs',
      subtasks: '0/3 items',
      assigneeName: 'Arjun Mehta',
      assigneeRole: 'Frontend Lead',
      assignee: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    };
    const res = await request('/api/kanban', {
      method: 'POST',
      body: JSON.stringify(taskPayload),
    });
    assert.strictEqual(res.status, 201);
    assert(res.data.task && res.data.task.id);
    assert.strictEqual(res.data.task.title, taskPayload.title);
    createdKanbanTaskId = res.data.task.id;
  });

  await test('PATCH /api/kanban/:id/column transitions card to review column', async () => {
    assert(createdKanbanTaskId, 'Need createdKanbanTaskId');
    const res = await request(`/api/kanban/${createdKanbanTaskId}/column`, {
      method: 'PATCH',
      body: JSON.stringify({ column: 'review' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.task.column, 'review');
  });

  // -------------------------------------------------------------------------
  // 5. PROJECT DELIVERABLES & DRIVE STORAGE
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 5: Project Deliverables & Files Drive ---\x1b[0m');

  await test('GET /api/files returns uploaded workspace deliverables', async () => {
    const res = await request('/api/files');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data), 'Expected files array');
  });

  await test('POST /api/files stores new deliverable metadata', async () => {
    const filePayload = {
      name: 'E2E_Test_Audit_Report.pdf',
      size: '6.4 MB',
      project: 'E2E Automated Sprint Initiative',
    };
    const res = await request('/api/files', {
      method: 'POST',
      body: JSON.stringify(filePayload),
    });
    assert.strictEqual(res.status, 201);
    assert(res.data.file && res.data.file.id);
    assert.strictEqual(res.data.file.name, filePayload.name);
    createdFileId = res.data.file.id;
  });

  // -------------------------------------------------------------------------
  // 6. WALLET, TIME LOGGING & ESCROW DISBURSEMENT
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 6: Wallet, Time Sessions & Escrow ---\x1b[0m');

  await test('GET /api/wallet retrieves balances and transaction ledger', async () => {
    const res = await request('/api/wallet');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.data.walletBalance, 'number');
    assert.strictEqual(typeof res.data.escrowBalance, 'number');
    assert(Array.isArray(res.data.transactions));
  });

  await test('POST /api/time/log records session and updates wallet', async () => {
    const initialWallet = await request('/api/wallet');
    const initialBal = initialWallet.data.walletBalance;

    const res = await request('/api/time/log', {
      method: 'POST',
      body: JSON.stringify({
        seconds: 3600, // 1 hr
        hourly_rate: 85,
        project_title: 'E2E Automated Sprint Initiative',
        formatted_time: '01:00:00',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.data.newWalletBalance, 'number');
    assert.strictEqual(res.data.newWalletBalance, initialBal + 85);
  });

  await test('POST /api/wallet/withdraw processes withdrawal request', async () => {
    const res = await request('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        amount: 5,
        method: 'stripe',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.transactionId);
    assert.strictEqual(typeof res.data.remainingBalance, 'number');
  });

  await test('GET /api/payments returns escrow milestone records', async () => {
    const res = await request('/api/payments');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data));
  });

  // -------------------------------------------------------------------------
  // 7. CONTRACTS, PROPOSALS & MESSAGES
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 7: Collaboration, Proposals & Telemetry ---\x1b[0m');

  await test('GET /api/contracts returns active engagement contracts', async () => {
    const res = await request('/api/contracts');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data));
  });

  await test('GET /api/proposals returns submitted client/contractor proposals', async () => {
    const res = await request('/api/proposals');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data));
  });

  await test('GET /api/messages returns team conversation threads', async () => {
    const res = await request('/api/messages');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data));
  });

  await test('GET /api/stats returns live aggregated dashboard KPIs', async () => {
    const res = await request('/api/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
    assert(res.data.counts && typeof res.data.counts === 'object');
    assert.strictEqual(typeof res.data.counts.projects, 'number');
    assert.strictEqual(typeof res.data.counts.users, 'number');
  });

  await test('GET /api/search?q=saas queries full-text search', async () => {
    const res = await request('/api/search?q=saas');
    assert.strictEqual(res.status, 200);
    assert(res.data && Array.isArray(res.data.projects));
    assert(res.data.projects.length > 0);
  });

  // -------------------------------------------------------------------------
  // 8. TEARDOWN & CLEANUP
  // -------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Section 8: Teardown & Resource Cleanup ---\x1b[0m');

  if (createdKanbanTaskId) {
    await test(`DELETE /api/kanban/${createdKanbanTaskId} removes test task`, async () => {
      const res = await request(`/api/kanban/${createdKanbanTaskId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
    });
  }

  if (createdFileId) {
    await test(`DELETE /api/files/${createdFileId} removes test file`, async () => {
      const res = await request(`/api/files/${createdFileId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
    });
  }

  if (createdProjectId) {
    await test(`DELETE /api/projects/${createdProjectId} removes test project`, async () => {
      const res = await request(`/api/projects/${createdProjectId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
    });
  }

  // -------------------------------------------------------------------------
  // TEST SUITE REPORT SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('📊 TEST EXECUTION SUMMARY:');
  console.log(`   Total Tests:  ${results.total}`);
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
    console.log('🎉 ALL INTEGRATION API TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runApiTestSuite().catch((err) => {
  console.error('Fatal Test Suite Runner Error:', err);
  process.exit(1);
});

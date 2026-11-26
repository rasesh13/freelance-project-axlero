const { spawn } = require('node:child_process');
const path = require('node:path');
const { db } = require('./db');
const { inferAvatarStyle } = require('./avatar');

const port = 5051;
const base = `http://127.0.0.1:${port}/api`;
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const createdUserIds = [];
const createdProjectIds = [];
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function api(pathname, { token, method = 'GET', body, expected = 200 } = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-bypass-ratelimit': '1',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  assert(response.status === expected, `${method} ${pathname}: expected ${expected}, received ${response.status} (${JSON.stringify(data)})`);
  return data;
}

async function register(role, label) {
  const data = await api('/auth/register', {
    method: 'POST',
    expected: 201,
    body: {
      name: `${label} ${stamp}`,
      email: `${label.toLowerCase()}-${stamp}@example.test`,
      password: 'LiveData123!',
      role,
    },
  });
  createdUserIds.push(data.user.id);
  return data;
}

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Live-data test server did not start');
}

function cleanup() {
  const ids = createdUserIds;
  for (const projectId of createdProjectIds) {
    db.prepare('DELETE FROM disputes WHERE contract_id IN (SELECT id FROM contracts WHERE title IN (SELECT title FROM projects WHERE id = ?))').run(projectId);
    db.prepare('DELETE FROM files WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM team_members WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM payments WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM proposals WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM kanban_tasks WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  }
  for (const userId of ids) {
    const threads = db.prepare('SELECT id FROM message_threads WHERE owner_id = ? OR participant_id = ?').all(userId, userId);
    for (const thread of threads) db.prepare('DELETE FROM messages WHERE thread_id = ?').run(thread.id);
    db.prepare('DELETE FROM message_threads WHERE owner_id = ? OR participant_id = ?').run(userId, userId);
    db.prepare('DELETE FROM disputes WHERE opened_by = ? OR against_user_id = ?').run(userId, userId);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM wallet_transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM demo_payments WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM time_logs WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM bookmarks WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM files WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM team_members WHERE owner_id = ? OR member_user_id = ?').run(userId, userId);
    db.prepare('DELETE FROM payments WHERE client_id = ? OR recipient_id = ?').run(userId, userId);
    db.prepare('DELETE FROM contracts WHERE client_id = ? OR freelancer_id = ?').run(userId, userId);
    db.prepare('DELETE FROM proposals WHERE candidate_id = ?').run(userId);
    db.prepare('DELETE FROM kanban_tasks WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM audit_logs WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM talents WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  }
}

async function main() {
  server = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', JWT_SECRET: 'live-data-test-secret' },
    stdio: 'ignore',
  });
  await waitForServer();

  const clientA = await register('client', 'ClientA');
  const clientB = await register('client', 'ClientB');
  const freelancer = await register('freelancer', 'Freelancer');
  assert(inferAvatarStyle('Rasesh Varshney') === 'masculine', 'Rasesh should receive the expected starting avatar');
  assert(inferAvatarStyle('Neha Sharma') === 'feminine', 'Known feminine first name should receive the matching avatar');
  assert(inferAvatarStyle('Unknown Name') === 'neutral', 'Unknown names must use a neutral avatar');
  assert(freelancer.user.avatar.startsWith('/api/avatar?'), 'Registration should create an illustrated avatar');
  const avatarResponse = await fetch(`http://127.0.0.1:${port}${freelancer.user.avatar}`);
  assert(avatarResponse.ok && (avatarResponse.headers.get('content-type') || '').includes('image/svg+xml'), 'Avatar image endpoint did not render');
  assert((await avatarResponse.text()).includes('prefers-reduced-motion'), 'Avatar animation must support reduced motion');

  assert(clientA.user.wallet_balance === 0 && freelancer.user.wallet_balance === 0, 'New users must start with real zero balances');

  const billing = await api('/billing/config');
  assert(billing.provider === 'demo' && billing.simulation === true, 'Billing must be labeled as a simulation');
  await api('/subscriptions', { token: clientA.token, method: 'POST', expected: 409, body: { planId: 'pro', billingCycle: 'monthly' } });
  await api('/billing/checkout', { token: clientA.token, method: 'POST', expected: 400, body: { planId: 'pro', billingCycle: 'monthly', paymentMethod: 'real_card' } });
  const demoCheckout = await api('/billing/checkout', { token: clientA.token, method: 'POST', expected: 201,
    body: { planId: 'pro', billingCycle: 'yearly', paymentMethod: 'demo_card', amountCents: 1 } });
  assert(demoCheckout.simulation && demoCheckout.receipt.amountCents === 18000, 'Demo total must come from the server plan price');
  const receiptsA = await api('/billing/receipts', { token: clientA.token });
  const receiptsB = await api('/billing/receipts', { token: clientB.token });
  assert(receiptsA.some((item) => item.id === demoCheckout.receipt.id), 'Owner cannot see demo receipt');
  assert(!receiptsB.some((item) => item.id === demoCheckout.receipt.id), 'Another user can see private demo receipt');
  const afterCheckout = await api('/auth/me', { token: clientA.token });
  assert(afterCheckout.user.subscription_plan === 'pro' && afterCheckout.user.subscription_status === 'demo_active', 'Demo plan was not persisted');
  assert(afterCheckout.user.wallet_balance === 0, 'Demo checkout changed wallet balance');
  await api('/subscriptions', { token: clientA.token, method: 'POST', body: { planId: 'free', billingCycle: 'monthly' } });
  const afterCancel = await api('/auth/me', { token: clientA.token });
  assert(afterCancel.user.subscription_plan === 'free', 'Could not switch back to Free');

  const profile = await api('/auth/profile', {
    token: freelancer.token,
    method: 'PATCH',
    body: { title: 'Live Data Engineer', hourlyRate: 72, skills: ['Node.js', 'SQLite'] },
  });
  assert(profile.user.title === 'Live Data Engineer', 'Profile update was not persisted');
  const illustratedProfile = await api('/auth/profile', {
    token: freelancer.token,
    method: 'PATCH',
    body: { name: 'Rasesh Test', avatarStyle: 'masculine' },
  });
  assert(illustratedProfile.user.avatar.includes('seed=Rasesh%20Test') && illustratedProfile.user.avatar.includes('style=masculine'), 'Chosen avatar style was not saved with the current name');
  assert(db.prepare('SELECT avatar FROM talents WHERE user_id = ?').get(freelancer.user.id).avatar === illustratedProfile.user.avatar, 'Directory avatar did not update');
  const customProfile = await api('/auth/profile', {
    token: freelancer.token,
    method: 'PATCH',
    body: { avatar: 'https://example.com/my-photo.png' },
  });
  assert(customProfile.user.avatar === 'https://example.com/my-photo.png', 'Custom photo was not preserved');
  await api('/auth/profile', { token: freelancer.token, method: 'PATCH', body: { avatarStyle: 'neutral' } });

  const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
  await api('/auth/avatar', { token: freelancer.token, method: 'PUT', expected: 400,
    body: { mimeType: 'image/svg+xml', contentBase64: tinyPng } });
  await api('/auth/avatar', { token: freelancer.token, method: 'PUT', expected: 400,
    body: { mimeType: 'image/png', contentBase64: Buffer.from('not a photo').toString('base64') } });
  const uploadedPhoto = await api('/auth/avatar', { token: freelancer.token, method: 'PUT',
    body: { mimeType: 'image/png', contentBase64: tinyPng } });
  assert(uploadedPhoto.user.avatar.startsWith(`/api/avatar/photo/${freelancer.user.id}`), 'Uploaded photo URL was not saved');
  assert(db.prepare('SELECT avatar FROM talents WHERE user_id = ?').get(freelancer.user.id).avatar === uploadedPhoto.user.avatar, 'Uploaded photo did not reach public talent profile');
  const photoResponse = await fetch(`http://127.0.0.1:${port}${uploadedPhoto.user.avatar}`);
  assert(photoResponse.ok && (photoResponse.headers.get('content-type') || '').includes('image/png'), 'Uploaded photo was not served');
  assert(Buffer.compare(Buffer.from(await photoResponse.arrayBuffer()), Buffer.from(tinyPng, 'base64')) === 0, 'Uploaded photo bytes changed');
  const backToIllustration = await api('/auth/profile', { token: freelancer.token, method: 'PATCH', body: { avatarStyle: 'masculine' } });
  assert(backToIllustration.user.avatar.includes('style=masculine'), 'Illustrated avatar was not restored');
  assert(!db.prepare('SELECT user_id FROM profile_photos WHERE user_id = ?').get(freelancer.user.id), 'Old photo should be removed when illustration is chosen');

  const projectResult = await api('/projects', {
    token: clientA.token,
    method: 'POST',
    expected: 201,
    body: { title: `Isolation Project ${stamp}`, description: 'Private live workspace test', budget: '$2,000' },
  });
  const project = projectResult.project;
  createdProjectIds.push(project.id);

  const mineA = await api('/projects?scope=mine', { token: clientA.token });
  const mineB = await api('/projects?scope=mine', { token: clientB.token });
  assert(mineA.some((item) => item.id === project.id), 'Owner cannot see their project');
  assert(!mineB.some((item) => item.id === project.id), 'Another client can see a private workspace project');
  await api(`/projects/${project.id}`, { token: clientB.token, method: 'PATCH', expected: 403, body: { status: 'Completed' } });

  const proposal = await api('/proposals', {
    token: freelancer.token,
    method: 'POST',
    expected: 201,
    body: { project_id: project.id, bid_amount: '$1,900', duration: '2 Weeks', pitch: 'Live proposal' },
  });
  assert(proposal.proposal.project_id === project.id, 'Proposal was not linked to the project');
  const proposalsA = await api('/proposals', { token: clientA.token });
  const proposalsB = await api('/proposals', { token: clientB.token });
  assert(proposalsA.some((item) => item.id === proposal.proposal.id), 'Project owner cannot see proposal');
  assert(!proposalsB.some((item) => item.id === proposal.proposal.id), 'Unrelated client can see proposal');

  await api(`/proposals/${proposal.proposal.id}/status`, {
    token: clientA.token,
    method: 'PATCH',
    body: { status: 'Accepted' },
  });
  const contracts = await api('/contracts', { token: freelancer.token });
  assert(contracts.some((item) => item.title === project.title), 'Accepted proposal did not create a live contract');

  const offer = await api('/contracts', { token: clientA.token, method: 'POST', expected: 201,
    body: { title: `Offer ${stamp}`, freelancerId: freelancer.user.id, budget: 125 } });
  assert(offer.message.includes('Funding has not been collected'), 'New contract incorrectly claims payment was collected');
  const unfunded = db.prepare("SELECT id FROM payments WHERE client_id = ? AND milestone LIKE 'Funding required:%' ORDER BY created_at DESC LIMIT 1").get(clientA.user.id);
  await api(`/payments/${unfunded.id}/release`, { token: clientA.token, method: 'PATCH', expected: 409 });

  const message = await api('/messages', {
    token: clientA.token,
    method: 'POST',
    expected: 201,
    body: { recipientId: freelancer.user.id, project: project.title, text: 'Private workspace message' },
  });
  const freelancerThreads = await api('/messages', { token: freelancer.token });
  const unrelatedThreads = await api('/messages', { token: clientB.token });
  assert(freelancerThreads.some((thread) => thread.id === message.threadId), 'Recipient cannot see live message');
  assert(!unrelatedThreads.some((thread) => thread.id === message.threadId), 'Unrelated user can see private message');

  const upload = await api('/files', {
    token: clientA.token,
    method: 'POST',
    expected: 201,
    body: {
      name: 'live-proof.txt',
      size: '0.02 KB',
      mimeType: 'text/plain',
      contentBase64: Buffer.from('live workspace proof').toString('base64'),
      projectId: project.id,
      project: project.title,
    },
  });
  const filesA = await api('/files', { token: clientA.token });
  const filesB = await api('/files', { token: clientB.token });
  assert(filesA.some((file) => file.id === upload.file.id), 'Uploaded file is missing from owner workspace');
  assert(!filesB.some((file) => file.id === upload.file.id), 'Unrelated user can see uploaded file');

  console.log('Live-data isolation and demo billing checks passed');
}

main()
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(() => {
    if (server) server.kill();
    cleanup();
  });

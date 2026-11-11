// Interactive Workverse Backend Control Center & OpenAPI Docs UI

function renderDashboardHtml(stats) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Workverse API Control Center — Port ${stats.port}</title>
  <style>
    :root {
      --bg: #0f0e11;
      --surface: #18171c;
      --surface-2: #211f26;
      --border: #2d2a34;
      --text: #f7f4f1;
      --muted: #9f99a6;
      --orange: #f36b21;
      --orange-soft: rgba(243, 107, 33, 0.14);
      --emerald: #10b981;
      --emerald-soft: rgba(16, 185, 129, 0.14);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: radial-gradient(circle at top right, rgba(243, 107, 33, 0.12), transparent 36%), var(--bg);
      color: var(--text);
      line-height: 1.5;
      min-height: 100vh;
      padding: 28px 20px 60px;
    }
    .container { max-width: 1240px; margin: 0 auto; }
    .topbar {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
      gap: 16px; padding-bottom: 24px; border-bottom: 1px solid var(--border); margin-bottom: 24px;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo {
      width: 44px; height: 44px; border-radius: 14px;
      background: linear-gradient(135deg, #f36b21, #d9520b);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 25px rgba(243, 107, 33, 0.35);
      font-weight: 800; font-size: 20px; color: #fff;
    }
    .brand h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .brand p { font-size: 13px; color: var(--muted); }
    .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 7px 14px; border-radius: 999px; font-size: 12px; font-weight: 600;
      background: var(--emerald-soft); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--emerald);
      box-shadow: 0 0 10px var(--emerald);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(1.25); }
    }
    .btn {
      display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
      padding: 9px 16px; border-radius: 999px; font-size: 12.5px; font-weight: 600;
      border: 1px solid var(--border); background: var(--surface); color: var(--text);
      text-decoration: none; transition: all 0.15s ease;
    }
    .btn:hover { border-color: var(--orange); background: var(--surface-2); }
    .btn-primary {
      background: var(--orange); border-color: var(--orange); color: #fff;
      box-shadow: 0 6px 18px rgba(243, 107, 33, 0.25);
    }
    .btn-primary:hover { background: #e05d15; border-color: #e05d15; }

    .metrics {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
      gap: 14px; margin-bottom: 26px;
    }
    .metric-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 18px; padding: 16px 18px;
    }
    .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 600; }
    .metric-value { font-size: 26px; font-weight: 800; margin-top: 6px; letter-spacing: -0.02em; }
    .metric-sub { font-size: 11.5px; color: var(--muted); margin-top: 3px; }
    .orange { color: var(--orange); }

    .grid {
      display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 20px; align-items: start;
    }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }

    .panel {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 22px; overflow: hidden;
    }
    .panel-head {
      padding: 16px 20px; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      background: rgba(255,255,255,0.015);
    }
    .panel-title { font-size: 15px; font-weight: 700; }
    .panel-sub { font-size: 12px; color: var(--muted); }

    .endpoint-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; max-height: 560px; overflow-y: auto; }
    .endpoint-item {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 11px 14px; border-radius: 14px; border: 1px solid var(--border);
      background: var(--surface-2); transition: border-color 0.15s ease;
    }
    .endpoint-item:hover { border-color: rgba(243, 107, 33, 0.55); }
    .ep-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .method {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 7px; flex-shrink: 0;
    }
    .GET { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .POST { background: rgba(59, 130, 246, 0.18); color: #60a5fa; }
    .PATCH { background: rgba(245, 158, 11, 0.18); color: #fbbf24; }
    .ep-path {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12.5px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ep-desc { font-size: 11.5px; color: var(--muted); }
    .try-btn {
      padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(243, 107, 33, 0.45);
      background: var(--orange-soft); color: #ff8e52; font-size: 11.5px; font-weight: 700;
      cursor: pointer; flex-shrink: 0; transition: all 0.15s;
    }
    .try-btn:hover { background: var(--orange); color: #fff; }

    .console-meta {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 18px; border-bottom: 1px solid var(--border);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: var(--muted);
    }
    .status-badge {
      padding: 3px 9px; border-radius: 999px; font-weight: 700; font-size: 11px;
      background: var(--emerald-soft); color: #34d399;
    }
    .status-err { background: rgba(239,68,68,0.16); color: #f87171; }
    pre#json-output {
      padding: 18px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px; line-height: 1.55; color: #e6e0eb;
      max-height: 440px; overflow: auto; white-space: pre-wrap; word-break: break-word;
      background: #121116;
    }
    .tabs {
      display: flex; gap: 6px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 1px solid var(--border);
    }
    .tab-btn {
      padding: 6px 12px; border-radius: 999px; border: 1px solid var(--border);
      background: transparent; color: var(--muted); font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .tab-btn.active { background: var(--orange); border-color: var(--orange); color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="topbar">
      <div class="brand">
        <div class="logo">W</div>
        <div>
          <h1>Workverse Backend Control Center</h1>
          <p>Express REST API + SQLite WAL Database • Node.js ${process.version}</p>
        </div>
      </div>
      <div class="actions">
        <span class="pill"><span class="dot"></span> API ONLINE • PORT ${stats.port}</span>
        <a class="btn btn-primary" href="/docs">Open API Docs (/docs)</a>
        <a class="btn" href="/openapi.json" target="_blank" rel="noreferrer">OpenAPI JSON</a>
        <button class="btn" onclick="refreshStats()">↻ Refresh DB</button>
        <a class="btn" href="http://127.0.0.1:5173" target="_blank" rel="noreferrer">Open Frontend ↗</a>
      </div>
    </div>

    <div class="metrics" id="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Registered Users</div>
        <div class="metric-value orange" id="m-users">${stats.counts.users}</div>
        <div class="metric-sub">Bcrypt + JWT authenticated</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Verified Talents</div>
        <div class="metric-value" id="m-talents">${stats.counts.talents}</div>
        <div class="metric-sub">Full portfolio & skills</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Active Projects</div>
        <div class="metric-value" id="m-projects">${stats.counts.projects}</div>
        <div class="metric-sub">Live client postings</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Kanban & Contracts</div>
        <div class="metric-value" id="m-work">${stats.counts.kanban_tasks} / ${stats.counts.contracts}</div>
        <div class="metric-sub">Tasks / Active contracts</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Proposals & Messages</div>
        <div class="metric-value" id="m-comm">${stats.counts.proposals} / ${stats.counts.messages}</div>
        <div class="metric-sub">Bids / Chat messages</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Escrow Ledger</div>
        <div class="metric-value" id="m-pay">${stats.counts.payments}</div>
        <div class="metric-sub">Uptime: <span id="m-uptime">${stats.uptimeSeconds}s</span></div>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">Quick REST API Endpoints</div>
            <div class="panel-sub">Visit <a href="/docs" style="color:#ff8e52;text-decoration:none;font-weight:700;">/docs</a> for full interactive Swagger-style POST/PATCH execution</div>
          </div>
          <span class="panel-sub">/api/*</span>
        </div>
        <div class="endpoint-list">
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/health</div><div class="ep-desc">Database ping, uptime & telemetry</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/health')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/stats</div><div class="ep-desc">Live table counts across all 18 tables</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/stats')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method POST">POST</span>
              <div><div class="ep-path">/api/auth/login & /register</div><div class="ep-desc">Bcrypt + JWT authentication (try in /docs)</div></div>
            </div>
            <a class="try-btn" href="/docs" style="text-decoration:none;">Open /docs</a>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/talents</div><div class="ep-desc">Verified freelancers, portfolios & reviews</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/talents')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/projects</div><div class="ep-desc">Active, review & completed projects</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/projects')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/contracts</div><div class="ep-desc">Client-freelancer milestone contracts</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/contracts')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/kanban</div><div class="ep-desc">Sprint delivery board cards</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/kanban')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/proposals</div><div class="ep-desc">Submitted bids & review statuses</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/proposals')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/payments</div><div class="ep-desc">Escrow ledger & milestone disbursements</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/payments')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/messages</div><div class="ep-desc">Dynamic collaboration threads & chat</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/messages')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/wallet</div><div class="ep-desc">Wallet balance, escrow & payouts</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/wallet')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/pricing</div><div class="ep-desc">Subscription tiers catalog</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/pricing')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/resources</div><div class="ep-desc">Knowledge hub articles & guides</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/resources')">Inspect</button>
          </div>
          <div class="endpoint-item">
            <div class="ep-left">
              <span class="method GET">GET</span>
              <div><div class="ep-path">/api/notifications</div><div class="ep-desc">Real-time role-scoped activity notifications</div></div>
            </div>
            <button class="try-btn" onclick="inspectEndpoint('/api/notifications?role=client')">Inspect</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">Live Database Response Inspector</div>
            <div class="panel-sub">Formatted output directly from SQLite WAL database</div>
          </div>
        </div>
        <div class="tabs">
          <button class="tab-btn active" onclick="switchTab(this, '/api/health')">Health</button>
          <button class="tab-btn" onclick="switchTab(this, '/api/stats')">DB Stats</button>
          <button class="tab-btn" onclick="switchTab(this, '/api/talents')">Talents</button>
          <button class="tab-btn" onclick="switchTab(this, '/api/projects')">Projects</button>
          <button class="tab-btn" onclick="switchTab(this, '/api/payments')">Payments</button>
          <button class="tab-btn" onclick="switchTab(this, '/api/kanban')">Kanban</button>
        </div>
        <div class="console-meta">
          <span id="req-url">GET /api/health</span>
          <div style="display:flex;gap:10px;align-items:center;">
            <span id="req-time">-- ms</span>
            <span id="req-status" class="status-badge">200 OK</span>
          </div>
        </div>
        <pre id="json-output">Loading live backend snapshot...</pre>
      </div>
    </div>
  </div>

  <script>
    async function inspectEndpoint(url) {
      const out = document.getElementById('json-output');
      const urlEl = document.getElementById('req-url');
      const statusEl = document.getElementById('req-status');
      const timeEl = document.getElementById('req-time');

      urlEl.textContent = 'GET ' + url;
      out.textContent = 'Fetching ' + url + '...';
      const t0 = performance.now();
      try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const ms = Math.round(performance.now() - t0);
        const data = await res.json();
        timeEl.textContent = ms + ' ms';
        statusEl.textContent = res.status + ' ' + res.statusText;
        statusEl.className = res.ok ? 'status-badge' : 'status-badge status-err';
        out.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        timeEl.textContent = '-- ms';
        statusEl.textContent = 'ERROR';
        statusEl.className = 'status-badge status-err';
        out.textContent = err.message;
      }
    }

    function switchTab(btn, url) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      inspectEndpoint(url);
    }

    async function refreshStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data && data.counts) {
          document.getElementById('m-users').textContent = data.counts.users;
          document.getElementById('m-talents').textContent = data.counts.talents;
          document.getElementById('m-projects').textContent = data.counts.projects;
          document.getElementById('m-work').textContent = data.counts.kanban_tasks + ' / ' + data.counts.contracts;
          document.getElementById('m-comm').textContent = data.counts.proposals + ' / ' + data.counts.messages;
          document.getElementById('m-pay').textContent = data.counts.payments;
          document.getElementById('m-uptime').textContent = data.uptimeSeconds + 's';
        }
      } catch (e) {
        console.error(e);
      }
    }

    inspectEndpoint('/api/health');
    setInterval(refreshStats, 5000);
  </script>
</body>
</html>`;
}

function renderDocsHtml(openApiSpec) {
  const safeSpecJson = JSON.stringify(openApiSpec).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Workverse API Docs (OpenAPI 3.0)</title>
  <style>
    :root {
      --bg: #0f0e11;
      --surface: #18171c;
      --surface-2: #211f26;
      --border: #2d2a34;
      --text: #f7f4f1;
      --muted: #9f99a6;
      --orange: #f36b21;
      --orange-soft: rgba(243, 107, 33, 0.14);
      --emerald: #10b981;
      --blue: #3b82f6;
      --amber: #f59e0b;
      --purple: #a855f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: radial-gradient(circle at top left, rgba(243, 107, 33, 0.10), transparent 35%), var(--bg);
      color: var(--text); line-height: 1.5; padding: 28px 20px 80px;
    }
    .container { max-width: 1140px; margin: 0 auto; }
    .header {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
      gap: 16px; padding-bottom: 22px; border-bottom: 1px solid var(--border); margin-bottom: 22px;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo {
      width: 42px; height: 42px; border-radius: 13px; background: linear-gradient(135deg, #f36b21, #d9520b);
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: #fff;
    }
    .title-wrap h1 { font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
    .oas-badge { font-size: 11px; background: var(--orange-soft); color: #ff8e52; border: 1px solid rgba(243,107,33,0.4); padding: 2px 9px; border-radius: 999px; }
    .title-wrap p { font-size: 13px; color: var(--muted); margin-top: 2px; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
      padding: 8px 15px; border-radius: 999px; font-size: 12px; font-weight: 600;
      border: 1px solid var(--border); background: var(--surface); color: var(--text); text-decoration: none;
    }
    .btn:hover { border-color: var(--orange); background: var(--surface-2); }
    .btn-primary { background: var(--orange); border-color: var(--orange); color: #fff; }
    .btn-primary:hover { background: #e05d15; border-color: #e05d15; }

    .auth-bar {
      background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
      padding: 16px 20px; margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
    }
    .auth-left { display: flex; flex-direction: column; gap: 4px; }
    .auth-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .auth-status { font-size: 12px; color: var(--muted); }
    .auth-status.ok { color: #34d399; font-weight: 600; }
    .auth-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .token-input {
      background: #121116; border: 1px solid var(--border); color: var(--text);
      padding: 7px 12px; border-radius: 999px; font-size: 12px; width: 220px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .tag-section { margin-bottom: 26px; }
    .tag-header {
      display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
      padding: 8px 4px; margin-bottom: 10px; border-bottom: 1px solid var(--border);
    }
    .tag-header h2 { font-size: 17px; font-weight: 700; }
    .tag-header span { font-size: 12px; color: var(--muted); }

    .op-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
      margin-bottom: 10px; overflow: hidden;
    }
    .op-summary {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 16px; cursor: pointer; user-select: none;
    }
    .op-summary:hover { background: rgba(255,255,255,0.02); }
    .op-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex-wrap: wrap; }
    .method {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; min-width: 64px; text-align: center;
    }
    .GET { background: rgba(16, 185, 129, 0.16); color: #34d399; }
    .POST { background: rgba(59, 130, 246, 0.18); color: #60a5fa; }
    .PATCH { background: rgba(245, 158, 11, 0.18); color: #fbbf24; }
    .PUT { background: rgba(168, 85, 247, 0.18); color: #c084fc; }
    .DELETE { background: rgba(239, 68, 68, 0.18); color: #f87171; }
    .op-path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13.5px; font-weight: 700; }
    .op-desc { font-size: 12.5px; color: var(--muted); }
    .op-body { display: none; padding: 16px; border-top: 1px solid var(--border); background: #131217; }
    .op-card.open .op-body { display: block; }

    .field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 10px 0 6px; }
    .param-row { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
    .param-input {
      background: var(--surface); border: 1px solid var(--border); color: var(--text);
      padding: 7px 12px; border-radius: 10px; font-size: 12.5px; flex: 1;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    textarea.body-editor {
      width: 100%; min-height: 110px; background: var(--surface); border: 1px solid var(--border);
      color: #f3ece7; padding: 12px; border-radius: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; resize: vertical;
    }
    .exec-row { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; gap: 10px; }
    .res-box { margin-top: 14px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: none; }
    .res-meta {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 12px; background: var(--surface-2); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px;
    }
    .res-pre {
      padding: 12px; background: #0c0b0e; color: #e8e2ed; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px; max-height: 320px; overflow: auto; white-space: pre-wrap; word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="logo">W</div>
        <div class="title-wrap">
          <h1>Workverse API Docs <span class="oas-badge">OAS 3.0.3</span></h1>
          <p>Interactive REST API Reference & Live Endpoint Explorer (Express + SQLite)</p>
        </div>
      </div>
      <div class="actions">
        <a class="btn" href="/">← Control Center (/)</a>
        <a class="btn" href="/openapi.json" target="_blank" rel="noreferrer">openapi.json ↗</a>
        <a class="btn btn-primary" href="http://127.0.0.1:5173" target="_blank" rel="noreferrer">Open Live Frontend ↗</a>
      </div>
    </div>

    <div class="auth-bar">
      <div class="auth-left">
        <div class="auth-title">JWT Authorization (Bearer Token)</div>
        <div class="auth-status" id="auth-status">Not authorized — click a quick login button for instant JWT token</div>
      </div>
      <div class="auth-controls">
        <button class="btn" onclick="quickAuthorize('arjun@workverse.io')">Authorize Arjun (Freelancer)</button>
        <button class="btn" onclick="quickAuthorize('sarah@cloudscale.ai')">Authorize Sarah (Client)</button>
        <input class="token-input" id="jwt-input" placeholder="Paste Bearer token..." oninput="syncTokenInput()" />
      </div>
    </div>

    <div id="docs-root"></div>
  </div>

  <script>
    const SPEC = ${safeSpecJson};
    let authToken = '';

    function syncTokenInput() {
      authToken = document.getElementById('jwt-input').value.trim();
      const status = document.getElementById('auth-status');
      if (authToken) {
        status.textContent = 'Authorized with active Bearer JWT token';
        status.className = 'auth-status ok';
      } else {
        status.textContent = 'Not authorized — click a quick login button for instant JWT token';
        status.className = 'auth-status';
      }
    }

    async function quickAuthorize(email) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'password123' })
        });
        const data = await res.json();
        if (data.token) {
          authToken = data.token;
          document.getElementById('jwt-input').value = data.token;
          const status = document.getElementById('auth-status');
          status.textContent = 'Authorized as ' + data.user.name + ' (' + data.user.role + ')';
          status.className = 'auth-status ok';
        }
      } catch (e) {
        alert('Auth failed: ' + e.message);
      }
    }

    function renderDocs() {
      const root = document.getElementById('docs-root');
      const grouped = {};
      for (const tag of SPEC.tags) grouped[tag.name] = [];

      Object.entries(SPEC.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, op]) => {
          const tagName = (op.tags && op.tags[0]) || 'System';
          if (!grouped[tagName]) grouped[tagName] = [];
          grouped[tagName].push({ path, method: method.toUpperCase(), op });
        });
      });

      let html = '';
      let opCounter = 0;

      for (const tag of SPEC.tags) {
        const items = grouped[tag.name] || [];
        if (!items.length) continue;

        html += '<div class="tag-section">';
        html += '<div class="tag-header"><h2>' + tag.name + '</h2><span>' + tag.description + '</span></div>';

        for (const item of items) {
          const idx = ++opCounter;
          const hasAuth = item.op.security && item.op.security.length > 0;
          const params = item.op.parameters || [];
          const exBody = item.op.requestBody?.content?.['application/json']?.example;

          html += '<div class="op-card" id="card-' + idx + '">';
          html += '  <div class="op-summary" onclick="toggleCard(' + idx + ')">';
          html += '    <div class="op-left">';
          html += '      <span class="method ' + item.method + '">' + item.method + '</span>';
          html += '      <span class="op-path">' + item.path + '</span>';
          html += '      <span class="op-desc">' + (item.op.summary || '') + '</span>';
          html += '    </div>';
          html += '    <span style="font-size:12px;color:#9f99a6;">' + (hasAuth ? '🔒 Bearer • ' : '') + '▼</span>';
          html += '  </div>';
          html += '  <div class="op-body">';

          if (params.length > 0) {
            html += '<div class="field-label">Parameters</div>';
            params.forEach((p, pIdx) => {
              const defVal = p.schema && p.schema.default !== undefined ? p.schema.default : '';
              html += '<div class="param-row">';
              html += '  <span style="font-size:12px;min-width:130px;font-family:monospace;">' + p.name + ' <em style="color:#9f99a6;">(' + p.in + ')</em></span>';
              html += '  <input class="param-input" data-op="' + idx + '" data-in="' + p.in + '" data-name="' + p.name + '" value="' + defVal + '" />';
              html += '</div>';
            });
          }

          if (exBody) {
            html += '<div class="field-label">Request Body (application/json)</div>';
            html += '<textarea class="body-editor" id="body-' + idx + '">' + JSON.stringify(exBody, null, 2) + '</textarea>';
          }

          html += '<div class="exec-row">';
          html += '  <button class="btn btn-primary" onclick="executeOp(' + idx + ', \\'' + item.method + '\\', \\'' + item.path + '\\')">▶ Execute Request</button>';
          html += '  <span style="font-size:11.5px;color:#9f99a6;">Live call against SQLite backend</span>';
          html += '</div>';

          html += '<div class="res-box" id="res-' + idx + '">';
          html += '  <div class="res-meta"><span id="res-url-' + idx + '"></span><span id="res-status-' + idx + '"></span></div>';
          html += '  <pre class="res-pre" id="res-pre-' + idx + '"></pre>';
          html += '</div>';

          html += '  </div>';
          html += '</div>';
        }
        html += '</div>';
      }

      root.innerHTML = html;
    }

    function toggleCard(idx) {
      document.getElementById('card-' + idx).classList.toggle('open');
    }

    async function executeOp(idx, method, rawPath) {
      let url = rawPath;
      const queryParts = [];
      document.querySelectorAll('.param-input[data-op="' + idx + '"]').forEach((inp) => {
        const val = inp.value;
        if (inp.dataset.in === 'path') {
          url = url.replace('{' + inp.dataset.name + '}', encodeURIComponent(val));
        } else if (inp.dataset.in === 'query' && val !== '') {
          queryParts.push(encodeURIComponent(inp.dataset.name) + '=' + encodeURIComponent(val));
        }
      });
      if (queryParts.length) url += '?' + queryParts.join('&');

      const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

      const options = { method, headers };
      const bodyEl = document.getElementById('body-' + idx);
      if (bodyEl && method !== 'GET' && method !== 'DELETE') {
        options.body = bodyEl.value;
      }

      const resBox = document.getElementById('res-' + idx);
      const resUrl = document.getElementById('res-url-' + idx);
      const resStatus = document.getElementById('res-status-' + idx);
      const resPre = document.getElementById('res-pre-' + idx);

      resBox.style.display = 'block';
      resUrl.textContent = method + ' ' + url;
      resPre.textContent = 'Running...';

      const t0 = performance.now();
      try {
        const res = await fetch(url, options);
        const ms = Math.round(performance.now() - t0);
        const text = await res.text();
        let pretty = text;
        try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch {}
        resStatus.textContent = res.status + ' ' + res.statusText + ' (' + ms + ' ms)';
        resStatus.style.color = res.ok ? '#34d399' : '#f87171';
        resPre.textContent = pretty;
      } catch (err) {
        resStatus.textContent = 'NETWORK ERROR';
        resStatus.style.color = '#f87171';
        resPre.textContent = err.message;
      }
    }

    renderDocs();
  </script>
</body>
</html>`;
}

module.exports = {
  renderDashboardHtml,
  renderDocsHtml,
};

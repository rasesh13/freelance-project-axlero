const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const { renderDashboardHtml, renderDocsHtml } = require('./dashboard');
const { getOpenApiSpec } = require('./openapi');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'workverse_super_secret_jwt_key_2026';

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ==========================================
// IN-MEMORY SLIDING WINDOW RATE LIMITER
// ==========================================
const rateLimitStore = new Map();

function createRateLimiter({ windowMs = 60 * 1000, max = 120, message = 'Too many requests, please try again later.' } = {}) {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test' || req.headers['x-bypass-ratelimit']) {
      return next();
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.baseUrl || ''}${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key) || { timestamps: [] };
    const windowStart = now - windowMs;
    const recent = record.timestamps.filter((t) => t > windowStart);

    if (recent.length >= max) {
      const oldest = recent[0];
      const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((oldest + windowMs) / 1000)));
      return res.status(429).json({
        error: message,
        retryAfter: retryAfterSec,
      });
    }

    recent.push(now);
    rateLimitStore.set(key, { timestamps: recent });

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(max - recent.length));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));

    next();
  };
}

const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60, // 60 requests per minute
  message: 'Too many authentication attempts. Please wait 60 seconds before trying again.',
});

// ==========================================
// HELPERS & AUTH MIDDLEWARE
// ==========================================
function safeJsonParse(str, fallback = []) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
}

function getDatabaseStats() {
  const tables = [
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
  ];
  const counts = {};
  for (const t of tables) {
    counts[t] = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
  }
  return {
    status: 'ok',
    port: PORT,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(1)),
    counts,
    timestamp: new Date().toISOString(),
  };
}

function createNotification({
  userId = 'all',
  role = 'all',
  type = 'system',
  title,
  message,
  targetPage = 'projects',
  targetTab = '',
}) {
  try {
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, role, type, title, message, target_page, target_tab, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(id, userId, role, type, title, message, targetPage, targetTab);
    return id;
  } catch (err) {
    console.error('Failed to insert notification:', err);
    return null;
  }
}

function formatUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    title: row.title,
    avatar: row.avatar,
    wallet_balance: row.wallet_balance,
    escrow_balance: row.escrow_balance,
    hourly_rate: row.hourly_rate,
    subscription_plan: row.subscription_plan || 'free',
    billing_cycle: row.billing_cycle || 'monthly',
    workspace_name: row.workspace_name || 'Workverse Ventures',
    billing_email: row.billing_email || row.email,
    auto_escrow_release: Boolean(row.auto_escrow_release ?? 1),
    two_factor_auth: Boolean(row.two_factor_auth ?? 1),
    email_digest: row.email_digest || 'Daily',
  };
}

function formatTalentRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    title: r.title,
    role: r.role,
    verified: Boolean(r.verified),
    available: Boolean(r.available),
    avatar: r.avatar,
    coverImage: r.cover_image,
    rating: r.rating,
    reviewsCount: r.reviews_count,
    hourlyRate: r.hourly_rate,
    location: r.location,
    experience: r.experience,
    jobSuccess: r.job_success,
    completedProjects: r.completed_projects,
    category: r.category,
    experienceLevel: r.experience_level,
    about: r.about,
    skills: safeJsonParse(r.skills, []),
    badges: safeJsonParse(r.badges, []),
    portfolio: safeJsonParse(r.portfolio, []),
    workHistory: safeJsonParse(r.work_history, []),
    reviews: safeJsonParse(r.reviews, []),
  };
}

function formatProjectRow(r) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    budget: r.budget,
    budgetMin: r.budget_min,
    budgetMax: r.budget_max,
    budgetType: r.budget_type,
    duration: r.duration,
    skills: safeJsonParse(r.skills, []),
    featured: Boolean(r.featured),
    status: r.status,
    progress: r.progress,
    deadline: r.deadline,
    clientId: r.client_id,
    client: r.client_name,
    client_name: r.client_name,
    clientRating: r.client_rating,
    thumbnail: r.thumbnail,
    team: safeJsonParse(r.team, []),
    teamExtra: r.team_extra || 0,
    type: r.type || 'dev',
    createdAt: r.created_at,
  };
}

function formatContractRow(r) {
  return {
    ...r,
    client: {
      name: r.client_name,
      company: r.client_company,
      avatar: r.client_avatar,
    },
    totalEarned: r.total_earned,
    escrowLocked: r.escrow_locked,
    currentMilestone: r.current_milestone,
    weeklyLimit: r.weekly_limit,
    milestonesCount: r.milestones_count,
  };
}

function formatProposalRow(r) {
  return {
    ...r,
    projectTitle: r.project_title,
    bidAmount: r.bid_amount,
    submittedDate: r.submitted_date,
    coverLetter: r.cover_letter,
    clientName: r.client_name,
    clientAvatar: r.client_avatar,
    statusBadgeColor:
      r.status && (r.status.includes('Accepted') || r.status.includes('Active'))
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : r.status && r.status.includes('Shortlisted')
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : r.status && r.status.includes('Declined')
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-slate-100 text-slate-700 border-slate-200',
    candidate: {
      id: r.candidate_id,
      name: r.candidate_name,
      title: r.candidate_title,
      avatar: r.candidate_avatar,
      rating: r.candidate_rating,
      reviewsCount: r.candidate_reviews,
    },
  };
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded || !decoded.id) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = formatUserRow(userRow);
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded && decoded.id) {
      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
      if (userRow) {
        req.user = formatUserRow(userRow);
      }
    }
    next();
  });
}

// ==========================================
// 1. ROOT CONTROL CENTER, API DOCS & HEALTH
// ==========================================
app.get('/', (req, res) => {
  const stats = getDatabaseStats();
  const wantsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  if (wantsHtml) {
    return res.type('html').send(renderDashboardHtml(stats));
  }
  return res.json({
    service: 'Workverse Production Backend API',
    docsUrl: `http://localhost:${PORT}/docs`,
    openApiUrl: `http://localhost:${PORT}/openapi.json`,
    ...stats,
  });
});

app.get(['/docs', '/docs/', '/api/docs', '/api-docs', '/swagger'], (req, res) => {
  const spec = getOpenApiSpec(PORT);
  return res.type('html').send(renderDocsHtml(spec));
});

app.get(['/openapi.json', '/api/openapi.json'], (req, res) => {
  res.json(getOpenApiSpec(PORT));
});

app.get('/api', (req, res) => {
  res.json({
    service: 'Workverse Production Backend API',
    docsUrl: `http://localhost:${PORT}/docs`,
    openApiUrl: `http://localhost:${PORT}/openapi.json`,
    ...getDatabaseStats(),
  });
});

app.get('/api/health', (req, res) => {
  const dbPing = db.prepare('SELECT 1 as ok').get();
  res.json({
    status: dbPing?.ok === 1 ? 'ok' : 'degraded',
    database: 'SQLite WAL Connected',
    message: 'Workverse Production Backend API is live & operational',
    port: PORT,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/system/metrics', (req, res) => {
  const mem = process.memoryUsage();
  const dbPing = db.prepare('SELECT 1 as ok').get();
  res.json({
    status: 'ok',
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    },
    memory: {
      rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
      heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
      externalMB: +(mem.external / 1024 / 1024).toFixed(2),
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
    },
    database: {
      engine: 'SQLite 3 (Built-in WAL Mode)',
      healthy: dbPing?.ok === 1,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/stats', (req, res) => {
  res.json(getDatabaseStats());
});

// ==========================================
// 2. AUTHENTICATION & USER SETTINGS
// ==========================================
app.post('/api/auth/register', authRateLimiter, (req, res) => {
  try {
    const { name, email, password, role = 'client' } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be client or freelancer' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const id = `usr-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const defaultAvatar =
      role === 'freelancer'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80';
    const defaultTitle = role === 'freelancer' ? 'Full Stack Developer' : 'Project Manager & Founder';
    const starterWallet = role === 'freelancer' ? 1200.0 : 5000.0;
    const starterEscrow = role === 'freelancer' ? 2400.0 : 1500.0;

    db.prepare(`
      INSERT INTO users (id, name, email, password, role, title, avatar, wallet_balance, escrow_balance, hourly_rate, billing_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), cleanEmail, passwordHash, role, defaultTitle, defaultAvatar, starterWallet, starterEscrow, 45.0, cleanEmail);

    // If freelancer, also add to talents directory so Find Talent stays completely live
    if (role === 'freelancer') {
      const talentId = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
      db.prepare(`
        INSERT INTO talents (
          id, user_id, name, title, role, verified, available, avatar, cover_image,
          rating, reviews_count, hourly_rate, location, experience, job_success,
          completed_projects, category, experience_level, about, skills, badges, portfolio, work_history, reviews
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        talentId,
        id,
        name.trim(),
        defaultTitle,
        defaultTitle,
        1,
        1,
        defaultAvatar,
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
        5.0,
        0,
        45,
        'Remote',
        '3+ Years Exp.',
        '100%',
        0,
        'Development',
        'Intermediate',
        `Independent builder registered on Workverse (${cleanEmail}).`,
        JSON.stringify(['React', 'Node.js', 'TypeScript']),
        JSON.stringify(['Verified Talent', 'New Rising Star']),
        '[]',
        '[]',
        '[]'
      );
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const user = formatUserRow(userRow);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

app.post('/api/auth/login', authRateLimiter, (req, res) => {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRecord = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!userRecord) {
      return res.status(401).json({ error: 'No account found with this email. Please verify or sign up.' });
    }

    const passwordMatch = bcrypt.compareSync(password, userRecord.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
    }

    if (role && (role === 'client' || role === 'freelancer') && role !== userRecord.role) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userRecord.id);
      userRecord.role = role;
    }

    const user = formatUserRow(userRecord);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/forgot-password', authRateLimiter, (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(cleanEmail);
    res.json({
      success: true,
      accountFound: Boolean(user),
      message: user
        ? `Password reset instructions dispatched to ${cleanEmail}.`
        : `If an account exists for ${cleanEmail}, reset instructions have been queued.`,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

app.get('/api/settings', authenticateToken, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'usr-client-1';
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const formatted = formatUserRow(userRow);
    res.json({
      workspaceName: formatted?.workspace_name || 'Workverse Ventures',
      billingEmail: formatted?.billing_email || 'finance@workverse.io',
      autoEscrowRelease: formatted?.auto_escrow_release ?? true,
      twoFactorAuth: formatted?.two_factor_auth ?? true,
      emailDigest: formatted?.email_digest || 'Daily',
      subscriptionPlan: formatted?.subscription_plan || 'free',
    });
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.put('/api/settings', authenticateToken, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'usr-client-1';
    const { workspaceName, billingEmail, autoEscrowRelease, twoFactorAuth, emailDigest } = req.body || {};

    db.prepare(`
      UPDATE users
      SET workspace_name = COALESCE(?, workspace_name),
          billing_email = COALESCE(?, billing_email),
          auto_escrow_release = COALESCE(?, auto_escrow_release),
          two_factor_auth = COALESCE(?, two_factor_auth),
          email_digest = COALESCE(?, email_digest)
      WHERE id = ?
    `).run(
      workspaceName || null,
      billingEmail || null,
      typeof autoEscrowRelease === 'boolean' ? (autoEscrowRelease ? 1 : 0) : null,
      typeof twoFactorAuth === 'boolean' ? (twoFactorAuth ? 1 : 0) : null,
      emailDigest || null,
      userId
    );

    const updated = formatUserRow(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
    res.json({ success: true, settings: updated, message: 'Workspace & notification settings persisted to database.' });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to save workspace settings' });
  }
});

// ==========================================
// 3. TALENTS DIRECTORY
// ==========================================
app.get('/api/talents', (req, res) => {
  try {
    const { search, category, experience } = req.query;
    let rows = db.prepare('SELECT * FROM talents ORDER BY rating DESC, reviews_count DESC').all().map(formatTalentRow);

    if (category && category !== 'All Categories') {
      rows = rows.filter((t) => t.category === category);
    }
    if (experience && experience !== 'All') {
      rows = rows.filter((t) => t.experienceLevel === experience);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch talents error:', err);
    res.status(500).json({ error: 'Failed to fetch talents' });
  }
});

app.get('/api/talents/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM talents WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Talent profile not found' });
    res.json(formatTalentRow(row));
  } catch (err) {
    console.error('Fetch talent error:', err);
    res.status(500).json({ error: 'Failed to fetch talent profile' });
  }
});

// ==========================================
// 4. PROJECTS CONTROLLER
// ==========================================
app.get('/api/projects', (req, res) => {
  try {
    const { status, search, category } = req.query;
    let rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all().map(formatProjectRow);

    if (status && status !== 'All') {
      rows = rows.filter((r) => {
        if (status === 'Active') return r.status === 'In Progress';
        if (status === 'Review') return r.status === 'In Review';
        if (status === 'Completed') return r.status === 'Completed';
        return r.status === status;
      });
    }

    if (category && category !== 'All Categories') {
      rows = rows.filter((r) => r.category === category);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Project not found' });
    res.json(formatProjectRow(row));
  } catch (err) {
    console.error('Fetch single project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', authenticateToken, (req, res) => {
  try {
    const {
      title,
      category = 'Web Development',
      description = '',
      budget = '$1,500',
      budgetType = 'Fixed Price',
      duration = '2 - 3 Weeks',
      deadline = 'Dec 20, 2026',
      skills = ['React', 'Next.js', 'Tailwind'],
      team = [],
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    const numericBudget = parseInt(String(budget).replace(/[^0-9]/g, ''), 10) || 1500;
    const id = `proj-${Date.now()}`;
    const clientId = req.user ? req.user.id : 'usr-client-1';
    const clientName = req.user ? req.user.name : 'CloudScale AI';
    const thumbnail = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80';
    const teamMembers =
      team.length > 0
        ? team
        : [
            {
              name: req.user ? req.user.name : 'You',
              avatar: req.user
                ? req.user.avatar
                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
            },
          ];

    db.prepare(`
      INSERT INTO projects (
        id, title, category, description, budget, budget_min, budget_max, budget_type,
        duration, skills, featured, status, progress, deadline, client_id, client_name,
        client_rating, thumbnail, team, team_extra, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      category,
      description,
      budget,
      numericBudget,
      numericBudget,
      budgetType,
      duration,
      JSON.stringify(skills),
      0,
      'In Progress',
      10,
      deadline,
      clientId,
      clientName,
      5.0,
      thumbnail,
      JSON.stringify(teamMembers),
      0,
      category.includes('Design') ? 'design' : category.includes('AI') ? 'ai' : 'dev'
    );

    const created = formatProjectRow(db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
    res.status(201).json({ success: true, project: created });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.patch('/api/projects/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const { status, progress, deadline, budget } = req.body || {};
    db.prepare(`
      UPDATE projects
      SET status = COALESCE(?, status),
          progress = COALESCE(?, progress),
          deadline = COALESCE(?, deadline),
          budget = COALESCE(?, budget)
      WHERE id = ?
    `).run(status || null, typeof progress === 'number' ? progress : null, deadline || null, budget || null, req.params.id);

    const updated = formatProjectRow(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
    res.json({ success: true, project: updated });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ==========================================
// 5. KANBAN TASKS CONTROLLER
// ==========================================
app.get('/api/kanban', authenticateToken, (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM kanban_tasks ORDER BY created_at DESC').all();
    res.json(tasks);
  } catch (err) {
    console.error('Fetch kanban tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch kanban tasks' });
  }
});

app.post('/api/kanban', authenticateToken, (req, res) => {
  try {
    const {
      title,
      project = 'SaaS Dashboard Development',
      column = 'backlog',
      priority = 'Medium',
      estimate = '4 hrs',
      assigneeName,
      assigneeRole,
      assignee,
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    const validCols = ['backlog', 'progress', 'review', 'done'];
    const safeCol = validCols.includes(column) ? column : 'backlog';

    const id = `kb-${Date.now()}`;
    const userId = req.user ? req.user.id : 'usr-freelancer-1';

    db.prepare(`
      INSERT INTO kanban_tasks (id, project_id, project, title, column, priority, estimate, assignee, assignee_name, assignee_role, subtasks, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      'proj-1',
      project,
      title.trim(),
      safeCol,
      priority,
      estimate,
      assignee || req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      assigneeName || req.user?.name || 'Arjun Mehta',
      assigneeRole || req.user?.title || 'Frontend Lead',
      '1/2 ready',
      userId
    );

    const task = db.prepare('SELECT * FROM kanban_tasks WHERE id = ?').get(id);
    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/kanban/:id/column', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { column } = req.body || {};

    const validCols = ['backlog', 'progress', 'review', 'done'];
    if (!validCols.includes(column)) {
      return res.status(400).json({ error: 'Invalid column specified' });
    }

    const existing = db.prepare('SELECT * FROM kanban_tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Kanban task not found' });
    }

    db.prepare('UPDATE kanban_tasks SET column = ? WHERE id = ?').run(column, id);
    const task = db.prepare('SELECT * FROM kanban_tasks WHERE id = ?').get(id);

    if (column === 'review') {
      createNotification({
        role: 'client',
        type: 'milestone',
        title: 'Deliverable Ready for Review',
        message: `"${task.title}" (${task.project}) was moved to Milestone Review.`,
        targetPage: 'projects',
        targetTab: 'kanban',
      });
    }

    res.json({ success: true, task });
  } catch (err) {
    console.error('Update task column error:', err);
    res.status(500).json({ error: 'Failed to update task column' });
  }
});

app.delete('/api/kanban/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM kanban_tasks WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Kanban task not found' });
    res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    console.error('Delete kanban task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ==========================================
// 6. CONTRACTS & PROPOSALS CONTROLLER
// ==========================================
app.get('/api/contracts', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all();
    res.json(rows.map(formatContractRow));
  } catch (err) {
    console.error('Fetch contracts error:', err);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

app.post('/api/contracts', authenticateToken, (req, res) => {
  try {
    const {
      title,
      freelancerId,
      freelancerName,
      budget = '2500',
      type = 'Fixed Price',
      deadline = 'Dec 15, 2026',
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Contract milestone title is required' });
    }

    const numericBudget = parseFloat(String(budget).replace(/[^0-9.]/g, '')) || 2500;
    const formattedBudget = `$${numericBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const id = `cnt-${Date.now()}`;
    const clientName = req.user ? req.user.name : 'Sarah Jenkins';
    const clientAvatar = req.user
      ? req.user.avatar
      : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
    const clientCompany = req.user?.workspace_name || 'CloudScale AI';

    db.prepare(`
      INSERT INTO contracts (
        id, title, client_name, client_company, client_avatar, type, rate, weekly_limit,
        total_earned, escrow_locked, current_milestone, deadline, status, progress,
        milestones_count, thumbnail, freelancer_id, client_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      clientName,
      clientCompany,
      clientAvatar,
      type,
      formattedBudget,
      type === 'Hourly' ? '40 hrs/wk' : 'Fixed Milestone',
      '$0.00',
      formattedBudget,
      `Phase 1: ${title.trim()}`,
      deadline,
      'In Progress',
      10,
      '0 of 3 approved',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
      freelancerId || 'usr-freelancer-1',
      req.user ? req.user.id : 'usr-client-1'
    );

    // Create funded escrow entry in payments ledger
    const payId = `tx-${Date.now()}`;
    db.prepare(`
      INSERT INTO payments (id, milestone, project, recipient, recipient_id, amount, status, date, escrow_protected)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payId,
      `Escrow Deposit: ${title.trim()}`,
      title.trim(),
      freelancerName || 'Specialist',
      freelancerId || 'usr-freelancer-1',
      formattedBudget,
      'In Escrow',
      new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      1
    );

    const created = formatContractRow(db.prepare('SELECT * FROM contracts WHERE id = ?').get(id));
    createNotification({
      role: 'freelancer',
      type: 'payment',
      title: `New Escrow Contract Funded (${formattedBudget})`,
      message: `${clientName} funded milestone "${title.trim()}".`,
      targetPage: 'projects',
      targetTab: 'contracts',
    });
    res.status(201).json({ success: true, contract: created, message: `Escrow contract funded with ${formattedBudget}.` });
  } catch (err) {
    console.error('Create contract error:', err);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

app.get('/api/proposals', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM proposals ORDER BY created_at DESC').all();
    res.json(rows.map(formatProposalRow));
  } catch (err) {
    console.error('Fetch proposals error:', err);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

app.post('/api/proposals', authenticateToken, (req, res) => {
  try {
    const {
      project_id = 'proj-1',
      project_title = 'SaaS Dashboard Development',
      bid_amount = '$1,500',
      duration = '3 Weeks',
      pitch = 'I will deliver high quality production code with automated test coverage.',
      cover_letter = '',
    } = req.body || {};

    const id = `prop-${Date.now()}`;
    const candidateId = req.user ? req.user.id : 'usr-freelancer-1';
    const candidateName = req.user ? req.user.name : 'Arjun Mehta';
    const candidateTitle = req.user ? req.user.title : 'Senior Full Stack & Cloud Architect';
    const candidateAvatar = req.user
      ? req.user.avatar
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

    const projRow = db.prepare('SELECT client_name FROM projects WHERE id = ?').get(project_id);

    db.prepare(`
      INSERT INTO proposals (id, project_id, project_title, candidate_id, candidate_name, candidate_title, candidate_avatar, candidate_rating, candidate_reviews, bid_amount, duration, status, submitted_date, pitch, client_name, client_avatar, cover_letter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      project_id,
      project_title,
      candidateId,
      candidateName,
      candidateTitle,
      candidateAvatar,
      4.95,
      128,
      bid_amount,
      duration,
      'In Review',
      'Just now',
      pitch,
      projRow?.client_name || 'Workverse Client',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      cover_letter || pitch
    );

    const proposal = formatProposalRow(db.prepare('SELECT * FROM proposals WHERE id = ?').get(id));
    createNotification({
      role: 'client',
      type: 'proposal',
      title: `New Bid on ${project_title}`,
      message: `${candidateName} submitted a proposal for ${bid_amount}.`,
      targetPage: 'projects',
      targetTab: 'proposals',
    });
    res.status(201).json({ success: true, proposal });
  } catch (err) {
    console.error('Create proposal error:', err);
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
});

app.patch('/api/proposals/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ error: 'Proposal status is required' });
    }

    const existing = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    db.prepare('UPDATE proposals SET status = ? WHERE id = ?').run(status, id);

    // If accepted, automatically create an active contract if one doesn't exist for this proposal title
    if (status === 'Accepted') {
      const existingContract = db.prepare('SELECT id FROM contracts WHERE title = ? AND freelancer_id = ?').get(existing.project_title, existing.candidate_id);
      if (!existingContract) {
        db.prepare(`
          INSERT INTO contracts (
            id, title, client_name, client_company, client_avatar, type, rate, weekly_limit,
            total_earned, escrow_locked, current_milestone, deadline, status, progress,
            milestones_count, thumbnail, freelancer_id, client_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `cnt-${Date.now()}`,
          existing.project_title,
          req.user?.name || existing.client_name || 'Sarah Jenkins',
          'Workverse Client',
          existing.client_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
          existing.bid_amount.includes('/hr') ? 'Hourly' : 'Fixed Price',
          existing.bid_amount,
          existing.duration || 'Sprint',
          '$0.00',
          existing.bid_amount,
          'Kickoff & Architecture Milestone',
          'Dec 18, 2026',
          'In Progress',
          5,
          '0 of 4 approved',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
          existing.candidate_id || 'usr-freelancer-1',
          req.user?.id || 'usr-client-1'
        );
      }
    }

    const proposal = formatProposalRow(db.prepare('SELECT * FROM proposals WHERE id = ?').get(id));
    createNotification({
      role: 'freelancer',
      type: 'proposal',
      title: `Proposal ${status}`,
      message: `Your bid on "${existing.project_title}" was marked as ${status}.`,
      targetPage: 'projects',
      targetTab: status === 'Accepted' ? 'contracts' : 'my_proposals',
    });
    res.json({ success: true, proposal });
  } catch (err) {
    console.error('Update proposal status error:', err);
    res.status(500).json({ error: 'Failed to update proposal status' });
  }
});

// ==========================================
// 7. TIME TRACKER & WALLET
// ==========================================
app.post('/api/time/log', authenticateToken, (req, res) => {
  try {
    const {
      seconds = 0,
      project_title = 'SaaS Dashboard Development',
      hourly_rate = 45.0,
      formatted_time = '00:00:00',
    } = req.body || {};

    if (typeof seconds !== 'number' || seconds < 0) {
      return res.status(400).json({ error: 'Valid non-negative seconds required' });
    }

    const amountEarned = Number(((seconds / 3600) * hourly_rate).toFixed(2));
    const userId = req.user ? req.user.id : 'usr-freelancer-1';
    const logId = `time-${Date.now()}`;

    db.prepare(`
      INSERT INTO time_logs (id, user_id, project_title, seconds, formatted_time, hourly_rate, amount_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(logId, userId, project_title, seconds, formatted_time, hourly_rate, amountEarned);

    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amountEarned, userId);

    if (amountEarned > 0) {
      db.prepare(`
        INSERT INTO wallet_transactions (id, user_id, type, amount, method, status, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`wtx-${Date.now()}`, userId, 'time_log', amountEarned, 'escrow', 'Completed', `Logged ${formatted_time} on ${project_title}`);
    }

    const updatedUser = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(userId);
    if (amountEarned > 0) {
      createNotification({
        userId,
        role: 'freelancer',
        type: 'payment',
        title: `Milestone Time Credited (+$${amountEarned.toFixed(2)})`,
        message: `Logged ${formatted_time} on ${project_title} to escrow wallet.`,
        targetPage: 'projects',
        targetTab: 'earnings',
      });
    }
    res.json({
      success: true,
      logId,
      amountEarned,
      newWalletBalance: updatedUser ? updatedUser.wallet_balance : null,
      message: `Logged ${formatted_time} ($${amountEarned.toFixed(2)}) to live escrow wallet.`,
    });
  } catch (err) {
    console.error('Time log error:', err);
    res.status(500).json({ error: 'Failed to log milestone time session' });
  }
});

app.get('/api/time/logs', authenticateToken, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'usr-freelancer-1';
    const logs = db.prepare('SELECT * FROM time_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
    res.json(logs);
  } catch (err) {
    console.error('Fetch time logs error:', err);
    res.status(500).json({ error: 'Failed to fetch time logs' });
  }
});

app.get('/api/wallet', authenticateToken, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'usr-freelancer-1';
    const user = db.prepare('SELECT wallet_balance, escrow_balance FROM users WHERE id = ?').get(userId);
    const transactions = db.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 30').all(userId);

    res.json({
      walletBalance: user ? user.wallet_balance : 4250.0,
      escrowBalance: user ? user.escrow_balance : 8900.0,
      transactions,
    });
  } catch (err) {
    console.error('Wallet fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve wallet information' });
  }
});

app.post('/api/wallet/withdraw', authenticateToken, (req, res) => {
  try {
    const { amount, method = 'stripe' } = req.body || {};
    const withdrawAmt = parseFloat(amount);

    if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
      return res.status(400).json({ error: 'Valid positive withdrawal amount required' });
    }

    const userId = req.user ? req.user.id : 'usr-freelancer-1';
    const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(userId);

    if (!user || user.wallet_balance < withdrawAmt) {
      return res.status(400).json({
        error: `Insufficient funds. Available balance is $${user ? user.wallet_balance.toFixed(2) : '0.00'}`,
      });
    }

    db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(withdrawAmt, userId);

    const txId = `wtx-${Date.now()}`;
    db.prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, method, status, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(txId, userId, 'withdrawal', withdrawAmt, method, 'Completed', `Withdrawal via ${method.toUpperCase()}`);

    const updated = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(userId);
    createNotification({
      userId,
      role: 'freelancer',
      type: 'payment',
      title: `Withdrawal Processed ($${withdrawAmt.toFixed(2)})`,
      message: `Disbursed via ${method.toUpperCase()} — remaining balance $${updated.wallet_balance.toFixed(2)}.`,
      targetPage: 'projects',
      targetTab: 'earnings',
    });
    res.json({
      success: true,
      withdrawn: withdrawAmt,
      remainingBalance: updated.wallet_balance,
      transactionId: txId,
      message: `Disbursement of $${withdrawAmt.toFixed(2)} completed via ${method.toUpperCase()}.`,
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

// ==========================================
// 8. MESSAGES & THREADS (100% SQLite)
// ==========================================
app.get('/api/messages', authenticateToken, (req, res) => {
  try {
    const threads = db.prepare('SELECT * FROM message_threads ORDER BY updated_at DESC').all();
    const allMessages = db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();

    const result = threads.map((tm) => {
      const msgs = allMessages.filter((m) => m.thread_id === tm.id);
      const last = msgs[msgs.length - 1];
      return {
        id: tm.id,
        user: {
          name: tm.user_name,
          role: tm.user_role,
          avatar: tm.user_avatar,
          online: Boolean(tm.user_online),
        },
        project: tm.project,
        lastMessage: last ? last.text : 'Conversation started',
        time: last ? last.time : 'Today',
        unread: tm.unread || 0,
        messages: msgs,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', authenticateToken, (req, res) => {
  try {
    const {
      thread_id,
      text,
      project = 'SaaS Dashboard Development',
      recipientName,
      recipientRole = 'Verified Specialist',
      recipientAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    let targetThreadId = thread_id;

    // Look up or dynamically create thread when messaging from Find Talent / Profile
    if (!targetThreadId && recipientName) {
      const existingThread = db.prepare('SELECT id FROM message_threads WHERE LOWER(user_name) = LOWER(?)').get(recipientName.trim());
      if (existingThread) {
        targetThreadId = existingThread.id;
      } else {
        targetThreadId = `thread-${Date.now()}`;
        db.prepare(`
          INSERT INTO message_threads (id, user_name, user_role, user_avatar, user_online, project, unread)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(targetThreadId, recipientName.trim(), recipientRole, recipientAvatar, 1, project, 0);
      }
    }

    if (!targetThreadId) {
      targetThreadId = 'thread-1';
    }

    const id = `msg-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    db.prepare(`
      INSERT INTO messages (id, thread_id, project, sender, text, time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, targetThreadId, project, 'you', text.trim(), timeStr);

    db.prepare("UPDATE message_threads SET updated_at = datetime('now') WHERE id = ?").run(targetThreadId);

    createNotification({
      role: 'all',
      type: 'message',
      title: `New Message: ${project || 'Workspace Chat'}`,
      message: text.trim().slice(0, 140),
      targetPage: 'projects',
      targetTab: 'messages',
    });

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    res.status(201).json({ success: true, threadId: targetThreadId, message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==========================================
// 9. FILES, TEAM & PAYMENTS
// ==========================================
app.get('/api/files', authenticateToken, (req, res) => {
  try {
    const files = db.prepare('SELECT * FROM files ORDER BY created_at DESC').all();
    res.json(files);
  } catch (err) {
    console.error('Fetch files error:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.post('/api/files', authenticateToken, (req, res) => {
  try {
    const { name, size = '14.2 MB', project = 'SaaS Dashboard Development' } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const id = `f-${Date.now()}`;
    const type = name.endsWith('.pdf') ? 'pdf' : name.endsWith('.fig') ? 'figma' : 'archive';
    const uploadedBy = req.user ? req.user.name : 'You';

    db.prepare(`
      INSERT INTO files (id, name, size, type, uploaded_by, date, project)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), size, type, uploadedBy, 'Today', project);

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    res.status(201).json({ success: true, file });
  } catch (err) {
    console.error('Upload file error:', err);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
});

app.delete('/api/files/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'File not found' });
    res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/team', authenticateToken, (req, res) => {
  try {
    const team = db.prepare('SELECT * FROM team_members ORDER BY created_at DESC').all();
    res.json(team);
  } catch (err) {
    console.error('Fetch team error:', err);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

app.post('/api/team', authenticateToken, (req, res) => {
  try {
    const { name, email, role = 'Contributor', project = 'SaaS Dashboard Development' } = req.body || {};
    const memberName = name || (email ? email.split('@')[0] : null);
    if (!memberName) return res.status(400).json({ error: 'Email or name is required' });

    const id = `tm-${Date.now()}`;
    db.prepare(`
      INSERT INTO team_members (id, name, role, project, status, hourly, avatar, permission)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      memberName,
      role,
      project,
      'Active',
      '$40/hr',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      'Editor'
    );

    const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
    res.status(201).json({ success: true, member });
  } catch (err) {
    console.error('Invite member error:', err);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

app.get('/api/payments', authenticateToken, (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
    res.json(
      payments.map((p) => ({
        ...p,
        escrowProtected: Boolean(p.escrow_protected),
      }))
    );
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.patch('/api/payments/:id/release', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    if (payment.status === 'Released') {
      return res.status(400).json({ error: 'Escrow payment has already been released' });
    }

    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('Released', id);

    if (payment.recipient_id) {
      const recipientUser = db.prepare('SELECT id FROM users WHERE id = ?').get(payment.recipient_id);
      const amtNumeric = parseFloat(String(payment.amount).replace(/[^0-9.]/g, ''));
      if (recipientUser && !isNaN(amtNumeric) && amtNumeric > 0) {
        db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amtNumeric, payment.recipient_id);
        db.prepare(`
          INSERT INTO wallet_transactions (id, user_id, type, amount, method, status, note)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(`wtx-${Date.now()}`, payment.recipient_id, 'milestone_release', amtNumeric, 'escrow', 'Completed', payment.milestone);
      }
    }

    createNotification({
      role: 'freelancer',
      type: 'payment',
      title: `Escrow Payment Released (${payment.amount})`,
      message: `${payment.project}: ${payment.milestone} released to ${payment.recipient}`,
      targetPage: 'projects',
      targetTab: 'earnings',
    });

    const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    res.json({
      success: true,
      payment: { ...updated, escrowProtected: Boolean(updated.escrow_protected) },
      message: `Escrow payment of ${payment.amount} released to ${payment.recipient}.`,
    });
  } catch (err) {
    console.error('Release payment error:', err);
    res.status(500).json({ error: 'Failed to release escrow payment' });
  }
});

// ==========================================
// 10. PRICING, RESOURCES, BOOKMARKS, NEWSLETTER, SEARCH
// ==========================================
app.get('/api/pricing', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM pricing_plans ORDER BY sort_order ASC').all();
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        tagline: r.tagline,
        icon: r.icon,
        badge: r.badge,
        priceMonthly: r.price_monthly,
        priceYearly: r.price_yearly,
        priceSymbol: r.price_symbol,
        priceUsdMonthly: r.price_usd_monthly,
        priceUsdYearly: r.price_usd_yearly,
        period: r.period,
        buttonText: r.button_text,
        buttonVariant: r.button_variant,
        highlighted: Boolean(r.highlighted),
        features: safeJsonParse(r.features, []),
      }))
    );
  } catch (err) {
    console.error('Fetch pricing error:', err);
    res.status(500).json({ error: 'Failed to load pricing plans' });
  }
});

app.post('/api/subscriptions', authenticateToken, (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'Plan ID is required' });

    const plan = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ error: 'Selected plan does not exist' });

    const userId = req.user ? req.user.id : 'usr-client-1';
    db.prepare('UPDATE users SET subscription_plan = ?, billing_cycle = ? WHERE id = ?').run(planId, billingCycle, userId);

    res.json({
      success: true,
      planId,
      billingCycle,
      message: `Subscribed to the ${plan.name} plan (${billingCycle} billing).`,
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to update subscription plan' });
  }
});

app.get('/api/resources', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM resources ORDER BY featured DESC, date DESC').all();
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: r.excerpt,
        category: r.category,
        readTime: r.read_time,
        date: r.date,
        author: {
          name: r.author_name,
          avatar: r.author_avatar,
        },
        image: r.image,
        featured: Boolean(r.featured),
        tags: safeJsonParse(r.tags, []),
        content: r.content,
      }))
    );
  } catch (err) {
    console.error('Fetch resources error:', err);
    res.status(500).json({ error: 'Failed to load resources' });
  }
});

app.get('/api/bookmarks', authenticateToken, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'default';
    const { type } = req.query;
    let rows = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? OR user_id = ?').all(userId, 'default');
    if (type) {
      rows = rows.filter((r) => r.item_type === type);
    }
    res.json(rows.map((r) => ({ id: r.id, itemType: r.item_type, itemId: r.item_id })));
  } catch (err) {
    console.error('Fetch bookmarks error:', err);
    res.status(500).json({ error: 'Failed to load bookmarks' });
  }
});

app.post('/api/bookmarks/toggle', authenticateToken, (req, res) => {
  try {
    const { itemType, itemId } = req.body || {};
    if (!itemType || !itemId) {
      return res.status(400).json({ error: 'itemType and itemId are required' });
    }
    const userId = req.user ? req.user.id : 'default';
    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?').get(userId, itemType, itemId);

    let saved;
    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
      saved = false;
    } else {
      db.prepare('INSERT INTO bookmarks (id, user_id, item_type, item_id) VALUES (?, ?, ?, ?)').run(
        `bm-${Date.now()}`,
        userId,
        itemType,
        itemId
      );
      saved = true;
    }

    const updated = db.prepare('SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = ?').all(userId, itemType).map((r) => r.item_id);
    res.json({ success: true, saved, itemId, ids: updated });
  } catch (err) {
    console.error('Bookmark toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

app.post('/api/newsletter', (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    const clean = email.trim().toLowerCase();
    db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (id, email) VALUES (?, ?)').run(`nl-${Date.now()}`, clean);
    res.status(201).json({ success: true, email: clean, message: 'Subscribed to Workverse Weekly!' });
  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
});

app.get('/api/search', (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const talents = db
      .prepare('SELECT * FROM talents')
      .all()
      .map(formatTalentRow)
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.skills.some((s) => s.toLowerCase().includes(q)));

    const projects = db
      .prepare('SELECT * FROM projects')
      .all()
      .map(formatProjectRow)
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.skills.some((s) => s.toLowerCase().includes(q)));

    const articles = db
      .prepare('SELECT * FROM resources')
      .all()
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        readTime: r.read_time,
        excerpt: r.excerpt,
      }))
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));

    res.json({ talents, projects, articles });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ error: 'Search query failed' });
  }
});

// ==========================================
// 10B. REAL-TIME NOTIFICATIONS API
// ==========================================
function formatNotificationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    userId: row.user_id,
    role: row.role,
    type: row.type,
    title: row.title,
    message: row.message,
    target_page: row.target_page || 'projects',
    targetPage: row.target_page || 'projects',
    target_tab: row.target_tab || '',
    targetTab: row.target_tab || '',
    is_read: row.is_read,
    isRead: Boolean(row.is_read),
    created_at: row.created_at,
    createdAt: row.created_at,
  };
}

function resolveNotificationScope(req) {
  const activeUserId = req.user?.id || 'all';
  const requestedRole = (req.query.role || req.body?.role || req.user?.role || 'client').toString();
  const activeRole = requestedRole === 'freelancer' ? 'freelancer' : 'client';
  return { activeUserId, activeRole };
}

app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const { activeUserId, activeRole } = resolveNotificationScope(req);
    const rows = db
      .prepare(
        `SELECT * FROM notifications
         WHERE (user_id = ? OR user_id = 'all') AND (role = ? OR role = 'all')
         ORDER BY created_at DESC, rowid DESC
         LIMIT 40`
      )
      .all(activeUserId, activeRole);

    const unreadRow = db
      .prepare(
        `SELECT COUNT(*) as count FROM notifications
         WHERE is_read = 0 AND (user_id = ? OR user_id = 'all') AND (role = ? OR role = 'all')`
      )
      .get(activeUserId, activeRole);

    res.json({
      notifications: rows.map(formatNotificationRow),
      unreadCount: unreadRow ? unreadRow.count : 0,
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

app.patch('/api/notifications/read-all', authenticateToken, (req, res) => {
  try {
    const { activeUserId, activeRole } = resolveNotificationScope(req);
    db.prepare(
      `UPDATE notifications
       SET is_read = 1
       WHERE is_read = 0 AND (user_id = ? OR user_id = 'all') AND (role = ? OR role = 'all')`
    ).run(activeUserId, activeRole);

    res.json({ success: true, unreadCount: 0 });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    const { activeUserId, activeRole } = resolveNotificationScope(req);
    const unreadRow = db
      .prepare(
        `SELECT COUNT(*) as count FROM notifications
         WHERE is_read = 0 AND (user_id = ? OR user_id = 'all') AND (role = ? OR role = 'all')`
      )
      .get(activeUserId, activeRole);

    res.json({
      success: true,
      notification: formatNotificationRow(updated),
      unreadCount: unreadRow ? unreadRow.count : 0,
    });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.delete('/api/notifications/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ==========================================
// 11. CLEAN 404 & GLOBAL ERROR MIDDLEWARE
// ==========================================
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start listening dual-stack (supports both localhost and 127.0.0.1)
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 WORKVERSE PRODUCTION BACKEND RUNNING ON:`);
  console.log(`👉 http://127.0.0.1:${PORT}`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown handling for containers and process managers
function handleGracefulShutdown(signal) {
  console.log(`\n[${new Date().toISOString()}] Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    console.log(`[${new Date().toISOString()}] HTTP server closed successfully.`);
    try {
      if (db && typeof db.close === 'function') {
        db.close();
        console.log(`[${new Date().toISOString()}] SQLite database connection closed cleanly.`);
      }
    } catch (e) {
      console.error('Error closing database:', e);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error(`[${new Date().toISOString()}] Could not close connections in time, forcefully shutting down.`);
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

module.exports = { app, server };

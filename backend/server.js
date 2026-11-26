require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { randomUUID, randomBytes } = require('node:crypto');
const { db, logAuditEvent } = require('./db');
const { renderDashboardHtml, renderDocsHtml } = require('./dashboard');
const { getOpenApiSpec } = require('./openapi');
const { avatarUrl, generatedAvatarStyle, inferAvatarStyle, renderAvatarSvg } = require('./avatar');

const app = express();
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production');
}
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((origin) => origin.trim());

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '16mb' }));

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
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
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
    'demo_payments',
    'resources',
    'bookmarks',
    'newsletter_subscribers',
    'notifications',
    'disputes',
  ];
  const counts = {};
  for (const t of tables) {
    counts[t] = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
  }
  counts.talents = db.prepare(`SELECT COUNT(*) AS c FROM talents t JOIN users u ON u.id = t.user_id AND u.role = 'freelancer'`).get().c;
  counts.projects = db.prepare(`SELECT COUNT(*) AS c FROM projects p JOIN users u ON u.id = p.client_id AND u.role = 'client'`).get().c;
  counts.active_projects = db.prepare(`SELECT COUNT(*) AS c FROM projects p JOIN users u ON u.id = p.client_id AND u.role = 'client' WHERE p.status != 'Completed'`).get().c;
  const ratingRow = db.prepare(`SELECT AVG(t.rating) AS average FROM talents t JOIN users u ON u.id = t.user_id AND u.role = 'freelancer' WHERE t.reviews_count > 0`).get();
  return {
    status: 'ok',
    port: PORT,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(1)),
    counts,
    averageTalentRating: Number(ratingRow?.average || 0),
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
  const talent = row.role === 'freelancer'
    ? db.prepare(`
        SELECT verified, rating, reviews_count, job_success, completed_projects, available
        FROM talents WHERE user_id = ? LIMIT 1
      `).get(row.id)
    : null;
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
    subscription_status: row.subscription_status || 'inactive',
    workspace_name: row.workspace_name || 'Workverse Ventures',
    billing_email: row.billing_email || row.email,
    auto_escrow_release: Boolean(row.auto_escrow_release ?? 1),
    two_factor_auth: Boolean(row.two_factor_auth ?? 1),
    email_digest: row.email_digest || 'Daily',
    verified: Boolean(talent?.verified),
    rating: Number(talent?.rating || 0),
    reviews_count: Number(talent?.reviews_count || 0),
    job_success: talent?.job_success || 'No ratings yet',
    completed_projects: Number(talent?.completed_projects || 0),
    available: talent ? Boolean(talent.available) : undefined,
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

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `This action requires a ${roles.join(' or ')} account` });
    }
    next();
  };
}

function canAccessProject(userId, projectId) {
  if (!userId || !projectId) return false;
  return Boolean(
    db.prepare(`
      SELECT p.id
      FROM projects p
      WHERE p.id = ? AND (
        p.client_id = ?
        OR EXISTS (SELECT 1 FROM contracts c WHERE c.freelancer_id = ? AND c.title = p.title)
        OR EXISTS (SELECT 1 FROM proposals pr WHERE pr.candidate_id = ? AND pr.project_id = p.id AND pr.status = 'Accepted')
      )
      LIMIT 1
    `).get(projectId, userId, userId, userId)
  );
}

function resolveProjectForUser(userId, { projectId, projectTitle } = {}) {
  const project = projectId
    ? db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId)
    : db.prepare('SELECT * FROM projects WHERE lower(title) = lower(?) ORDER BY created_at DESC LIMIT 1').get(projectTitle || '');
  if (!project || !canAccessProject(userId, project.id)) return null;
  return project;
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
app.get('/api/avatar', (req, res) => {
  const seed = String(req.query.seed || 'Member').slice(0, 80);
  const svg = renderAvatarSvg(seed, req.query.style);
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

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
    const defaultAvatar = avatarUrl(name, inferAvatarStyle(name));
    const defaultTitle = role === 'freelancer' ? 'Full Stack Developer' : 'Project Manager & Founder';
    const starterWallet = 0;
    const starterEscrow = 0;

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
        0,
        1,
        defaultAvatar,
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
        0,
        0,
        45,
        'Remote',
        'New to Workverse',
        'No ratings yet',
        0,
        'Development',
        'Entry Level',
        `${name.trim()} is building their Workverse profile.`,
        '[]',
        JSON.stringify(['New Member']),
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
      return res.status(403).json({
        error: `This account is registered as ${userRecord.role}. Choose the ${userRecord.role} sign-in tab.`,
      });
    }

    const user = formatUserRow(userRecord);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    logAuditEvent({
      userId: user.id,
      action: 'auth.login',
      entityType: 'session',
      entityId: user.id,
      details: `User ${user.name} logged into ${user.role} workspace`,
      ip,
    });

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

app.patch('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const { name, title, avatar, avatarStyle, hourlyRate, location, about, skills, available } = req.body || {};
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    const safeRate = hourlyRate === undefined ? null : Number(hourlyRate);
    if (safeRate !== null && (!Number.isFinite(safeRate) || safeRate < 0 || safeRate > 10000)) {
      return res.status(400).json({ error: 'Hourly rate must be between 0 and 10,000' });
    }
    if (avatarStyle !== undefined && !['masculine', 'feminine', 'neutral'].includes(avatarStyle)) {
      return res.status(400).json({ error: 'Choose a valid avatar appearance' });
    }
    const nextName = name === undefined ? req.user.name : String(name).trim();
    const selectedStyle = avatarStyle || generatedAvatarStyle(avatar) || generatedAvatarStyle(req.user.avatar);
    const nextAvatar = avatarStyle !== undefined || generatedAvatarStyle(avatar)
      ? avatarUrl(nextName, selectedStyle)
      : avatar === undefined && name !== undefined && generatedAvatarStyle(req.user.avatar)
        ? avatarUrl(nextName, selectedStyle)
        : avatar === undefined ? null : String(avatar).trim();

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name), title = COALESCE(?, title), avatar = COALESCE(?, avatar),
          hourly_rate = COALESCE(?, hourly_rate)
      WHERE id = ?
    `).run(
      name === undefined ? null : String(name).trim(),
      title === undefined ? null : String(title).trim(),
      nextAvatar,
      safeRate,
      req.user.id
    );

    if (req.user.role === 'freelancer') {
      db.prepare(`
        UPDATE talents
        SET name = COALESCE(?, name), title = COALESCE(?, title), role = COALESCE(?, role),
            avatar = COALESCE(?, avatar), hourly_rate = COALESCE(?, hourly_rate),
            location = COALESCE(?, location), about = COALESCE(?, about),
            skills = COALESCE(?, skills), available = COALESCE(?, available)
        WHERE user_id = ?
      `).run(
        name === undefined ? null : String(name).trim(),
        title === undefined ? null : String(title).trim(),
        title === undefined ? null : String(title).trim(),
        nextAvatar,
        safeRate,
        location === undefined ? null : String(location).trim(),
        about === undefined ? null : String(about).trim(),
        skills === undefined ? null : JSON.stringify(Array.isArray(skills) ? skills.map(String).map((s) => s.trim()).filter(Boolean) : []),
        available === undefined ? null : (available ? 1 : 0),
        req.user.id
      );
    }

    const user = formatUserRow(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
    res.json({ success: true, user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/auth/forgot-password', authRateLimiter, (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    res.json({
      success: true,
      deliveryConfigured: false,
      message: 'Password-reset email delivery is not configured on localhost. Connect an email provider before enabling this flow.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

app.get('/api/settings', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const formatted = formatUserRow(userRow);
    res.json({
      workspaceName: formatted?.workspace_name || 'Workverse Ventures',
      billingEmail: formatted?.billing_email || formatted?.email || '',
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
    const userId = req.user.id;
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
    let rows = db.prepare(`
      SELECT t.* FROM talents t
      JOIN users u ON u.id = t.user_id AND u.role = 'freelancer'
      ORDER BY t.rating DESC, t.reviews_count DESC, t.created_at DESC
    `).all().map(formatTalentRow);

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
    const row = db.prepare(`
      SELECT t.* FROM talents t JOIN users u ON u.id = t.user_id AND u.role = 'freelancer'
      WHERE t.id = ?
    `).get(req.params.id);
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
app.get('/api/projects', optionalAuth, (req, res) => {
  try {
    const { status, search, category, page, limit, sortBy, sortOrder, paginate, scope } = req.query;
    let rows = db.prepare(`
      SELECT p.* FROM projects p
      JOIN users u ON u.id = p.client_id AND u.role = 'client'
      ORDER BY p.created_at DESC
    `).all().map(formatProjectRow);

    if (scope === 'mine') {
      if (!req.user) return res.status(401).json({ error: 'Authentication token required' });
      if (req.user.role === 'client') {
        rows = rows.filter((project) => project.clientId === req.user.id);
      } else {
        const projectIds = new Set(
          db.prepare(`
            SELECT project_id FROM proposals WHERE candidate_id = ?
            UNION
            SELECT p.id AS project_id FROM projects p
            JOIN contracts c ON c.title = p.title
            WHERE c.freelancer_id = ?
          `).all(req.user.id, req.user.id).map((row) => row.project_id).filter(Boolean)
        );
        rows = rows.filter((project) => projectIds.has(project.id));
      }
    }

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
          (Array.isArray(r.skills) && r.skills.some((s) => s.toLowerCase().includes(q)))
      );
    }

    if (sortBy) {
      const order = (sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        if (sortBy === 'budget') return ((a.budget_max || 0) - (b.budget_max || 0)) * order;
        if (sortBy === 'progress') return ((a.progress || 0) - (b.progress || 0)) * order;
        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '') * order;
        return (new Date(a.created_at || 0) - new Date(b.created_at || 0)) * order;
      });
    }

    if (page || limit || paginate === 'true') {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
      const total = rows.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const offset = (pageNum - 1) * pageSize;
      const paginatedProjects = rows.slice(offset, offset + pageSize);

      return res.json({
        projects: paginatedProjects,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      });
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT p.* FROM projects p JOIN users u ON u.id = p.client_id AND u.role = 'client'
      WHERE p.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Project not found' });
    res.json(formatProjectRow(row));
  } catch (err) {
    console.error('Fetch single project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', authenticateToken, requireRole('client'), (req, res) => {
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
    const clientId = req.user.id;
    const clientName = req.user.name;
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

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    logAuditEvent({
      userId: clientId,
      action: 'project.create',
      entityType: 'project',
      entityId: id,
      details: `Project "${created.title}" created with budget ${budget}`,
      ip,
    });

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
    if (existing.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can update this project' });
    }

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
    const existing = db.prepare('SELECT client_id FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    if (existing.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can delete this project' });
    }
    const result = db.prepare('DELETE FROM projects WHERE id = ? AND client_id = ?').run(req.params.id, req.user.id);
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
    const tasks = db.prepare(`
      SELECT DISTINCT k.*
      FROM kanban_tasks k
      LEFT JOIN projects p ON p.id = k.project_id
      LEFT JOIN contracts c ON c.title = p.title AND c.freelancer_id = ?
      WHERE k.user_id = ? OR p.client_id = ? OR c.id IS NOT NULL
      ORDER BY k.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id);
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
      project = '',
      projectId,
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

    const targetProject = resolveProjectForUser(req.user.id, { projectId, projectTitle: project });
    if (!targetProject) {
      return res.status(403).json({ error: 'Choose a project that belongs to your workspace' });
    }

    const id = `kb-${Date.now()}`;
    const userId = req.user.id;

    db.prepare(`
      INSERT INTO kanban_tasks (id, project_id, project, title, column, priority, estimate, assignee, assignee_name, assignee_role, subtasks, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      targetProject.id,
      targetProject.title,
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
    if (existing.user_id !== req.user.id && !canAccessProject(req.user.id, existing.project_id)) {
      return res.status(403).json({ error: 'You do not have access to this task' });
    }

    db.prepare('UPDATE kanban_tasks SET column = ? WHERE id = ?').run(column, id);
    const task = db.prepare('SELECT * FROM kanban_tasks WHERE id = ?').get(id);

    if (column === 'review') {
      const projectOwner = task.project_id ? db.prepare('SELECT client_id FROM projects WHERE id = ?').get(task.project_id) : null;
      createNotification({
        userId: projectOwner?.client_id || req.user.id,
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
    const existing = db.prepare('SELECT * FROM kanban_tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Kanban task not found' });
    if (existing.user_id !== req.user.id && !canAccessProject(req.user.id, existing.project_id)) {
      return res.status(403).json({ error: 'You do not have access to this task' });
    }
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
    const rows = db.prepare(`
      SELECT * FROM contracts
      WHERE client_id = ? OR freelancer_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id, req.user.id);
    res.json(rows.map(formatContractRow));
  } catch (err) {
    console.error('Fetch contracts error:', err);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

app.post('/api/contracts', authenticateToken, requireRole('client'), (req, res) => {
  try {
    const {
      title,
      freelancerId,
      freelancerName,
      budget = '2500',
      type = 'Fixed Price',
      deadline = 'Dec 15, 2026',
      projectId = null,
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Contract milestone title is required' });
    }

    const freelancerUser = db.prepare(`
      SELECT u.* FROM users u
      WHERE u.role = 'freelancer' AND (
        u.id = ? OR u.id = (SELECT user_id FROM talents WHERE id = ?)
      )
      LIMIT 1
    `).get(freelancerId || '', freelancerId || '');
    if (!freelancerUser) {
      return res.status(400).json({ error: 'Select a registered freelancer before creating a contract' });
    }
    const linkedProject = projectId ? db.prepare('SELECT * FROM projects WHERE id = ? AND client_id = ?').get(projectId, req.user.id) : null;

    const numericBudget = Number(budget);
    if (!Number.isFinite(numericBudget) || numericBudget <= 0 || numericBudget > 10000000) return res.status(400).json({ error: 'Enter a valid milestone budget' });
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
      '$0.00',
      `Phase 1: ${title.trim()}`,
      deadline,
      'In Progress',
      10,
      '0 of 3 approved',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
      freelancerUser.id,
      req.user.id
    );

    // A contract offer is not a payment. Funding requires a separate provider flow.
    const payId = `tx-${Date.now()}`;
    db.prepare(`
      INSERT INTO payments (id, milestone, project, recipient, recipient_id, amount, status, date, escrow_protected, client_id, project_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payId,
      `Funding required: ${title.trim()}`,
      title.trim(),
      freelancerName || freelancerUser.name,
      freelancerUser.id,
      formattedBudget,
      'Pending Funding',
      new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      0,
      req.user.id,
      linkedProject?.id || null
    );

    const created = formatContractRow(db.prepare('SELECT * FROM contracts WHERE id = ?').get(id));
    createNotification({
      userId: freelancerUser.id,
      role: 'freelancer',
      type: 'payment',
      title: `New Contract Offer (${formattedBudget})`,
      message: `${clientName} proposed milestone "${title.trim()}". Funding has not been collected.`,
      targetPage: 'projects',
      targetTab: 'contracts',
    });
    res.status(201).json({ success: true, contract: created, message: `Contract offer created for ${formattedBudget}. Funding has not been collected.` });
  } catch (err) {
    console.error('Create contract error:', err);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

app.get('/api/proposals', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT DISTINCT pr.*
      FROM proposals pr
      LEFT JOIN projects p ON p.id = pr.project_id
      WHERE pr.candidate_id = ? OR p.client_id = ?
      ORDER BY pr.created_at DESC
    `).all(req.user.id, req.user.id);
    res.json(rows.map(formatProposalRow));
  } catch (err) {
    console.error('Fetch proposals error:', err);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

app.post('/api/proposals', authenticateToken, requireRole('freelancer'), (req, res) => {
  try {
    const {
      project_id,
      project_title,
      bid_amount = '$1,500',
      duration = '3 Weeks',
      pitch = 'I will deliver high quality production code with automated test coverage.',
      cover_letter = '',
    } = req.body || {};

    if (!project_id) return res.status(400).json({ error: 'Project ID is required' });
    const projRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
    if (!projRow) return res.status(404).json({ error: 'Project not found' });
    if (projRow.client_id === req.user.id) return res.status(400).json({ error: 'You cannot bid on your own project' });
    const duplicate = db.prepare('SELECT id FROM proposals WHERE project_id = ? AND candidate_id = ?').get(project_id, req.user.id);
    if (duplicate) return res.status(409).json({ error: 'You already submitted a proposal for this project' });

    const id = `prop-${Date.now()}`;
    const candidateId = req.user.id;
    const candidateName = req.user.name;
    const candidateTitle = req.user.title;
    const candidateAvatar = req.user.avatar;
    const talent = db.prepare('SELECT rating, reviews_count FROM talents WHERE user_id = ?').get(req.user.id);

    db.prepare(`
      INSERT INTO proposals (id, project_id, project_title, candidate_id, candidate_name, candidate_title, candidate_avatar, candidate_rating, candidate_reviews, bid_amount, duration, status, submitted_date, pitch, client_name, client_avatar, cover_letter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      project_id,
      projRow.title,
      candidateId,
      candidateName,
      candidateTitle,
      candidateAvatar,
      talent?.rating || 0,
      talent?.reviews_count || 0,
      bid_amount,
      duration,
      'In Review',
      'Just now',
      pitch,
      projRow.client_name,
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      cover_letter || pitch
    );

    const proposal = formatProposalRow(db.prepare('SELECT * FROM proposals WHERE id = ?').get(id));
    createNotification({
      userId: projRow.client_id,
      role: 'client',
      type: 'proposal',
      title: `New Bid on ${projRow.title}`,
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
    const proposalProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(existing.project_id);
    if (!proposalProject || proposalProject.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can update this proposal' });
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
          req.user.id
        );
      }
    }

    const proposal = formatProposalRow(db.prepare('SELECT * FROM proposals WHERE id = ?').get(id));
    createNotification({
      userId: existing.candidate_id,
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
app.post('/api/time/log', authenticateToken, requireRole('freelancer'), (req, res) => {
  try {
    const {
      seconds = 0,
      project_title = '',
      formatted_time = '00:00:00',
    } = req.body || {};

    if (typeof seconds !== 'number' || seconds <= 0 || seconds > 86400) {
      return res.status(400).json({ error: 'Session time must be between 1 second and 24 hours' });
    }

    const contract = db.prepare(`
      SELECT id FROM contracts WHERE freelancer_id = ? AND title = ? LIMIT 1
    `).get(req.user.id, String(project_title).trim());
    if (!contract) {
      return res.status(403).json({ error: 'Time can only be logged against one of your awarded contracts' });
    }

    const account = db.prepare('SELECT hourly_rate FROM users WHERE id = ?').get(req.user.id);
    const hourlyRate = Number(account?.hourly_rate || 0);

    const amountEarned = Number(((seconds / 3600) * hourlyRate).toFixed(2));
    const userId = req.user.id;
    const logId = `time-${Date.now()}`;

    db.prepare(`
      INSERT INTO time_logs (id, user_id, project_title, seconds, formatted_time, hourly_rate, amount_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(logId, userId, project_title, seconds, formatted_time, hourlyRate, amountEarned);

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
    const userId = req.user.id;
    const logs = db.prepare('SELECT * FROM time_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
    res.json(logs);
  } catch (err) {
    console.error('Fetch time logs error:', err);
    res.status(500).json({ error: 'Failed to fetch time logs' });
  }
});

app.get('/api/wallet', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.prepare('SELECT wallet_balance, escrow_balance FROM users WHERE id = ?').get(userId);
    const transactions = db.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 30').all(userId);

    res.json({
      walletBalance: user ? user.wallet_balance : 0,
      escrowBalance: user ? user.escrow_balance : 0,
      transactions,
    });
  } catch (err) {
    console.error('Wallet fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve wallet information' });
  }
});

app.post('/api/wallet/withdraw', authenticateToken, (req, res) => {
  res.status(503).json({ error: 'Payouts are not configured. No withdrawal or balance change was made.' });
});

// ==========================================
// 8. MESSAGES & THREADS (100% SQLite)
// ==========================================
app.get('/api/messages', authenticateToken, (req, res) => {
  try {
    const threads = db.prepare(`
      SELECT * FROM message_threads
      WHERE participant_id IS NOT NULL AND (owner_id = ? OR participant_id = ?)
      ORDER BY updated_at DESC
    `).all(req.user.id, req.user.id);
    const threadIds = new Set(threads.map((thread) => thread.id));
    const allMessages = db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all().filter((message) => threadIds.has(message.thread_id));

    const result = threads.map((tm) => {
      const msgs = allMessages.filter((m) => m.thread_id === tm.id);
      const last = msgs[msgs.length - 1];
      const otherUserId = tm.owner_id === req.user.id ? tm.participant_id : tm.owner_id;
      const otherUser = otherUserId ? db.prepare('SELECT * FROM users WHERE id = ?').get(otherUserId) : null;
      return {
        id: tm.id,
        user: {
          id: otherUser?.id || otherUserId || null,
          name: otherUser?.name || tm.user_name,
          role: otherUser?.title || tm.user_role,
          avatar: otherUser?.avatar || tm.user_avatar,
          online: Boolean(tm.user_online),
        },
        project: tm.project,
        lastMessage: last ? last.text : 'Conversation started',
        time: last ? last.time : 'Today',
        unread: tm.unread || 0,
        messages: msgs.map((message) => ({
          ...message,
          sender: message.sender_id ? (message.sender_id === req.user.id ? 'you' : 'them') : message.sender,
        })),
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
      recipientId,
      recipientRole = 'Verified Specialist',
      recipientAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    let targetThreadId = thread_id;

    // Look up or dynamically create thread when messaging from Find Talent / Profile
    if (targetThreadId) {
      const existingThread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(targetThreadId);
      if (!existingThread) return res.status(404).json({ error: 'Conversation not found' });
      if (existingThread.owner_id !== req.user.id && existingThread.participant_id !== req.user.id) {
        return res.status(403).json({ error: 'You do not have access to this conversation' });
      }
    }

    let recipientUser = null;
    if (!targetThreadId && (recipientId || recipientName)) {
      recipientUser = db.prepare(`
        SELECT u.* FROM users u
        WHERE u.id = ?
           OR u.id = (SELECT user_id FROM talents WHERE id = ?)
           OR lower(u.name) = lower(?)
        LIMIT 1
      `).get(recipientId || '', recipientId || '', (recipientName || '').trim());
      if (!recipientUser) return res.status(404).json({ error: 'The recipient must be a registered Workverse user' });
      if (recipientUser.id === req.user.id) return res.status(400).json({ error: 'You cannot message yourself' });

      const existingThread = db.prepare(`
        SELECT id FROM message_threads
        WHERE (owner_id = ? AND participant_id = ?) OR (owner_id = ? AND participant_id = ?)
        ORDER BY updated_at DESC LIMIT 1
      `).get(req.user.id, recipientUser.id, recipientUser.id, req.user.id);
      if (existingThread) {
        targetThreadId = existingThread.id;
      } else {
        targetThreadId = `thread-${Date.now()}`;
        db.prepare(`
          INSERT INTO message_threads (id, user_name, user_role, user_avatar, user_online, project, unread, owner_id, participant_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          targetThreadId,
          recipientUser.name,
          recipientUser.title || recipientRole,
          recipientUser.avatar || recipientAvatar,
          1,
          project,
          0,
          req.user.id,
          recipientUser.id
        );
      }
    }

    if (!targetThreadId) {
      return res.status(400).json({ error: 'Conversation or recipient is required' });
    }

    const thread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(targetThreadId);
    const notifyUserId = thread.owner_id === req.user.id ? thread.participant_id : thread.owner_id;

    const id = `msg-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    db.prepare(`
      INSERT INTO messages (id, thread_id, project, sender, text, time, sender_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, targetThreadId, project, 'you', text.trim(), timeStr, req.user.id);

    db.prepare("UPDATE message_threads SET updated_at = datetime('now') WHERE id = ?").run(targetThreadId);

    createNotification({
      userId: notifyUserId,
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
    const files = db.prepare(`
      SELECT DISTINCT f.id, f.name, f.size, f.type, f.uploaded_by, f.date, f.project,
        f.user_id, f.project_id, f.mime_type, f.created_at
      FROM files f
      LEFT JOIN projects p ON p.id = f.project_id
      LEFT JOIN contracts c ON c.title = p.title AND c.freelancer_id = ?
      WHERE f.content_base64 IS NOT NULL AND (f.user_id = ? OR p.client_id = ? OR c.id IS NOT NULL)
      ORDER BY f.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id);
    res.json(files);
  } catch (err) {
    console.error('Fetch files error:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.post('/api/files', authenticateToken, (req, res) => {
  try {
    const { name, size = 'Unknown', project = '', projectId, mimeType = 'application/octet-stream', contentBase64 } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'File name is required' });
    }
    if (!contentBase64 || typeof contentBase64 !== 'string') {
      return res.status(400).json({ error: 'Choose a real file to upload' });
    }
    if (contentBase64.length > 14 * 1024 * 1024) {
      return res.status(413).json({ error: 'File exceeds the 10 MB local upload limit' });
    }

    const targetProject = resolveProjectForUser(req.user.id, { projectId, projectTitle: project });
    if (!targetProject) return res.status(403).json({ error: 'Choose a project that belongs to your workspace' });

    const id = `f-${Date.now()}`;
    const type = name.endsWith('.pdf') ? 'pdf' : name.endsWith('.fig') ? 'figma' : 'archive';
    const uploadedBy = req.user ? req.user.name : 'You';

    db.prepare(`
      INSERT INTO files (id, name, size, type, uploaded_by, date, project, user_id, project_id, mime_type, content_base64)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), size, type, uploadedBy, 'Today', targetProject.title, req.user.id, targetProject.id, mimeType, contentBase64);

    const file = db.prepare(`SELECT id, name, size, type, uploaded_by, date, project, user_id, project_id, mime_type, created_at FROM files WHERE id = ?`).get(id);
    res.status(201).json({ success: true, file });
  } catch (err) {
    console.error('Upload file error:', err);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
});

app.get('/api/files/:id/download', authenticateToken, (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (!file.content_base64) return res.status(404).json({ error: 'This legacy file has no uploaded content' });
    if (file.user_id !== req.user.id && !canAccessProject(req.user.id, file.project_id)) {
      return res.status(403).json({ error: 'You do not have access to this file' });
    }
    const safeName = String(file.name).replace(/[\r\n"\\]/g, '_');
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.send(Buffer.from(file.content_base64, 'base64'));
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

app.delete('/api/files/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'File not found' });
    const project = existing.project_id ? db.prepare('SELECT client_id FROM projects WHERE id = ?').get(existing.project_id) : null;
    if (existing.user_id !== req.user.id && project?.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the uploader or project owner can delete this file' });
    }
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
    const team = db.prepare(`
      SELECT * FROM team_members
      WHERE (owner_id = ? AND (member_user_id IS NOT NULL OR email != '')) OR member_user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id, req.user.id);
    res.json(team);
  } catch (err) {
    console.error('Fetch team error:', err);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

app.post('/api/team', authenticateToken, requireRole('client'), (req, res) => {
  try {
    const { name, email, role = 'Contributor', project = '', projectId } = req.body || {};
    const memberName = name || (email ? email.split('@')[0] : null);
    if (!memberName) return res.status(400).json({ error: 'Email or name is required' });

    const targetProject = resolveProjectForUser(req.user.id, { projectId, projectTitle: project });
    if (!targetProject || targetProject.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can invite people to this project' });
    }
    const memberUser = email
      ? db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email.trim())
      : db.prepare('SELECT * FROM users WHERE lower(name) = lower(?)').get(memberName);

    const id = `tm-${Date.now()}`;
    db.prepare(`
      INSERT INTO team_members (id, name, role, project, status, hourly, avatar, permission, owner_id, member_user_id, email, project_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      memberName,
      role,
      targetProject.title,
      memberUser ? 'Active' : 'Invited',
      '$40/hr',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      'Editor',
      req.user.id,
      memberUser?.id || null,
      email?.trim().toLowerCase() || memberUser?.email || '',
      targetProject.id
    );

    if (memberUser) {
      createNotification({
        userId: memberUser.id,
        role: memberUser.role,
        type: 'team',
        title: `Added to ${targetProject.title}`,
        message: `${req.user.name} added you as ${role}.`,
        targetPage: 'projects',
        targetTab: 'team',
      });
    }

    const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
    res.status(201).json({ success: true, member });
  } catch (err) {
    console.error('Invite member error:', err);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

app.get('/api/payments', authenticateToken, (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT * FROM payments
      WHERE client_id = ? OR recipient_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id, req.user.id);
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
    if (payment.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client who funded this payment can release it' });
    }
    if (payment.status === 'Released') {
      return res.status(400).json({ error: 'Escrow payment has already been released' });
    }
    if (payment.status === 'Disputed') {
      return res.status(409).json({ error: 'This payment is frozen while an open dispute is reviewed' });
    }
    if (payment.status !== 'In Escrow' && payment.status !== 'Pending Approval') {
      return res.status(409).json({ error: 'This milestone has not been funded and cannot be released' });
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
      userId: payment.recipient_id,
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

app.get('/api/disputes', authenticateToken, (req, res) => {
  try {
    const disputes = db.prepare(`
      SELECT d.*, c.title AS contract_title
      FROM disputes d
      LEFT JOIN contracts c ON c.id = d.contract_id
      WHERE d.opened_by = ? OR d.against_user_id = ?
      ORDER BY d.created_at DESC
    `).all(req.user.id, req.user.id);
    res.json(disputes);
  } catch (err) {
    console.error('Fetch disputes error:', err);
    res.status(500).json({ error: 'Failed to load disputes' });
  }
});

app.post('/api/disputes', authenticateToken, (req, res) => {
  try {
    const { contractId, contractTitle, reason, notes = '' } = req.body || {};
    if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'Dispute reason is required' });
    const contract = contractId
      ? db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId)
      : db.prepare('SELECT * FROM contracts WHERE title = ? AND (client_id = ? OR freelancer_id = ?) ORDER BY created_at DESC LIMIT 1').get(contractTitle || '', req.user.id, req.user.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    if (contract.client_id !== req.user.id && contract.freelancer_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not a participant in this contract' });
    }
    const againstUserId = contract.client_id === req.user.id ? contract.freelancer_id : contract.client_id;
    const id = `dsp-${Date.now()}`;
    db.prepare(`
      INSERT INTO disputes (id, contract_id, opened_by, against_user_id, reason, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Open')
    `).run(id, contract.id, req.user.id, againstUserId, String(reason).trim(), String(notes).trim());
    db.prepare(`
      UPDATE payments SET status = 'Disputed'
      WHERE status != 'Released' AND project = ? AND (client_id = ? OR recipient_id = ?)
    `).run(contract.title, req.user.id, req.user.id);
    createNotification({
      userId: againstUserId,
      role: 'all',
      type: 'dispute',
      title: `Dispute opened: ${contract.title}`,
      message: String(reason).trim(),
      targetPage: 'projects',
      targetTab: 'settings',
    });
    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(id);
    res.status(201).json({ success: true, dispute });
  } catch (err) {
    console.error('Create dispute error:', err);
    res.status(500).json({ error: 'Failed to open dispute' });
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
    if (!planId || !['monthly', 'yearly'].includes(billingCycle)) return res.status(400).json({ error: 'A valid plan and billing cycle are required' });

    const plan = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ error: 'Selected plan does not exist' });

    if (planId !== 'free') return res.status(409).json({ error: 'Use demo checkout to select a paid tier.' });
    db.prepare("UPDATE users SET subscription_plan = 'free', billing_cycle = ?, subscription_status = 'inactive' WHERE id = ?").run(billingCycle, req.user.id);

    res.json({
      success: true,
      planId,
      billingCycle,
      message: 'Free plan is active. No payment was taken.',
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to update subscription plan' });
  }
});

app.get('/api/billing/config', (req, res) => {
  res.json({ provider: 'demo', configured: true, currency: 'USD', simulation: true });
});

app.post('/api/billing/checkout', authenticateToken, (req, res) => {
  const { planId, billingCycle = 'monthly', paymentMethod } = req.body || {};
  if (!['pro', 'team', 'business'].includes(planId) || !['monthly', 'yearly'].includes(billingCycle) || paymentMethod !== 'demo_card') {
    return res.status(400).json({ error: 'Choose a paid plan, billing cycle, and demo card' });
  }
  try {
    const plan = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    const monthlyUsd = billingCycle === 'yearly' ? plan.price_usd_yearly : plan.price_usd_monthly;
    const amountCents = monthlyUsd * (billingCycle === 'yearly' ? 12 : 1) * 100;
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return res.status(500).json({ error: 'Plan price is unavailable' });
    const receipt = { id: `demo-${randomUUID()}`, userId: req.user.id, planId, billingCycle, amountCents, currency: 'USD', status: 'simulated' };
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('INSERT INTO demo_payments (id, user_id, plan_id, billing_cycle, amount_cents, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(receipt.id, receipt.userId, receipt.planId, receipt.billingCycle, receipt.amountCents, receipt.currency, receipt.status);
      db.prepare("UPDATE users SET subscription_plan = ?, billing_cycle = ?, subscription_status = 'demo_active' WHERE id = ?")
        .run(planId, billingCycle, req.user.id);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    res.status(201).json({ success: true, simulation: true, receipt, message: `${plan.name} demo plan activated. No real payment was made.` });
  } catch (err) {
    console.error('Demo checkout error:', err);
    res.status(500).json({ error: 'Could not complete demo checkout' });
  }
});

app.get('/api/billing/receipts', authenticateToken, (req, res) => {
  const receipts = db.prepare('SELECT id, plan_id AS planId, billing_cycle AS billingCycle, amount_cents AS amountCents, currency, status, created_at AS createdAt FROM demo_payments WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(req.user.id);
  res.json(receipts);
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
    const userId = req.user.id;
    const { type } = req.query;
    let rows = db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').all(userId);
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
    const userId = req.user.id;
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
      .prepare(`SELECT t.* FROM talents t JOIN users u ON u.id = t.user_id AND u.role = 'freelancer'`)
      .all()
      .map(formatTalentRow)
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.skills.some((s) => s.toLowerCase().includes(q)));

    const projects = db
      .prepare(`SELECT p.* FROM projects p JOIN users u ON u.id = p.client_id AND u.role = 'client'`)
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
  const activeUserId = req.user.id;
  const activeRole = req.user.role;
  return { activeUserId, activeRole };
}

app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const { activeUserId, activeRole } = resolveNotificationScope(req);
    const rows = db
      .prepare(
        `SELECT * FROM notifications
         WHERE user_id = ? AND (role = ? OR role = 'all')
         ORDER BY created_at DESC, rowid DESC
         LIMIT 40`
      )
      .all(activeUserId, activeRole);

    const unreadRow = db
      .prepare(
        `SELECT COUNT(*) as count FROM notifications
         WHERE is_read = 0 AND user_id = ? AND (role = ? OR role = 'all')`
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
       WHERE is_read = 0 AND user_id = ? AND (role = ? OR role = 'all')`
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
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this notification' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    const { activeUserId, activeRole } = resolveNotificationScope(req);
    const unreadRow = db
      .prepare(
        `SELECT COUNT(*) as count FROM notifications
         WHERE is_read = 0 AND user_id = ? AND (role = ? OR role = 'all')`
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
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this notification' });
    }
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ==========================================
// 10C. WORKSPACE DATA EXPORT & IMPORT
// ==========================================
app.get('/api/workspace/export', authenticateToken, (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all().map(formatProjectRow).filter((project) => canAccessProject(req.user.id, project.id));
    const projectIds = new Set(projects.map((project) => project.id));
    const kanbanTasks = db.prepare('SELECT * FROM kanban_tasks ORDER BY created_at DESC').all().filter((task) => task.user_id === req.user.id || projectIds.has(task.project_id));
    const contracts = db.prepare('SELECT * FROM contracts WHERE client_id = ? OR freelancer_id = ? ORDER BY created_at DESC').all(req.user.id, req.user.id).map(formatContractRow);
    const proposals = db.prepare(`SELECT pr.* FROM proposals pr LEFT JOIN projects p ON p.id = pr.project_id WHERE pr.candidate_id = ? OR p.client_id = ? ORDER BY pr.created_at DESC`).all(req.user.id, req.user.id).map(formatProposalRow);
    const files = db.prepare('SELECT * FROM files ORDER BY created_at DESC').all().filter((file) => file.user_id === req.user.id || projectIds.has(file.project_id));

    res.json({
      platform: 'Workverse',
      version: '1.4.0',
      exportedAt: new Date().toISOString(),
      summary: {
        projectsCount: projects.length,
        tasksCount: kanbanTasks.length,
        contractsCount: contracts.length,
        proposalsCount: proposals.length,
        filesCount: files.length,
      },
      data: {
        projects,
        kanbanTasks,
        contracts,
        proposals,
        files,
      },
    });
  } catch (err) {
    console.error('Workspace export error:', err);
    res.status(500).json({ error: 'Failed to export workspace data' });
  }
});

// ==========================================
// 10E. FINANCIAL TRANSACTIONS & ESCROW CSV EXPORT
// ==========================================
app.get('/api/finances/export', authenticateToken, (req, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const payments = db.prepare('SELECT * FROM payments WHERE client_id = ? OR recipient_id = ? ORDER BY created_at DESC').all(req.user.id, req.user.id);

    function escapeCsv(val) {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const rows = [];
    rows.push(['Section', 'Record ID', 'Date', 'Entity / Recipient', 'Type / Milestone', 'Amount ($)', 'Status', 'Method / Reference Note'].map(escapeCsv).join(','));

    for (const tx of transactions) {
      rows.push([
        'Wallet Transaction',
        tx.id,
        tx.created_at || 'N/A',
        tx.user_id || 'System',
        tx.type || 'Transfer',
        Number(tx.amount || 0).toFixed(2),
        tx.status || 'Completed',
        `${tx.method || 'General'} - ${tx.note || ''}`,
      ].map(escapeCsv).join(','));
    }

    for (const p of payments) {
      rows.push([
        'Escrow Payment',
        p.id,
        p.date || p.created_at || 'N/A',
        p.recipient || 'Contractor',
        `${p.milestone} (${p.project})`,
        String(p.amount || '0').replace(/[^0-9.]/g, ''),
        p.status || 'Pending',
        p.escrow_protected ? 'Escrow Protected' : 'Direct',
      ].map(escapeCsv).join(','));
    }

    const csvContent = rows.join('\r\n');
    const filename = `workverse-financial-ledger-${Date.now()}.csv`;

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    logAuditEvent({
      userId: req.user ? req.user.id : 'anonymous',
      action: 'finance.export_csv',
      entityType: 'report',
      entityId: filename,
      details: `Financial ledger exported with ${transactions.length} transactions and ${payments.length} escrow payments`,
      ip,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Financial export error:', err);
    res.status(500).json({ error: 'Failed to generate financial export' });
  }
});

// ==========================================
// 10D. COMPLIANCE AUDIT LOGGING
// ==========================================
app.get('/api/audit-logs', authenticateToken, (req, res) => {
  try {
    const { action, entity_type, limit = 50 } = req.query;
    let query = 'SELECT * FROM audit_logs WHERE user_id = ?';
    const params = [req.user.id];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (entity_type) {
      query += ' AND entity_type = ?';
      params.push(entity_type);
    }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Math.min(parseInt(limit, 10) || 50, 200));

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

app.post('/api/audit-logs', authenticateToken, (req, res) => {
  try {
    const { action, entity_type, entity_id, details } = req.body || {};
    if (!action || !entity_type) {
      return res.status(400).json({ error: 'Action and entity_type are required' });
    }
    const userId = req.user ? req.user.id : 'anonymous';
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const id = logAuditEvent({
      userId,
      action,
      entityType: entity_type,
      entityId: entity_id || null,
      details: details || null,
      ip,
    });
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('Create audit log error:', err);
    res.status(500).json({ error: 'Failed to log audit event' });
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

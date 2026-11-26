const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { avatarUrl, inferAvatarStyle, isLegacyDefaultAvatar } = require('./avatar');

const dbPath = process.env.WORKVERSE_DB_PATH
  ? path.resolve(process.env.WORKVERSE_DB_PATH)
  : path.resolve(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency & integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Safe helper to add missing columns when upgrading existing SQLite databases
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// ==========================================
// 1. SCHEMA INITIALIZATION
// ==========================================
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',
  title TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  wallet_balance REAL DEFAULT 0.00,
  escrow_balance REAL DEFAULT 0.00,
  hourly_rate REAL DEFAULT 45.00,
  subscription_plan TEXT DEFAULT 'free',
  billing_cycle TEXT DEFAULT 'monthly',
  subscription_status TEXT DEFAULT 'inactive',
  workspace_name TEXT DEFAULT 'Workverse Ventures',
  billing_email TEXT DEFAULT '',
  auto_escrow_release INTEGER DEFAULT 1,
  two_factor_auth INTEGER DEFAULT 1,
  email_digest TEXT DEFAULT 'Daily',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  budget TEXT,
  budget_min INTEGER DEFAULT 0,
  budget_max INTEGER DEFAULT 0,
  budget_type TEXT DEFAULT 'Fixed Price',
  duration TEXT,
  skills TEXT DEFAULT '[]',
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'In Progress',
  progress INTEGER DEFAULT 0,
  deadline TEXT,
  client_id TEXT,
  client_name TEXT,
  client_rating REAL DEFAULT 5.0,
  thumbnail TEXT,
  team TEXT DEFAULT '[]',
  team_extra INTEGER DEFAULT 0,
  type TEXT DEFAULT 'dev',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS talents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT,
  verified INTEGER DEFAULT 1,
  available INTEGER DEFAULT 1,
  avatar TEXT,
  cover_image TEXT,
  rating REAL DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 0,
  hourly_rate REAL DEFAULT 40.00,
  location TEXT DEFAULT 'Remote',
  experience TEXT DEFAULT '5+ Years Exp.',
  job_success TEXT DEFAULT '98%',
  completed_projects INTEGER DEFAULT 0,
  category TEXT DEFAULT 'Development',
  experience_level TEXT DEFAULT 'Intermediate',
  about TEXT,
  skills TEXT DEFAULT '[]',
  badges TEXT DEFAULT '[]',
  portfolio TEXT DEFAULT '[]',
  work_history TEXT DEFAULT '[]',
  reviews TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kanban_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  project TEXT NOT NULL,
  title TEXT NOT NULL,
  column TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'Medium',
  estimate TEXT DEFAULT '4 hrs',
  assignee TEXT,
  assignee_name TEXT,
  assignee_role TEXT,
  subtasks TEXT,
  user_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_avatar TEXT,
  type TEXT DEFAULT 'Hourly',
  rate TEXT,
  weekly_limit TEXT,
  total_earned TEXT,
  escrow_locked TEXT,
  current_milestone TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'In Progress',
  progress INTEGER DEFAULT 0,
  milestones_count TEXT,
  thumbnail TEXT,
  freelancer_id TEXT,
  client_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  project_title TEXT NOT NULL,
  candidate_id TEXT,
  candidate_name TEXT NOT NULL,
  candidate_title TEXT,
  candidate_avatar TEXT,
  candidate_rating REAL DEFAULT 5.0,
  candidate_reviews INTEGER DEFAULT 0,
  bid_amount TEXT NOT NULL,
  duration TEXT,
  status TEXT DEFAULT 'In Review',
  submitted_date TEXT,
  pitch TEXT,
  client_name TEXT,
  client_avatar TEXT,
  cover_letter TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_role TEXT DEFAULT 'Specialist',
  user_avatar TEXT,
  user_online INTEGER DEFAULT 1,
  project TEXT DEFAULT 'General Collaboration',
  unread INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  project TEXT NOT NULL,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  type TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  date TEXT NOT NULL,
  project TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  project TEXT NOT NULL,
  status TEXT NOT NULL,
  hourly TEXT NOT NULL,
  avatar TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  milestone TEXT NOT NULL,
  project TEXT NOT NULL,
  recipient TEXT NOT NULL,
  recipient_id TEXT,
  amount TEXT NOT NULL,
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  escrow_protected INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS time_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_title TEXT NOT NULL,
  seconds INTEGER NOT NULL,
  formatted_time TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  amount_earned REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  icon TEXT,
  badge TEXT,
  price_monthly INTEGER DEFAULT 0,
  price_yearly INTEGER DEFAULT 0,
  price_symbol TEXT DEFAULT '₹',
  price_usd_monthly INTEGER DEFAULT 0,
  price_usd_yearly INTEGER DEFAULT 0,
  period TEXT DEFAULT '/month',
  button_text TEXT,
  button_variant TEXT,
  highlighted INTEGER DEFAULT 0,
  features TEXT DEFAULT '[]',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS demo_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'simulated',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  category TEXT,
  read_time TEXT,
  date TEXT,
  author_name TEXT,
  author_avatar TEXT,
  image TEXT,
  featured INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  content TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'all',
  role TEXT DEFAULT 'all',
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_page TEXT DEFAULT 'projects',
  target_tab TEXT DEFAULT '',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  contract_id TEXT,
  opened_by TEXT NOT NULL,
  against_user_id TEXT,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Upgrade existing tables if database.sqlite came from an earlier version
ensureColumn('users', 'subscription_plan', "TEXT DEFAULT 'free'");
ensureColumn('users', 'subscription_status', "TEXT DEFAULT 'inactive'");
ensureColumn('users', 'billing_cycle', "TEXT DEFAULT 'monthly'");
ensureColumn('users', 'workspace_name', "TEXT DEFAULT 'Workverse Ventures'");
ensureColumn('users', 'billing_email', "TEXT DEFAULT ''");
ensureColumn('users', 'auto_escrow_release', 'INTEGER DEFAULT 1');
ensureColumn('users', 'two_factor_auth', 'INTEGER DEFAULT 1');
ensureColumn('users', 'email_digest', "TEXT DEFAULT 'Daily'");

ensureColumn('projects', 'budget_min', 'INTEGER DEFAULT 0');
ensureColumn('projects', 'budget_max', 'INTEGER DEFAULT 0');
ensureColumn('projects', 'featured', 'INTEGER DEFAULT 0');
ensureColumn('projects', 'team_extra', 'INTEGER DEFAULT 0');
ensureColumn('projects', 'type', "TEXT DEFAULT 'dev'");

// User/workspace ownership added in v1.6. These columns intentionally use
// additive migrations so existing local databases keep working.
ensureColumn('message_threads', 'owner_id', 'TEXT');
ensureColumn('message_threads', 'participant_id', 'TEXT');
ensureColumn('messages', 'sender_id', 'TEXT');
ensureColumn('files', 'user_id', 'TEXT');
ensureColumn('files', 'project_id', 'TEXT');
ensureColumn('files', 'mime_type', "TEXT DEFAULT 'application/octet-stream'");
ensureColumn('files', 'content_base64', 'TEXT');
ensureColumn('team_members', 'owner_id', 'TEXT');
ensureColumn('team_members', 'member_user_id', 'TEXT');
ensureColumn('team_members', 'email', "TEXT DEFAULT ''");
ensureColumn('team_members', 'project_id', 'TEXT');
ensureColumn('payments', 'client_id', 'TEXT');
ensureColumn('payments', 'project_id', 'TEXT');

// Scope legacy demo records to the demo workspaces instead of exposing them to
// every newly registered account.
db.exec(`
  UPDATE message_threads SET owner_id = COALESCE(owner_id, 'usr-client-1');
  UPDATE message_threads
  SET participant_id = COALESCE(
    participant_id,
    (SELECT u.id FROM users u WHERE lower(u.name) = lower(message_threads.user_name) LIMIT 1)
  );
  UPDATE messages
  SET sender_id = COALESCE(
    sender_id,
    CASE
      WHEN sender = 'you' THEN (SELECT owner_id FROM message_threads t WHERE t.id = messages.thread_id)
      ELSE (SELECT participant_id FROM message_threads t WHERE t.id = messages.thread_id)
    END
  );
  UPDATE files
  SET project_id = COALESCE(
        project_id,
        (SELECT p.id FROM projects p WHERE lower(p.title) = lower(files.project) LIMIT 1)
      ),
      user_id = COALESCE(
        user_id,
        (SELECT u.id FROM users u WHERE lower(u.name) = lower(files.uploaded_by) LIMIT 1),
        'usr-client-1'
      );
  UPDATE team_members
  SET project_id = COALESCE(
        project_id,
        (SELECT p.id FROM projects p WHERE lower(p.title) = lower(team_members.project) LIMIT 1)
      ),
      owner_id = COALESCE(
        (SELECT p.client_id FROM projects p WHERE p.id = team_members.project_id LIMIT 1),
        owner_id,
        'usr-client-1'
      ),
      member_user_id = COALESCE(
        member_user_id,
        (SELECT u.id FROM users u WHERE lower(u.name) = lower(team_members.name) LIMIT 1)
      );
  UPDATE payments
  SET project_id = COALESCE(
        project_id,
        (SELECT p.id FROM projects p WHERE lower(p.title) = lower(payments.project) LIMIT 1)
      ),
      client_id = COALESCE(
        (SELECT p.client_id FROM projects p WHERE p.id = payments.project_id LIMIT 1),
        client_id,
        'usr-client-1'
      );
  UPDATE notifications
  SET user_id = CASE
    WHEN user_id = 'all' AND role = 'client' THEN 'usr-client-1'
    WHEN user_id = 'all' AND role = 'freelancer' THEN 'usr-freelancer-1'
    ELSE user_id
  END;
`);

// High-Performance Query & Foreign Key Indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_name);
  CREATE INDEX IF NOT EXISTS idx_kanban_column ON kanban_tasks("column");
  CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
  CREATE INDEX IF NOT EXISTS idx_proposals_candidate_id ON proposals(candidate_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_freelancer_id ON contracts(freelancer_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_client_name ON contracts(client_name);
  CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
  CREATE INDEX IF NOT EXISTS idx_message_threads_owner ON message_threads(owner_id, participant_id);
  CREATE INDEX IF NOT EXISTS idx_files_project_user ON files(project_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_team_owner_project ON team_members(owner_id, project_id);
  CREATE INDEX IF NOT EXISTS idx_payments_recipient ON payments(recipient);
  CREATE INDEX IF NOT EXISTS idx_payments_client_project ON payments(client_id, project_id);
  CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON wallet_transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id, item_type);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_disputes_users ON disputes(opened_by, against_user_id);
`);

// ==========================================
// 2. IDEMPOTENT PER-TABLE SEEDING
// ==========================================
function seedDatabase() {
  const shouldSeedDemo = process.env.WORKVERSE_SEED_DEMO_DATA === 'true';
  const passwordHash = bcrypt.hashSync('password123', 10);

  // 2.1 Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (shouldSeedDemo && userCount === 0) {
    console.log('Seeding real user accounts...');
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password, role, title, avatar, wallet_balance, escrow_balance, hourly_rate, billing_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'usr-freelancer-1',
      'Arjun Mehta',
      'arjun@workverse.io',
      passwordHash,
      'freelancer',
      'Senior Full Stack & Cloud Architect',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
      4250.00,
      8900.00,
      45.00,
      'arjun@workverse.io'
    );

    insertUser.run(
      'usr-client-1',
      'Sarah Jenkins',
      'sarah@cloudscale.ai',
      passwordHash,
      'client',
      'VP Engineering & Founder, CloudScale AI',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
      18500.00,
      3200.00,
      0.00,
      'finance@cloudscale.ai'
    );
  }

  // 2.2 Seed Talents Directory
  const talentCount = db.prepare('SELECT COUNT(*) as count FROM talents').get().count;
  if (shouldSeedDemo && talentCount === 0) {
    console.log('Seeding verified talents roster into SQLite...');
    const insertTalent = db.prepare(`
      INSERT INTO talents (
        id, user_id, name, title, role, verified, available, avatar, cover_image,
        rating, reviews_count, hourly_rate, location, experience, job_success,
        completed_projects, category, experience_level, about, skills, badges,
        portfolio, work_history, reviews
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedTalents = [
      {
        id: 'arjun-mehta',
        user_id: 'usr-freelancer-1',
        name: 'Arjun Mehta',
        title: 'Full Stack Developer',
        role: 'Senior Full Stack & Cloud Architect',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
        rating: 4.9,
        reviews_count: 128,
        hourly_rate: 35,
        location: 'San Francisco, CA (Remote)',
        experience: '8+ Years Exp.',
        job_success: '99%',
        completed_projects: 142,
        category: 'Development',
        experience_level: 'Expert',
        about: 'Passionate full stack engineer with over 8 years of production experience building high-scale SaaS architectures, resilient microservices, and slick, responsive user interfaces. Specializing in React, Next.js, TypeScript, Node.js, and distributed cloud infrastructure on GCP and AWS.',
        skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'GraphQL', 'Docker', 'GCP'],
        badges: ['Top Rated Plus', 'Verified Talent', 'Fast Responder'],
        portfolio: [
          { id: 'p1', title: 'Nexus Analytics SaaS Dashboard', category: 'Web App & Dashboard', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', description: 'Real-time telemetry and revenue forecasting dashboard serving 250K+ daily active events.', tech: ['Next.js', 'TypeScript', 'Tailwind', 'Tremor'] },
          { id: 'p2', title: 'Lumina FinTech Mobile App', category: 'FinTech Platform', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80', description: 'Multi-currency digital wallet and automated wealth advisory web client.', tech: ['React', 'Node.js', 'GraphQL', 'Stripe'] },
          { id: 'p3', title: 'Orbital 3D Product Configurator', category: 'WebGL Experience', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', description: 'Interactive high-fidelity 3D architectural visualizer with realistic PBR materials.', tech: ['Three.js', 'WebGL', 'React Three Fiber', 'GLSL'] },
        ],
        work_history: [
          { role: 'Principal Frontend Engineer', company: 'Veloce Systems', period: '2023 - Present', description: 'Architected next-generation enterprise workspace platform reducing page load by 62%.' },
          { role: 'Senior Full Stack Developer', company: 'Hyperion Labs', period: '2020 - 2023', description: 'Led a squad of 8 engineers delivering mission-critical multi-tenant payment gateways.' },
          { role: 'Frontend Developer', company: 'Stratum Digital', period: '2017 - 2020', description: 'Designed component design systems and client web applications for Fortune 500 brands.' },
        ],
        reviews: [
          { id: 'r1', client: 'Sarah Jenkins', company: 'FinFlow Technologies', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', rating: 5, date: 'October 2026', text: 'Arjun is an absolute tour de force. His attention to micro-interactions and performance optimization turned our product from a prototype into an enterprise-grade experience. Completed ahead of schedule!' },
          { id: 'r2', client: 'David Miller', company: 'Aether Cloud', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', rating: 5, date: 'August 2026', text: 'Clean code, excellent architectural communication, and proactive problem solving. We will definitely be retaining Arjun for our upcoming Q1 roadmap.' },
        ],
      },
      {
        id: 'neha-sharma',
        name: 'Neha Sharma',
        title: 'UI/UX Designer',
        role: 'Lead Product & Interaction Designer',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
        rating: 4.8,
        reviews_count: 96,
        hourly_rate: 30,
        location: 'Austin, TX (Remote)',
        experience: '6+ Years Exp.',
        job_success: '98%',
        completed_projects: 88,
        category: 'Design & Creative',
        experience_level: 'Intermediate',
        about: 'Product designer crafting intuitive, human-centric digital experiences with refined aesthetics. Expert in design systems, high-fidelity Figma prototyping, interaction micro-animations, and data-dense dashboards.',
        skills: ['Figma', 'UI Design', 'Prototyping', 'Design Systems', 'User Research', 'Mobile UX', 'Wireframing'],
        badges: ['Top Rated', 'Verified Designer', 'Design System Pro'],
        portfolio: [
          { id: 'np1', title: 'Kairo Mobile Banking Suite', category: 'iOS & Android App', image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80', description: 'End-to-end design system and 120+ screen user journey for neobank app.', tech: ['Figma', 'Protopie', 'Design System'] },
        ],
        work_history: [],
        reviews: [],
      },
      {
        id: 'rohit-verma',
        name: 'Rohit Verma',
        title: 'AI/ML Engineer',
        role: 'Senior Machine Learning Specialist',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        rating: 4.9,
        reviews_count: 144,
        hourly_rate: 50,
        location: 'Seattle, WA (Remote)',
        experience: '7+ Years Exp.',
        job_success: '100%',
        completed_projects: 110,
        category: 'Data & Analytics',
        experience_level: 'Expert',
        about: 'Machine learning practitioner specializing in LLM orchestration, fine-tuning, retrieval-augmented generation (RAG), and production model inference on GCP Vertex AI and PyTorch.',
        skills: ['Python', 'TensorFlow', 'LLM', 'PyTorch', 'LangChain', 'FastAPI', 'Vertex AI', 'Vector DBs'],
        badges: ['Top Rated Plus', 'Verified AI Expert'],
        portfolio: [
          { id: 'rp1', title: 'Cognitive Enterprise Search RAG', category: 'AI Pipeline', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', description: 'Semantic vector search engine processing 10M+ internal corporate records.', tech: ['Python', 'LangChain', 'ChromaDB', 'FastAPI'] },
        ],
        work_history: [],
        reviews: [],
      },
      {
        id: 'aisha-patel',
        name: 'Aisha Patel',
        title: 'Brand & Visual Identity Designer',
        role: 'Creative Director',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
        rating: 5.0,
        reviews_count: 82,
        hourly_rate: 45,
        location: 'London, UK (Remote)',
        experience: '9+ Years Exp.',
        job_success: '100%',
        completed_projects: 95,
        category: 'Design & Creative',
        experience_level: 'Expert',
        about: 'Translating brand visions into memorable identities, typographic guidelines, and modern web presence.',
        skills: ['Branding', 'Typography', 'Figma', 'Art Direction', 'Illustrator', 'Motion Design'],
        badges: ['Top Rated', 'Verified Creative'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
      {
        id: 'marcus-vance',
        name: 'Marcus Vance',
        title: 'DevOps & Cloud Architect',
        role: 'Infrastructure & Kubernetes Lead',
        verified: 1,
        available: 0,
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
        rating: 4.9,
        reviews_count: 112,
        hourly_rate: 60,
        location: 'Berlin, Germany (Remote)',
        experience: '10+ Years Exp.',
        job_success: '99%',
        completed_projects: 130,
        category: 'Development',
        experience_level: 'Expert',
        about: 'Automating multi-cloud CI/CD, Kubernetes clusters, and zero-downtime infrastructure at scale.',
        skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'GCP', 'CI/CD', 'GitHub Actions'],
        badges: ['Top Rated Plus', 'Cloud Certified'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
      {
        id: 'elena-rostova',
        name: 'Elena Rostova',
        title: 'Growth Marketing & SEO Specialist',
        role: 'Growth Strategist',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=80',
        rating: 4.8,
        reviews_count: 75,
        hourly_rate: 38,
        location: 'Toronto, Canada (Remote)',
        experience: '5+ Years Exp.',
        job_success: '97%',
        completed_projects: 70,
        category: 'Marketing',
        experience_level: 'Intermediate',
        about: 'Data-driven growth marketing, content engine development, and technical SEO scaling SaaS organic traffic.',
        skills: ['SEO', 'Content Strategy', 'Google Analytics', 'A/B Testing', 'Copywriting', 'Conversion Optimization'],
        badges: ['Top Rated', 'Verified Marketer'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
      {
        id: 'sofia-lindqvist',
        name: 'Sofia Lindqvist',
        title: 'Lead UX Researcher & Interaction Designer',
        role: 'Principal UX Architect',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
        rating: 4.95,
        reviews_count: 88,
        hourly_rate: 48,
        location: 'Stockholm, Sweden (Remote)',
        experience: '7+ Years Exp.',
        job_success: '100%',
        completed_projects: 82,
        category: 'Design & Creative',
        experience_level: 'Expert',
        about: 'Specialist in deep user research, information architecture, complex workflow design, and design systems with Scandinavian minimalism.',
        skills: ['User Research', 'Figma', 'Design Systems', 'Usability Testing', 'Information Architecture', 'Prototyping'],
        badges: ['Top Rated Plus', 'Verified Design Lead'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
      {
        id: 'daniel-kim',
        name: 'Daniel Kim',
        title: '3D WebGL & Creative Developer',
        role: 'Senior Creative Technologist',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
        rating: 4.92,
        reviews_count: 64,
        hourly_rate: 55,
        location: 'Seoul / San Francisco (Remote)',
        experience: '6+ Years Exp.',
        job_success: '99%',
        completed_projects: 56,
        category: 'Development',
        experience_level: 'Expert',
        about: 'Crafting award-winning WebGL interactive 3D web experiences, shaders, Three.js animations, and GPU-accelerated web apps.',
        skills: ['Three.js', 'WebGL', 'GLSL', 'React Three Fiber', 'GSAP', 'TypeScript', 'Tailwind'],
        badges: ['Top Rated', 'Awwwards Winner', 'Verified 3D Artist'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
      {
        id: 'priya-sengupta',
        name: 'Priya Sengupta',
        title: 'Cloud Security & Smart Contract Auditor',
        role: 'Staff Security Engineer',
        verified: 1,
        available: 0,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        rating: 5.0,
        reviews_count: 92,
        hourly_rate: 65,
        location: 'Bangalore, India (Remote)',
        experience: '8+ Years Exp.',
        job_success: '100%',
        completed_projects: 78,
        category: 'Data & Analytics',
        experience_level: 'Expert',
        about: 'SOC-2 compliance, penetration testing, smart contract security audits, and zero-trust cloud network architecture.',
        skills: ['Cybersecurity', 'Solidity Audit', 'Penetration Testing', 'GCP Security', 'Rust', 'Compliance'],
        badges: ['Top Rated Plus', 'Certified Ethical Hacker'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
      {
        id: 'liam-oconnor',
        name: 'Liam O’Connor',
        title: 'Mobile iOS & Flutter Lead',
        role: 'Principal Mobile Architect',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
        rating: 4.88,
        reviews_count: 104,
        hourly_rate: 42,
        location: 'Dublin, Ireland (Remote)',
        experience: '7+ Years Exp.',
        job_success: '98%',
        completed_projects: 115,
        category: 'Development',
        experience_level: 'Expert',
        about: 'Building high-performance iOS Swift and cross-platform Flutter applications with butter-smooth 120fps animations and offline-first syncing.',
        skills: ['Swift', 'iOS', 'Flutter', 'Dart', 'SwiftUI', 'Firebase', 'GraphQL'],
        badges: ['Top Rated', 'Verified Mobile Lead'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
      {
        id: 'maya-lin',
        name: 'Maya Lin',
        title: 'Art Director & Brand Strategist',
        role: 'Design Director',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
        rating: 4.96,
        reviews_count: 71,
        hourly_rate: 52,
        location: 'Tokyo, Japan (Remote)',
        experience: '9+ Years Exp.',
        job_success: '100%',
        completed_projects: 64,
        category: 'Design & Creative',
        experience_level: 'Expert',
        about: 'Directing visual narrative, editorial typography, brand design guidelines, and cohesive multi-touchpoint design experiences for venture-backed startups.',
        skills: ['Art Direction', 'Typography', 'Figma', 'Visual Identity', 'Brand Guidelines', 'Editorial Design'],
        badges: ['Top Rated Plus', 'Verified Design Director'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
      {
        id: 'alex-thorne',
        name: 'Alex Thorne',
        title: 'Distributed Systems & Go Engineer',
        role: 'Staff Backend Architect',
        verified: 1,
        available: 1,
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=500&q=80',
        cover_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
        rating: 4.94,
        reviews_count: 119,
        hourly_rate: 58,
        location: 'New York, NY (Remote)',
        experience: '11+ Years Exp.',
        job_success: '99%',
        completed_projects: 140,
        category: 'Development',
        experience_level: 'Expert',
        about: 'Specialized in ultra-low latency event streaming, Kafka, Go microservices, distributed consensus protocols, and PostgreSQL query optimization.',
        skills: ['Go', 'Kafka', 'PostgreSQL', 'Redis', 'gRPC', 'Distributed Systems', 'Kubernetes'],
        badges: ['Top Rated Plus', 'Verified Staff Architect'],
        portfolio: [],
        work_history: [],
        reviews: [],
      },
    ];

    for (const t of seedTalents) {
      insertTalent.run(
        t.id,
        t.user_id || null,
        t.name,
        t.title,
        t.role,
        t.verified,
        t.available,
        t.avatar,
        t.cover_image,
        t.rating,
        t.reviews_count,
        t.hourly_rate,
        t.location,
        t.experience,
        t.job_success,
        t.completed_projects,
        t.category,
        t.experience_level,
        t.about,
        JSON.stringify(t.skills),
        JSON.stringify(t.badges),
        JSON.stringify(t.portfolio),
        JSON.stringify(t.work_history),
        JSON.stringify(t.reviews)
      );
    }
  }

  // 2.3 Seed Projects
  const projCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  if (shouldSeedDemo && projCount === 0) {
    console.log('Seeding projects...');
    const insertProject = db.prepare(`
      INSERT INTO projects (id, title, category, description, budget, budget_min, budget_max, budget_type, duration, skills, featured, status, progress, deadline, client_id, client_name, client_rating, thumbnail, team, team_extra, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProject.run('proj-1', 'SaaS Dashboard Development', 'Web Development', 'Build a modern dashboard with analytics, telemetry visualization, role permissions, and user management.', '$1,200 – $1,800', 1200, 1800, 'Fixed Price', '3 - 4 Weeks', JSON.stringify(['Next.js', 'TypeScript', 'Tailwind', 'Tremor']), 1, 'In Progress', 65, 'Nov 12, 2026', 'usr-client-1', 'Starlight Ventures', 4.9, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', JSON.stringify([{ name: 'Arjun M.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' }, { name: 'Neha S.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80' }, { name: 'Rohit V.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' }]), 2, 'dev');
    insertProject.run('proj-2', 'E-commerce Platform (Full Stack)', 'Web Development', 'Build a scalable e-commerce platform with payment integration, order management, and responsive admin panel.', '$2,000 – $3,500', 2000, 3500, 'Fixed Price', '3 - 4 Weeks', JSON.stringify(['Next.js', 'Node.js', 'MongoDB', 'Stripe']), 0, 'In Progress', 40, 'Nov 24, 2026', 'usr-client-2', 'Velvet Goods Co.', 4.8, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', JSON.stringify([{ name: 'Arjun M.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' }]), 1, 'dev');
    insertProject.run('proj-3', 'Brand Website & UI Design', 'UI/UX Design', 'Design a modern, responsive brand website with a premium UI, editorial typography, and smooth micro-interactions.', '$800 – $1,200', 800, 1200, 'Fixed Price', '1 - 2 Weeks', JSON.stringify(['Figma', 'UI/UX', 'Motion', 'Prototyping']), 0, 'In Review', 100, 'Nov 18, 2026', 'usr-client-3', 'Nordic Living Studio', 5.0, 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80', JSON.stringify([{ name: 'Neha S.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80' }, { name: 'Aisha P.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80' }]), 1, 'design');
    insertProject.run('proj-4', 'UI/UX for FinTech Mobile App', 'UI/UX Design', 'Design a modern, user-friendly mobile app for a financial platform supporting crypto swaps and card payments.', '$800 – $1,200', 800, 1200, 'Fixed Price', '1 - 2 Weeks', JSON.stringify(['Figma', 'UI/UX', 'Mobile']), 0, 'In Progress', 85, 'Dec 02, 2026', 'usr-client-4', 'Apex Capital Inc.', 4.9, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80', JSON.stringify([{ name: 'Neha S.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80' }]), 0, 'design');
    insertProject.run('proj-5', 'Integrate AI Features into Existing Product', 'Data & AI', 'Add AI (GPT-based) features to our existing SaaS platform and improve overall user experience with smart suggestions.', '$40 – $60/hr', 40, 60, 'Hourly', 'Ongoing', JSON.stringify(['Python', 'OpenAI', 'FastAPI', 'LangChain']), 0, 'Planning', 0, 'Dec 15, 2026', 'usr-client-5', 'Cerebro Labs', 4.9, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', JSON.stringify([{ name: 'Rohit V.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' }]), 0, 'ai');
    insertProject.run('proj-6', 'Enterprise Kubernetes & Cloud Pipeline Migration', 'Web Development', 'Automate multi-region cluster deployment with Terraform, ArgoCD, and automated canary deployments.', '$3,000 – $5,000', 3000, 5000, 'Fixed Price', '4 - 6 Weeks', JSON.stringify(['Kubernetes', 'Docker', 'GCP', 'Terraform']), 0, 'Completed', 100, 'Completed Oct 2026', 'usr-client-6', 'Quantico Global', 5.0, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80', JSON.stringify([{ name: 'Marcus V.', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80' }]), 0, 'dev');
  } else {
    const metaUpdates = [
      { id: 'proj-1', min: 1200, max: 1800, feat: 1, extra: 2, type: 'dev' },
      { id: 'proj-2', min: 2000, max: 3500, feat: 0, extra: 1, type: 'dev' },
      { id: 'proj-3', min: 800, max: 1200, feat: 0, extra: 1, type: 'design' },
      { id: 'proj-4', min: 800, max: 1200, feat: 0, extra: 0, type: 'design' },
      { id: 'proj-5', min: 40, max: 60, feat: 0, extra: 0, type: 'ai' },
      { id: 'proj-6', min: 3000, max: 5000, feat: 0, extra: 0, type: 'dev' },
    ];
    const updProj = db.prepare('UPDATE projects SET budget_min = ?, budget_max = ?, featured = ?, team_extra = ?, type = ? WHERE id = ? AND budget_min = 0');
    for (const m of metaUpdates) {
      updProj.run(m.min, m.max, m.feat, m.extra, m.type, m.id);
    }
  }

  // 2.4 Seed Kanban Tasks
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM kanban_tasks').get().count === 0) {
    const insertTask = db.prepare(`
      INSERT INTO kanban_tasks (id, project_id, project, title, column, priority, estimate, assignee, assignee_name, assignee_role, subtasks, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTask.run('kb-1', 'proj-1', 'SaaS Dashboard Development', 'Architecture RFC & Token Sync', 'backlog', 'High', '8 hrs', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', 'Elena Rostova', 'Lead Architect', '3/4 done', 'usr-freelancer-1');
    insertTask.run('kb-2', 'proj-2', 'E-commerce Platform', 'Stripe Escrow Webhook Integration', 'backlog', 'Medium', '12 hrs', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', 'Marcus Vance', 'Backend Engineer', '1/3 done', 'usr-freelancer-1');
    insertTask.run('kb-3', 'proj-1', 'SaaS Dashboard Development', 'Core Telemetry & Analytics Charts', 'progress', 'High', '16 hrs', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', 'Arjun Mehta', 'Frontend Lead', '5/6 done', 'usr-freelancer-1');
    insertTask.run('kb-4', 'proj-2', 'E-commerce Platform', 'PostgreSQL Migration & Indexing', 'progress', 'Medium', '6 hrs', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', 'David Chen', 'DB Administrator', '2/2 done', 'usr-freelancer-1');
    insertTask.run('kb-5', 'proj-3', 'Brand Identity & Web', 'Mobile Responsive Audit & Tap Targets', 'review', 'Urgent', '4 hrs', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', 'Vinita Parmar', 'UX Specialist', '4/4 ready', 'usr-freelancer-1');
    insertTask.run('kb-6', 'proj-3', 'Brand Identity & Web', 'Design Tokens & UI Component Kit', 'done', 'High', '14 hrs', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', 'Vinita Parmar', 'UX Specialist', 'Completed', 'usr-freelancer-1');
    insertTask.run('kb-7', 'proj-1', 'SaaS Dashboard Development', 'Wireframes & User Flow Signoff', 'done', 'Medium', '10 hrs', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', 'Arjun Mehta', 'Frontend Lead', 'Approved', 'usr-freelancer-1');
  }

  // 2.5 Seed Contracts
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM contracts').get().count === 0) {
    const insertContract = db.prepare(`
      INSERT INTO contracts (id, title, client_name, client_company, client_avatar, type, rate, weekly_limit, total_earned, escrow_locked, current_milestone, deadline, status, progress, milestones_count, thumbnail, freelancer_id, client_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertContract.run('cnt-1', 'SaaS Dashboard Development', 'Sarah Jenkins', 'CloudScale AI', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', 'Hourly', '$45.00/hr', '40 hrs/wk', '$4,850.00', '$3,200.00', 'Phase 2: Core Telemetry & Analytics Charts', 'Nov 12, 2026', 'In Progress', 65, '4 of 6 approved', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80', 'usr-freelancer-1', 'usr-client-1');
    insertContract.run('cnt-2', 'PostgreSQL Migration & Index Optimization', 'Marcus Cole', 'FinTech Labs', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', 'Fixed Price', '$3,200.00', 'None', '$2,000.00', '$1,200.00', 'Milestone 3: Sharding & Query Optimization', 'Nov 20, 2026', 'In Progress', 70, '2 of 3 approved', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80', 'usr-freelancer-1', 'usr-client-2');
    insertContract.run('cnt-3', 'Design Tokens & UI Component Kit', 'Elena Woods', 'Studio Arc', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 'Hourly', '$50.00/hr', '20 hrs/wk', '$4,200.00', '$0.00', 'All Deliverables Signed Off', 'Oct 30, 2026', 'Completed', 100, '5 of 5 approved', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80', 'usr-freelancer-1', 'usr-client-3');
  }

  // 2.6 Seed Proposals
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM proposals').get().count === 0) {
    const insertProposal = db.prepare(`
      INSERT INTO proposals (id, project_id, project_title, candidate_id, candidate_name, candidate_title, candidate_avatar, candidate_rating, candidate_reviews, bid_amount, duration, status, submitted_date, pitch, client_name, client_avatar, cover_letter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertProposal.run('prop-1', 'proj-1', 'SaaS Dashboard Development', 'usr-freelancer-1', 'Arjun Mehta', 'Senior Full Stack & Cloud Architect', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 4.9, 128, '$1,650', '3 Weeks', 'Accepted', '2 hours ago', 'I have delivered 12+ high-concurrency analytics dashboards using Next.js 15, Tailwind, and Tremor.', 'Sarah Jenkins (CloudScale AI)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', 'Delivering interactive analytics widgets with React 19, Tailwind CSS, and Recharts. All milestone deliverables include comprehensive unit tests and automated escrow verification.');
    insertProposal.run('prop-2', 'proj-4', 'UI/UX for FinTech Mobile App', 'neha-sharma', 'Neha Sharma', 'Lead Product & Interaction Designer', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', 4.8, 96, '$1,100', '2 Weeks', 'In Review', 'Yesterday', 'Extensive background designing neobank mobile experiences and micro-interactions in Figma.', 'Apex Capital Inc.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', 'Conducting comprehensive touch target audit, accessibility color contrast compliance, and biometric auth flows.');
    insertProposal.run('prop-3', 'proj-5', 'Integrate AI Features into Existing Product', 'rohit-verma', 'Rohit Verma', 'Senior Machine Learning Specialist', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 4.9, 144, '$55/hr', 'Ongoing Sprint', 'Accepted', '3 days ago', 'Specialized in LangChain, Vertex AI, and vector retrieval. I will set up evaluation metrics, prompt guardrails, and low-latency streaming endpoints.', 'David Zhang (TechPulse)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 'Extensive background building streaming LLM interfaces, vector similarity search, and model fallback mechanisms with 99.9% uptime SLA.');
    insertProposal.run('prop-4', 'proj-3', 'Brand Website & UI Design', 'aisha-patel', 'Aisha Patel', 'Brand & Visual Identity Designer', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', 5.0, 82, '$950', '10 Days', 'Pending', '5 days ago', 'Crafting bespoke typography guidelines and architectural visual design for creative studios. Will provide Figma source files and responsive layout specs.', 'Nordic Living Studio', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', 'Full brand guidelines + Figma token kit + Webflow/React layout specifications.');
    insertProposal.run('prop-5', 'proj-2', 'E-commerce Platform (Full Stack)', 'alex-thorne', 'Alex Thorne', 'Staff Backend & Distributed Systems Architect', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80', 4.94, 119, '$2,800', '4 Weeks', 'Shortlisted', '6 days ago', 'Production experience with Stripe Checkout, webhook idempotency, high-throughput carts, and distributed inventory locks in PostgreSQL.', 'Velvet Goods Co.', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80', 'End-to-end backend architecture with PostgreSQL transactions, Redis cart cache, and Stripe webhook verification.');
  }

  // 2.7 Seed Message Threads & Messages
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM message_threads').get().count === 0) {
    const insertThread = db.prepare(`
      INSERT INTO message_threads (id, user_name, user_role, user_avatar, user_online, project, unread)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertThread.run('thread-1', 'Arjun Mehta', 'Full Stack Engineer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 1, 'SaaS Dashboard Development', 1);
    insertThread.run('thread-2', 'Neha Sharma', 'UI/UX Designer', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', 1, 'Brand Website & UI Design', 0);
    insertThread.run('thread-3', 'Rohit Verma', 'AI Specialist', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 0, 'Integrate AI Features', 0);
  }

  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM messages').get().count === 0) {
    const insertMessage = db.prepare(`
      INSERT INTO messages (id, thread_id, project, sender, text, time)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertMessage.run('m1', 'thread-1', 'SaaS Dashboard Development', 'them', 'Hey there! Just started work on the telemetry charts and authentication flow.', '10:15 AM');
    insertMessage.run('m2', 'thread-1', 'SaaS Dashboard Development', 'you', 'Awesome Arjun, let us know when the staging environment preview is ready.', '10:30 AM');
    insertMessage.run('m3', 'thread-1', 'SaaS Dashboard Development', 'them', 'I have pushed Milestone 1 PR to GitHub. The live telemetry charts are rendering smoothly!', '12:45 PM');
    insertMessage.run('m21', 'thread-2', 'Brand Website & UI Design', 'them', 'Figma prototype updated with responsive mobile breakpoints and design tokens.', 'Yesterday');
    insertMessage.run('m22', 'thread-2', 'Brand Website & UI Design', 'you', 'Reviewed the tokens, look gorgeous! Escrow for milestone 2 is approved.', 'Yesterday');
    insertMessage.run('m31', 'thread-3', 'Integrate AI Features', 'them', 'RAG retrieval latency dropped from 920ms down to 180ms with semantic caching.', 'Oct 30');
  }

  // 2.8 Seed Files
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM files').get().count === 0) {
    const insertFile = db.prepare(`
      INSERT INTO files (id, name, size, type, uploaded_by, date, project)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertFile.run('f-1', 'SaaS_Dashboard_Design_System_Tokens_v2.fig', '42.8 MB', 'figma', 'Neha Sharma', 'Nov 05, 2026', 'SaaS Dashboard Development');
    insertFile.run('f-2', 'Production_Release_Bundle_v1.0.4.tar.gz', '184.2 MB', 'archive', 'Arjun Mehta', 'Nov 04, 2026', 'SaaS Dashboard Development');
    insertFile.run('f-3', 'Milestone_1_Signoff_Escrow_Receipt.pdf', '1.2 MB', 'pdf', 'Workverse Escrow', 'Nov 02, 2026', 'E-commerce Platform');
    insertFile.run('f-4', 'OpenAI_RAG_Architecture_Benchmark_Report.pdf', '8.4 MB', 'pdf', 'Rohit Verma', 'Oct 30, 2026', 'Integrate AI Features');
    insertFile.run('f-5', 'Brand_Identity_Typography_Guidelines.pdf', '15.6 MB', 'pdf', 'Aisha Patel', 'Oct 28, 2026', 'Brand Website & UI Design');
  }

  // 2.9 Seed Team Members
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM team_members').get().count === 0) {
    const insertTeam = db.prepare(`
      INSERT INTO team_members (id, name, role, project, status, hourly, avatar, permission)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTeam.run('tm-1', 'Arjun Mehta', 'Staff Full Stack Engineer', 'SaaS Dashboard Development', 'Active', '$35/hr', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 'Admin Access');
    insertTeam.run('tm-2', 'Neha Sharma', 'Lead UI/UX Designer', 'Brand Website & UI Design', 'Active', '$30/hr', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', 'Editor');
    insertTeam.run('tm-3', 'Rohit Verma', 'AI/ML Architect', 'Integrate AI Features', 'Active', '$50/hr', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 'Editor');
    insertTeam.run('tm-4', 'Aisha Patel', 'Creative Director', 'Brand Website & UI Design', 'Reviewing', '$45/hr', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', 'Viewer');
    insertTeam.run('tm-5', 'Marcus Vance', 'DevOps & Kubernetes Lead', 'Enterprise Kubernetes', 'Completed', '$60/hr', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80', 'Admin Access');
  }

  // 2.10 Seed Payments
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM payments').get().count === 0) {
    const insertPayment = db.prepare(`
      INSERT INTO payments (id, milestone, project, recipient, recipient_id, amount, status, date, escrow_protected)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPayment.run('tx-101', 'Milestone 1: SaaS Dashboard Architecture & Auth', 'SaaS Dashboard Development', 'Arjun Mehta', 'usr-freelancer-1', '$950.00', 'Released', 'Nov 02, 2026', 1);
    insertPayment.run('tx-102', 'Milestone 2: Real-time Telemetry Charts', 'SaaS Dashboard Development', 'Arjun Mehta', 'usr-freelancer-1', '$700.00', 'In Escrow', 'Nov 07, 2026', 1);
    insertPayment.run('tx-103', 'Figma Full Screen Prototypes & Design Tokens', 'Brand Website & UI Design', 'Neha Sharma', 'neha-sharma', '$1,200.00', 'Pending Approval', 'Nov 06, 2026', 1);
    insertPayment.run('tx-104', 'LangChain Vector Retrieval Fine-tuning', 'Integrate AI Features', 'Rohit Verma', 'rohit-verma', '$1,850.00', 'Released', 'Oct 28, 2026', 1);
    insertPayment.run('tx-105', 'Multi-Region Kubernetes Terraform Automation', 'Enterprise Kubernetes', 'Marcus Vance', 'marcus-vance', '$4,200.00', 'Released', 'Oct 22, 2026', 1);
  }

  // 2.11 Seed Pricing Plans
  if (db.prepare('SELECT COUNT(*) as count FROM pricing_plans').get().count === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO pricing_plans (id, name, tagline, icon, badge, price_monthly, price_yearly, price_symbol, price_usd_monthly, price_usd_yearly, period, button_text, button_variant, highlighted, features, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPlan.run('free', 'Free', 'Get started and explore Workverse.', 'sprout', null, 0, 0, '₹', 0, 0, '/month', 'Get Started', 'outline', 0, JSON.stringify(['Up to 3 projects', 'Basic collaboration', '1 GB file storage', 'Community support']), 1);
    insertPlan.run('pro', 'Pro', 'For freelancers and individual builders.', 'zap', null, 499, 399, '₹', 19, 15, '/month', 'Start Pro', 'outline-orange', 0, JSON.stringify(['Unlimited projects', 'Advanced task management', '50 GB file storage', 'Priority support']), 2);
    insertPlan.run('team', 'Team', 'For growing teams and startups.', 'users', 'Most Popular', 1499, 1199, '₹', 49, 39, '/month', 'Start Team →', 'white-orange', 1, JSON.stringify(['All Pro features', 'Team collaboration (up to 10)', '200 GB file storage', 'Team analytics & reports', 'Role & access control']), 3);
    insertPlan.run('business', 'Business', 'For organizations that need more.', 'building', null, 4999, 3999, '₹', 149, 119, '/month', 'Contact Sales', 'outline', 0, JSON.stringify(['All Team features', 'Unlimited team members', '1 TB file storage', 'Advanced security & SSO', 'Dedicated account manager']), 4);
  }

  // 2.12 Seed Resources
  if (db.prepare('SELECT COUNT(*) as count FROM resources').get().count === 0) {
    const insertResource = db.prepare(`
      INSERT INTO resources (id, title, excerpt, category, read_time, date, author_name, author_avatar, image, featured, tags, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertResource.run('res-1', 'The Complete 2026 Guide to High-Ticket Freelancing & Client Retention', 'How top software engineers and design leads position their services, close $150+/hr contracts, and build multi-year relationships with tech startups.', 'Guides', '8 min read', 'Oct 28, 2026', 'Julian Hayes', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', 1, JSON.stringify(['Freelance Growth', 'Pricing Strategy', 'Client Management']), 'Full playbook covering discovery calls, milestone framing, escrow protections, and retainer transitions.');
    insertResource.run('res-2', 'Building Modern Design Systems in Figma & React', 'Step-by-step methodology for setting up shared design tokens, automated variables, and production-ready React component libraries.', 'Tutorials', '6 min read', 'Nov 02, 2026', 'Neha Sharma', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', 0, JSON.stringify(['Design Systems', 'Figma', 'React']), 'Learn how to map semantic color and spacing tokens directly from Figma Variables to Tailwind CSS v4 themes.');
    insertResource.run('res-3', 'Escrow Protection & Milestone Best Practices for Clients & Builders', 'Everything you need to know about Workverse milestone contracts, disputes prevention, and secure payout schedules.', 'Best Practices', '4 min read', 'Oct 15, 2026', 'Workverse Trust & Safety', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 0, JSON.stringify(['Contracts', 'Escrow', 'Security']), 'Clear acceptance criteria and funded milestone staging ensure 99.4% dispute-free settlements.');
    insertResource.run('res-4', 'Integrating AI Agents into Enterprise Workflows: A Developer Primer', 'A pragmatic handbook on deploying LLM tool-calling agents, evaluation harnesses, and latency monitoring in production.', 'Tutorials', '10 min read', 'Nov 04, 2026', 'Rohit Verma', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 0, JSON.stringify(['AI / ML', 'Python', 'Architecture']), 'Production lessons on tool-calling reliability, semantic caching, and structured JSON output validation.');
    insertResource.run('res-5', 'Tax & Compliance Fundamentals for Remote Independent Contractors', 'Navigating international invoicing, W-8BEN forms, GST/VAT compliance, and automated expense bookkeeping.', 'Guides', '7 min read', 'Oct 20, 2026', 'Claire Dupont', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', 0, JSON.stringify(['Finances', 'Compliance', 'Remote Work']), 'Cross-border payout optimization and compliant invoice archiving for independent consultants.');
    insertResource.run('res-6', 'Getting Started on Workverse: Complete Walkthrough for New Talents', 'Optimizing your profile portfolio, passing skill verifications, submitting winning proposals, and getting your first 5-star review.', 'Getting Started', '5 min read', 'Nov 01, 2026', 'Arjun Mehta', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', 0, JSON.stringify(['Onboarding', 'Proposals', 'Success Guide']), 'Step-by-step onboarding checklist for verified freelancers on Workverse.');
  }

  // 2.13 Seed Initial Default Bookmarks
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM bookmarks').get().count === 0) {
    const insBm = db.prepare('INSERT OR IGNORE INTO bookmarks (id, user_id, item_type, item_id) VALUES (?, ?, ?, ?)');
    insBm.run('bm-1', 'default', 'talent', 'arjun-mehta');
    insBm.run('bm-2', 'default', 'project', 'proj-1');
    insBm.run('bm-3', 'default', 'project', 'proj-3');
    insBm.run('bm-4', 'default', 'project', 'proj-5');
  }

  // 2.14 Seed Initial Notifications
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM notifications').get().count === 0) {
    const insNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, role, type, title, message, target_page, target_tab, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insNotif.run('notif-f1', 'all', 'freelancer', 'payment', 'Escrow Payment Released ($950.00)', 'CloudScale AI approved Milestone 1 on SaaS Dashboard Development.', 'projects', 'earnings', 0);
    insNotif.run('notif-f2', 'all', 'freelancer', 'message', 'New Message from Sarah Jenkins', 'Reviewed the telemetry staging preview — ready for sprint review.', 'projects', 'messages', 0);
    insNotif.run('notif-f3', 'all', 'freelancer', 'proposal', 'Proposal Accepted & Active', 'SaaS Dashboard Development contract funded ($3,200.00 in escrow).', 'projects', 'contracts', 1);
    insNotif.run('notif-c1', 'all', 'client', 'proposal', 'New Proposal on FinTech Mobile App', 'Neha Sharma submitted a $1,100 bid with interactive prototypes.', 'projects', 'proposals', 0);
    insNotif.run('notif-c2', 'all', 'client', 'milestone', 'Deliverable Ready for Review', 'Vinita Parmar moved "Mobile Responsive Audit & Tap Targets" to Review.', 'projects', 'kanban', 0);
    insNotif.run('notif-c3', 'all', 'client', 'payment', 'Escrow Milestone Pending Approval', '$1,200.00 escrow release awaiting signoff for Brand Website & UI Design.', 'projects', 'payments', 1);
  }

  // 2.15 Seed Initial Compliance Audit Logs
  if (shouldSeedDemo && db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count === 0) {
    const insAudit = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insAudit.run('audit-1', 'usr-freelancer-1', 'auth.login', 'session', 'sess-101', 'Arjun Mehta authenticated via JWT credentials.', '127.0.0.1', '2026-11-23 09:15:00');
    insAudit.run('audit-2', 'usr-client-1', 'project.create', 'project', 'proj-1', 'SaaS Dashboard Development created with $3,200.00 budget.', '127.0.0.1', '2026-11-23 09:30:00');
    insAudit.run('audit-3', 'usr-client-1', 'escrow.fund', 'payment', 'pay-1', 'Milestone 1 escrow funded ($950.00) into verified custody.', '127.0.0.1', '2026-11-23 10:00:00');
    insAudit.run('audit-4', 'usr-freelancer-1', 'deliverable.upload', 'file', 'f-1', 'Production Architecture Deck v2 uploaded to project drive.', '127.0.0.1', '2026-11-23 11:20:00');
    insAudit.run('audit-5', 'usr-freelancer-1', 'wallet.withdraw', 'transaction', 'tx-1', 'Automated withdrawal of $250.00 disbursed via Stripe.', '127.0.0.1', '2026-11-23 14:05:00');
  }
}

function logAuditEvent({ userId = 'system', action, entityType = 'general', entityId = null, details = null, ip = '127.0.0.1' }) {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(id, userId, action, entityType, entityId, detailsStr, ip);
    return id;
  } catch (err) {
    console.error('Failed to record audit event:', err);
    return null;
  }
}

seedDatabase();

// Run ownership backfills after seeding as well, which is required for a brand
// new database where the demo rows are inserted after the migration block.
db.exec(`
  UPDATE message_threads SET owner_id = COALESCE(owner_id, 'usr-client-1');
  UPDATE message_threads SET participant_id = COALESCE(participant_id, (SELECT u.id FROM users u WHERE lower(u.name) = lower(message_threads.user_name) LIMIT 1));
  UPDATE messages SET sender_id = COALESCE(sender_id, CASE WHEN sender = 'you' THEN (SELECT owner_id FROM message_threads t WHERE t.id = messages.thread_id) ELSE (SELECT participant_id FROM message_threads t WHERE t.id = messages.thread_id) END);
  UPDATE files SET project_id = COALESCE(project_id, (SELECT p.id FROM projects p WHERE lower(p.title) = lower(files.project) LIMIT 1)), user_id = COALESCE(user_id, (SELECT u.id FROM users u WHERE lower(u.name) = lower(files.uploaded_by) LIMIT 1), 'usr-client-1');
  UPDATE team_members SET project_id = COALESCE(project_id, (SELECT p.id FROM projects p WHERE lower(p.title) = lower(team_members.project) LIMIT 1)), owner_id = COALESCE((SELECT p.client_id FROM projects p WHERE p.id = team_members.project_id LIMIT 1), owner_id, 'usr-client-1'), member_user_id = COALESCE(member_user_id, (SELECT u.id FROM users u WHERE lower(u.name) = lower(team_members.name) LIMIT 1));
  UPDATE payments SET project_id = COALESCE(project_id, (SELECT p.id FROM projects p WHERE lower(p.title) = lower(payments.project) LIMIT 1)), client_id = COALESCE((SELECT p.client_id FROM projects p WHERE p.id = payments.project_id LIMIT 1), client_id, 'usr-client-1');
  UPDATE notifications SET user_id = CASE WHEN user_id = 'all' AND role = 'client' THEN 'usr-client-1' WHEN user_id = 'all' AND role = 'freelancer' THEN 'usr-freelancer-1' ELSE user_id END;
`);

// Every freelancer account owns exactly one directory profile. This repairs
// accounts created by older versions where changing roles could leave the
// directory out of sync.
const freelancersWithoutProfiles = db.prepare(`
  SELECT u.* FROM users u
  WHERE u.role = 'freelancer'
    AND NOT EXISTS (SELECT 1 FROM talents t WHERE t.user_id = u.id)
`).all();
const insertMissingTalent = db.prepare(`
  INSERT INTO talents (
    id, user_id, name, title, role, verified, available, avatar, rating,
    reviews_count, hourly_rate, location, experience, job_success,
    completed_projects, category, experience_level, about, skills, badges,
    portfolio, work_history, reviews
  ) VALUES (?, ?, ?, ?, ?, 0, 1, ?, 0, 0, ?, 'Remote', 'New to Workverse',
    'No ratings yet', 0, 'Development', 'Entry Level', ?, '[]', '[]', '[]', '[]', '[]')
`);
for (const user of freelancersWithoutProfiles) {
  const slug = String(user.name || 'freelancer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  insertMissingTalent.run(
    `${slug}-${String(user.id).slice(-6)}`,
    user.id,
    user.name,
    user.title || 'Independent Professional',
    user.title || 'Independent Professional',
    user.avatar || '',
    Number(user.hourly_rate || 0),
    `${user.name} is building their Workverse profile.`
  );
}

// Demo fixtures are opt-in. Normal localhost startup keeps only records created
// by real registered accounts, while the automated suite can request fixtures
// in its isolated database with WORKVERSE_SEED_DEMO_DATA=true.
if (process.env.WORKVERSE_SEED_DEMO_DATA !== 'true') {
  db.exec(`
    BEGIN;
    DELETE FROM messages WHERE thread_id IN (
      SELECT id FROM message_threads
      WHERE owner_id IN ('usr-client-1', 'usr-freelancer-1')
         OR participant_id IN ('usr-client-1', 'usr-freelancer-1')
    ) OR sender_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM message_threads
      WHERE owner_id IN ('usr-client-1', 'usr-freelancer-1')
         OR participant_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM disputes
      WHERE opened_by IN ('usr-client-1', 'usr-freelancer-1')
         OR against_user_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM notifications WHERE user_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM wallet_transactions WHERE user_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM time_logs WHERE user_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM bookmarks WHERE user_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM files WHERE user_id IN ('usr-client-1', 'usr-freelancer-1')
      OR project_id IN (SELECT id FROM projects WHERE client_id = 'usr-client-1');
    DELETE FROM team_members WHERE owner_id IN ('usr-client-1', 'usr-freelancer-1')
      OR member_user_id IN ('usr-client-1', 'usr-freelancer-1')
      OR project_id IN (SELECT id FROM projects WHERE client_id = 'usr-client-1');
    DELETE FROM payments WHERE client_id IN ('usr-client-1', 'usr-freelancer-1')
      OR recipient_id IN ('usr-client-1', 'usr-freelancer-1')
      OR project_id IN (SELECT id FROM projects WHERE client_id = 'usr-client-1');
    DELETE FROM proposals WHERE candidate_id IN ('usr-client-1', 'usr-freelancer-1')
      OR project_id IN (SELECT id FROM projects WHERE client_id = 'usr-client-1');
    DELETE FROM kanban_tasks WHERE user_id IN ('usr-client-1', 'usr-freelancer-1')
      OR project_id IN (SELECT id FROM projects WHERE client_id = 'usr-client-1');
    DELETE FROM contracts WHERE client_id IN ('usr-client-1', 'usr-freelancer-1')
      OR freelancer_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM projects WHERE client_id = 'usr-client-1';
    DELETE FROM audit_logs WHERE user_id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM talents WHERE user_id IN ('usr-client-1', 'usr-freelancer-1')
      OR user_id NOT IN (SELECT id FROM users);
    DELETE FROM users WHERE id IN ('usr-client-1', 'usr-freelancer-1');
    DELETE FROM messages WHERE sender_id IS NOT NULL AND sender_id NOT IN (SELECT id FROM users);
    DELETE FROM messages WHERE thread_id IN (
      SELECT id FROM message_threads
      WHERE owner_id NOT IN (SELECT id FROM users)
         OR participant_id NOT IN (SELECT id FROM users)
    );
    DELETE FROM message_threads
      WHERE owner_id NOT IN (SELECT id FROM users)
         OR participant_id NOT IN (SELECT id FROM users);
    DELETE FROM disputes
      WHERE opened_by NOT IN (SELECT id FROM users)
         OR against_user_id NOT IN (SELECT id FROM users);
    DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users);
    DELETE FROM wallet_transactions WHERE user_id NOT IN (SELECT id FROM users);
    DELETE FROM time_logs WHERE user_id NOT IN (SELECT id FROM users);
    DELETE FROM bookmarks WHERE user_id NOT IN (SELECT id FROM users);
    DELETE FROM files
      WHERE user_id NOT IN (SELECT id FROM users)
         OR project_id IN (SELECT id FROM projects WHERE client_id NOT IN (SELECT id FROM users));
    DELETE FROM team_members
      WHERE owner_id NOT IN (SELECT id FROM users)
         OR project_id IN (SELECT id FROM projects WHERE client_id NOT IN (SELECT id FROM users));
    DELETE FROM payments
      WHERE client_id NOT IN (SELECT id FROM users)
         OR recipient_id NOT IN (SELECT id FROM users)
         OR project_id IN (SELECT id FROM projects WHERE client_id NOT IN (SELECT id FROM users));
    DELETE FROM proposals
      WHERE candidate_id NOT IN (SELECT id FROM users)
         OR project_id IN (SELECT id FROM projects WHERE client_id NOT IN (SELECT id FROM users));
    DELETE FROM kanban_tasks
      WHERE user_id NOT IN (SELECT id FROM users)
         OR project_id IN (SELECT id FROM projects WHERE client_id NOT IN (SELECT id FROM users));
    DELETE FROM contracts
      WHERE client_id NOT IN (SELECT id FROM users)
         OR freelancer_id NOT IN (SELECT id FROM users);
    DELETE FROM projects WHERE client_id NOT IN (SELECT id FROM users);
    DELETE FROM talents WHERE user_id NOT IN (SELECT id FROM users);
    DELETE FROM audit_logs WHERE user_id != 'system' AND user_id NOT IN (SELECT id FROM users);
    DELETE FROM newsletter_subscribers WHERE email IN ('sarah@cloudscale.ai', 'founder@startup.io');
    COMMIT;
  `);
}

// Replace the two old role-based stock portraits for existing accounts. A photo
// chosen by the person is left untouched, including its directory counterpart.
const replaceDefaultAvatar = db.prepare('UPDATE users SET avatar = ? WHERE id = ?');
const replaceDefaultTalentAvatar = db.prepare('UPDATE talents SET avatar = ? WHERE user_id = ?');
for (const user of db.prepare('SELECT id, name, avatar FROM users').all()) {
  if (!isLegacyDefaultAvatar(user.avatar)) continue;
  const nextAvatar = avatarUrl(user.name, inferAvatarStyle(user.name));
  replaceDefaultAvatar.run(nextAvatar, user.id);
  const talent = db.prepare('SELECT avatar FROM talents WHERE user_id = ?').get(user.id);
  if (talent && isLegacyDefaultAvatar(talent.avatar)) {
    replaceDefaultTalentAvatar.run(nextAvatar, user.id);
  }
}

module.exports = {
  db,
  seedDatabase,
  logAuditEvent,
};

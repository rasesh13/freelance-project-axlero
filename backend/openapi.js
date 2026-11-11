// Complete OpenAPI 3.0.3 Specification for Workverse Backend API

function getOpenApiSpec(port = 5000) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Workverse Production Backend API',
      version: '2.0.0',
      description:
        'Full-stack REST API powered by Express.js and SQLite WAL persistence for Freelancer & Client Workspaces, Escrow Payments, Time Tracking, Kanban Delivery, Messaging, and Authentication.',
    },
    servers: [
      { url: `http://localhost:${port}`, description: 'Localhost Server' },
      { url: `http://127.0.0.1:${port}`, description: 'Loopback Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'System', description: 'Health checks, live database metrics, and global search' },
      { name: 'Auth & Settings', description: 'JWT authentication, registration, and workspace preferences' },
      { name: 'Talents & Projects', description: 'Verified talent directory and client project postings' },
      { name: 'Kanban & Delivery', description: 'Interactive sprint milestone columns and cards' },
      { name: 'Contracts & Proposals', description: 'Client hiring offers and contractor bid submissions' },
      { name: 'Time & Wallet', description: 'Stopwatch session logging, wallet balance, and withdrawals' },
      { name: 'Messages, Files & Escrow', description: 'Real-time collaboration threads, deliverables, team, and escrow payouts' },
      { name: 'Platform Catalog', description: 'Pricing plans, resources hub, bookmarks, and newsletter' },
      { name: 'Notifications', description: 'Real-time role-aware workspace notifications and read status controls' },
    ],
    paths: {
      '/api/health': {
        get: { tags: ['System'], summary: 'Health & SQLite connection check', responses: { 200: { description: 'OK' } } },
      },
      '/api/stats': {
        get: { tags: ['System'], summary: 'Live row counts across all 18 SQLite tables', responses: { 200: { description: 'OK' } } },
      },
      '/api/search': {
        get: {
          tags: ['System'],
          summary: 'Unified search across talents, projects, and resources',
          parameters: [{ name: 'q', in: 'query', schema: { type: 'string', default: 'react' }, description: 'Search query keyword' }],
          responses: { 200: { description: 'Search results' } },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth & Settings'],
          summary: 'Authenticate user and issue 30-day JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { email: 'arjun@workverse.io', password: 'password123', role: 'freelancer' },
              },
            },
          },
          responses: { 200: { description: 'JWT Token + User Object' }, 401: { description: 'Invalid credentials' } },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth & Settings'],
          summary: 'Create a new verified client or freelancer account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { name: 'Riya Kapoor', email: 'riya@studio.io', password: 'password123', role: 'freelancer' },
              },
            },
          },
          responses: { 201: { description: 'Created' }, 409: { description: 'Email already registered' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth & Settings'],
          summary: 'Get authenticated current user profile',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Current user' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth & Settings'],
          summary: 'Queue password reset verification for account email',
          requestBody: {
            required: true,
            content: { 'application/json': { example: { email: 'arjun@workverse.io' } } },
          },
          responses: { 200: { description: 'Reset queued' } },
        },
      },
      '/api/settings': {
        get: { tags: ['Auth & Settings'], summary: 'Fetch workspace settings', responses: { 200: { description: 'Settings object' } } },
        put: {
          tags: ['Auth & Settings'],
          summary: 'Update workspace & notification settings',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { workspaceName: 'Workverse Ventures', billingEmail: 'finance@workverse.io', autoEscrowRelease: true, twoFactorAuth: true, emailDigest: 'Daily' },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
      },
      '/api/talents': {
        get: {
          tags: ['Talents & Projects'],
          summary: 'List all verified freelancers with skills, portfolios, and reviews',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string', default: '' } },
            { name: 'category', in: 'query', schema: { type: 'string', default: '' } },
          ],
          responses: { 200: { description: 'Talents array' } },
        },
      },
      '/api/talents/{id}': {
        get: {
          tags: ['Talents & Projects'],
          summary: 'Get a single verified freelancer profile by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', default: 'arjun-mehta' } }],
          responses: { 200: { description: 'Talent profile' }, 404: { description: 'Not found' } },
        },
      },
      '/api/projects': {
        get: {
          tags: ['Talents & Projects'],
          summary: 'List all live projects',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', default: 'All' } },
            { name: 'search', in: 'query', schema: { type: 'string', default: '' } },
          ],
          responses: { 200: { description: 'Projects array' } },
        },
        post: {
          tags: ['Talents & Projects'],
          summary: 'Create a new project brief',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { title: 'Realtime Telemetry API', category: 'Web Development', description: 'High-throughput WebSocket analytics service.', budget: '$2,400', deadline: 'Dec 22, 2026' },
              },
            },
          },
          responses: { 201: { description: 'Created project' } },
        },
      },
      '/api/kanban': {
        get: { tags: ['Kanban & Delivery'], summary: 'List all sprint kanban task cards', responses: { 200: { description: 'Kanban tasks' } } },
        post: {
          tags: ['Kanban & Delivery'],
          summary: 'Create a new Kanban task card',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { title: 'Implement WebSocket Sync', project: 'SaaS Dashboard Development', column: 'backlog', priority: 'High', estimate: '6 hrs' },
              },
            },
          },
          responses: { 201: { description: 'Created task' } },
        },
      },
      '/api/kanban/{id}/column': {
        patch: {
          tags: ['Kanban & Delivery'],
          summary: 'Move a Kanban card between sprint stages',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', default: 'kb-1' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { example: { column: 'progress' } } },
          },
          responses: { 200: { description: 'Updated task' } },
        },
      },
      '/api/contracts': {
        get: { tags: ['Contracts & Proposals'], summary: 'List active & completed contracts', responses: { 200: { description: 'Contracts array' } } },
        post: {
          tags: ['Contracts & Proposals'],
          summary: 'Hire talent & fund initial escrow contract',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { title: 'Design System Sprint', freelancerId: 'usr-freelancer-1', freelancerName: 'Arjun Mehta', budget: '1800', type: 'Fixed Price' },
              },
            },
          },
          responses: { 201: { description: 'Contract created & escrow funded' } },
        },
      },
      '/api/proposals': {
        get: { tags: ['Contracts & Proposals'], summary: 'List submitted project proposals/bids', responses: { 200: { description: 'Proposals array' } } },
        post: {
          tags: ['Contracts & Proposals'],
          summary: 'Submit a new proposal/bid on a project',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { project_id: 'proj-1', project_title: 'SaaS Dashboard Development', bid_amount: '$1,550', duration: '3 Weeks', pitch: 'Production React & TypeScript delivery.' },
              },
            },
          },
          responses: { 201: { description: 'Proposal submitted' } },
        },
      },
      '/api/proposals/{id}/status': {
        patch: {
          tags: ['Contracts & Proposals'],
          summary: 'Accept, shortlist, or decline a proposal',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', default: 'prop-2' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { example: { status: 'Shortlisted' } } },
          },
          responses: { 200: { description: 'Proposal updated' } },
        },
      },
      '/api/time/log': {
        post: {
          tags: ['Time & Wallet'],
          summary: 'Log billable stopwatch time & credit wallet balance',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { seconds: 1800, project_title: 'SaaS Dashboard Development', hourly_rate: 45, formatted_time: '00:30:00' },
              },
            },
          },
          responses: { 200: { description: 'Session logged & wallet credited' } },
        },
      },
      '/api/wallet': {
        get: {
          tags: ['Time & Wallet'],
          summary: 'Get live wallet balance, escrow total, and ledger transactions',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Wallet summary' } },
        },
      },
      '/api/wallet/withdraw': {
        post: {
          tags: ['Time & Wallet'],
          summary: 'Withdraw available earnings via Stripe or Wire',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { example: { amount: 250, method: 'stripe' } } },
          },
          responses: { 200: { description: 'Withdrawal completed' }, 400: { description: 'Insufficient funds' } },
        },
      },
      '/api/messages': {
        get: { tags: ['Messages, Files & Escrow'], summary: 'List dynamic message threads & chat history', responses: { 200: { description: 'Threads array' } } },
        post: {
          tags: ['Messages, Files & Escrow'],
          summary: 'Send a chat message to an existing thread or recipient',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: { thread_id: 'thread-1', text: 'API check: Milestone PR merged!', project: 'SaaS Dashboard Development' },
              },
            },
          },
          responses: { 201: { description: 'Message sent' } },
        },
      },
      '/api/files': {
        get: { tags: ['Messages, Files & Escrow'], summary: 'List shared milestone deliverable files', responses: { 200: { description: 'Files array' } } },
        post: {
          tags: ['Messages, Files & Escrow'],
          summary: 'Save uploaded deliverable file metadata',
          requestBody: {
            required: true,
            content: {
              'application/json': { example: { name: 'Architecture_Spec_v3.pdf', size: '4.8 MB', project: 'SaaS Dashboard Development' } },
            },
          },
          responses: { 201: { description: 'File recorded' } },
        },
      },
      '/api/team': {
        get: { tags: ['Messages, Files & Escrow'], summary: 'List project team contributors', responses: { 200: { description: 'Team members array' } } },
        post: {
          tags: ['Messages, Files & Escrow'],
          summary: 'Invite a contributor to a project workspace',
          requestBody: {
            required: true,
            content: {
              'application/json': { example: { email: 'kiran@workverse.io', role: 'QA Automation Lead', project: 'SaaS Dashboard Development' } },
            },
          },
          responses: { 201: { description: 'Member invited' } },
        },
      },
      '/api/payments': {
        get: { tags: ['Messages, Files & Escrow'], summary: 'List escrow deposits & milestone releases', responses: { 200: { description: 'Payments array' } } },
      },
      '/api/payments/{id}/release': {
        patch: {
          tags: ['Messages, Files & Escrow'],
          summary: 'Release milestone escrow payment to contractor wallet',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', default: 'tx-102' } }],
          responses: { 200: { description: 'Escrow released' }, 400: { description: 'Already released' } },
        },
      },
      '/api/pricing': {
        get: { tags: ['Platform Catalog'], summary: 'List Workverse subscription tiers', responses: { 200: { description: 'Pricing plans' } } },
      },
      '/api/subscriptions': {
        post: {
          tags: ['Platform Catalog'],
          summary: 'Activate subscription tier for user workspace',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { example: { planId: 'pro', billingCycle: 'yearly' } } },
          },
          responses: { 200: { description: 'Subscription activated' } },
        },
      },
      '/api/resources': {
        get: { tags: ['Platform Catalog'], summary: 'List Workverse guides & tutorials', responses: { 200: { description: 'Articles array' } } },
      },
      '/api/bookmarks': {
        get: { tags: ['Platform Catalog'], summary: 'List saved talents and project bookmarks', responses: { 200: { description: 'Bookmarks array' } } },
      },
      '/api/bookmarks/toggle': {
        post: {
          tags: ['Platform Catalog'],
          summary: 'Toggle bookmark for a talent or project',
          requestBody: {
            required: true,
            content: { 'application/json': { example: { itemType: 'project', itemId: 'proj-1' } } },
          },
          responses: { 200: { description: 'Bookmark state toggled' } },
        },
      },
      '/api/newsletter': {
        post: {
          tags: ['Platform Catalog'],
          summary: 'Subscribe email address to Workverse Weekly',
          requestBody: {
            required: true,
            content: { 'application/json': { example: { email: 'founder@startup.io' } } },
          },
          responses: { 201: { description: 'Subscribed' } },
        },
      },
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Fetch notifications and unread count scoped by user and role',
          parameters: [{ name: 'role', in: 'query', schema: { type: 'string', enum: ['client', 'freelancer'] } }],
          responses: { 200: { description: 'Notifications list and unreadCount' } },
        },
      },
      '/api/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all notifications read for current user/role',
          requestBody: {
            required: false,
            content: { 'application/json': { example: { role: 'client' } } },
          },
          responses: { 200: { description: 'All notifications marked read' } },
        },
      },
      '/api/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark a single notification as read',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Notification updated' }, 404: { description: 'Not found' } },
        },
      },
      '/api/notifications/{id}': {
        delete: {
          tags: ['Notifications'],
          summary: 'Delete/dismiss a notification permanently',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Notification deleted' }, 404: { description: 'Not found' } },
        },
      },
    },
  };
}

module.exports = { getOpenApiSpec };


# Workverse API Documentation

This document describes the HTTP API currently implemented by the Workverse freelance project-management backend. The API is served by Express on `http://localhost:5000`; the Vite frontend proxies `/api` to that address during local development.

> **Project 3 alignment note:** the present API provides the visible freelance workflow, but its SQLite data store and monolithic `server.js` do not yet meet the brief's MongoDB/Mongoose and Clean Architecture requirements. The endpoint contract below is a useful baseline to preserve while the backend is refactored.

## Quick start

```bash
# Terminal 1
cd backend
node server.js

# Terminal 2
cd frontend
npm run dev
```

Use JSON request bodies and send `Content-Type: application/json` for every request with a body.

## Authentication

Protected endpoints require a bearer token:

```http
Authorization: Bearer <jwt>
```

Obtain the token from `POST /api/auth/login` or `POST /api/auth/register`. The seeded demo password is `password123`; use an email shown by the application's demo-login choices.

### User shape

```json
{
  "id": "usr-client-1",
  "name": "Sarah Jenkins",
  "email": "sarah@example.com",
  "role": "client",
  "title": "Project Manager & Founder",
  "avatar": "https://...",
  "wallet_balance": 5000,
  "escrow_balance": 1500,
  "hourly_rate": 0,
  "subscription_plan": "free",
  "billing_cycle": "monthly"
}
```

Roles currently supported by the UI are `client` and `freelancer`.

## Conventions

- Successful reads return `200` unless otherwise stated.
- Creates return `201`.
- Invalid input returns `400`; missing records return `404`; missing/invalid JWTs return `401`.
- Most errors have the shape `{ "error": "Human-readable message" }`.
- IDs are opaque strings such as `proj-1`, `prop-1`, and `kb-1`.

## System endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api` | No | API service metadata and documentation URL. |
| GET | `/api/health` | No | Service and database health. |
| GET | `/api/stats` | No | Database-table counts and runtime statistics. |
| GET | `/docs` or `/api/docs` | No | Interactive API documentation. |
| GET | `/openapi.json` or `/api/openapi.json` | No | OpenAPI document. |

## Authentication and settings

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | No | `{ name, email, password, role }` | `{ token, user, message }` |
| POST | `/api/auth/login` | No | `{ email, password, role? }` | `{ token, user, message }` |
| GET | `/api/auth/me` | Yes | - | `{ user }` |
| POST | `/api/auth/forgot-password` | No | `{ email }` | `{ message }` (mock reset acknowledgement) |
| GET | `/api/settings` | Yes | - | `{ settings }` |
| PUT | `/api/settings` | Yes | See below | `{ settings }` |

`PUT /api/settings` accepts:

```json
{
  "workspaceName": "Acme Studio",
  "billingEmail": "billing@acme.example",
  "autoEscrowRelease": true,
  "twoFactorAuth": true,
  "emailDigest": "Daily"
}
```

## Talent directory

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/talents` | No | Lists freelancer profiles. Optional query parameters: `search`, `category`, `experience`. |
| GET | `/api/talents/:id` | No | Returns one talent profile. |

A talent includes identifiers, name, title, avatar, skills, rating, review count, hourly rate, availability, location, and portfolio-oriented metadata.

## Projects and job board

| Method | Path | Auth | Request body | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/projects` | No | - | Lists projects. Optional `status`, `category`, and `search`. |
| GET | `/api/projects/:id` | No | - | Returns one project. |
| POST | `/api/projects` | Yes | See below | Creates a project/job. |
| PATCH | `/api/projects/:id` | Yes | `{ status?, progress?, deadline?, budget? }` | Updates allowed project fields. |
| DELETE | `/api/projects/:id` | Yes | - | Deletes a project. |

Create-project example:

```json
{
  "title": "SaaS analytics dashboard",
  "description": "Build responsive reporting screens.",
  "category": "Web Development",
  "budget": "$4,500",
  "deadline": "2026-12-15",
  "skills": ["React", "Node.js"],
  "type": "Fixed price",
  "experience": "Intermediate"
}
```

## Kanban tasks and milestone workflow

| Method | Path | Auth | Request body | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/kanban` | Yes | - | Lists Kanban tasks. |
| POST | `/api/kanban` | Yes | `{ title, project?, assignee?, dueDate?, priority?, column? }` | Creates a task. |
| PATCH | `/api/kanban/:id/column` | Yes | `{ column }` | Moves a task. Valid columns: `backlog`, `progress`, `review`, `done`. |
| DELETE | `/api/kanban/:id` | Yes | - | Deletes a task. |

For the final Project 3 submission, evolve these tasks into project-linked milestones and enforce role-specific transitions: freelancer submits `pending_review`; client approves or requests changes.

## Contracts and proposals

| Method | Path | Auth | Request body | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/contracts` | Yes | - | Lists contracts. |
| POST | `/api/contracts` | Yes | `{ title, freelancer_id?, freelancer_name?, budget?, project_id? }` | Creates a contract and its initial escrow record. |
| GET | `/api/proposals` | Yes | - | Lists proposals. |
| POST | `/api/proposals` | Yes | `{ project_id?, project_title?, cover_letter?, bid_amount?, delivery_time? }` | Submits a proposal. |
| PATCH | `/api/proposals/:id/status` | Yes | `{ status }` | Updates a proposal. Valid states: `pending`, `accepted`, `rejected`. An accepted proposal can create a contract. |

## Time tracking and wallet

| Method | Path | Auth | Request body | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/time/log` | Yes | `{ seconds, project_title, hourly_rate, formatted_time }` | Records a completed time session. |
| GET | `/api/time/logs` | Yes | - | Returns the caller's latest 50 time logs. |
| GET | `/api/wallet` | Yes | - | Returns wallet balance, escrow balance, and transactions. |
| POST | `/api/wallet/withdraw` | Yes | `{ amount, method? }` | Creates a mock withdrawal. |

## Messages, files, and team

| Method | Path | Auth | Request body | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/messages` | Yes | - | Returns message threads with messages. |
| POST | `/api/messages` | Yes | `{ thread_id?, text, project?, recipientName?, recipientRole?, recipientAvatar? }` | Sends a message or starts a thread. |
| GET | `/api/files` | Yes | - | Lists mock file metadata. |
| POST | `/api/files` | Yes | `{ name, size?, project? }` | Adds mock file metadata; no binary upload occurs. |
| DELETE | `/api/files/:id` | Yes | - | Deletes a file record. |
| GET | `/api/team` | Yes | - | Lists team members. |
| POST | `/api/team` | Yes | `{ name?, email, role?, project? }` | Adds/invites a team member. |

## Payments, subscriptions, resources, and search

| Method | Path | Auth | Request body/query | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/payments` | Yes | - | Lists escrow/payment records. |
| PATCH | `/api/payments/:id/release` | Yes | - | Releases an escrow payment. |
| GET | `/api/pricing` | No | - | Lists subscription plans. |
| POST | `/api/subscriptions` | Yes | `{ planId, billingCycle? }` | Changes the caller's plan. |
| GET | `/api/resources` | No | - | Lists knowledge-base resources. |
| GET | `/api/bookmarks?type=talent` | Yes | `type` optional | Lists the caller's bookmarked item IDs. |
| POST | `/api/bookmarks/toggle` | Yes | `{ itemType, itemId }` | Adds or removes a bookmark. |
| POST | `/api/newsletter` | No | `{ email }` | Adds an email to the newsletter list. |
| GET | `/api/search?q=react` | No | `q` required for useful results | Searches talents, projects, and resources. |

## Notifications

| Method | Path | Auth | Request body/query | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/api/notifications?role=client` | Yes | `role` optional | Lists scoped notifications and unread count. |
| PATCH | `/api/notifications/read-all` | Yes | `{ role }` | Marks all scoped notifications read. |
| PATCH | `/api/notifications/:id/read?role=client` | Yes | `role` optional | Marks one notification read. |
| DELETE | `/api/notifications/:id` | Yes | - | Deletes one notification. |

## Recommended Project 3 API improvements

Before final delivery, preserve the user-facing paths where practical but make these contract changes:

1. Scope every project-dependent request by `projectId`; do not return another client's or freelancer's data.
2. Replace generic Kanban tasks with `/api/projects/:projectId/milestones` and audited state transitions.
3. Bind messages and files to `projectId`, and verify project membership before reads or writes.
4. Add `/api/projects/:projectId/invoices` to generate invoices only from approved milestones, plus a print-oriented response/view.
5. Add `/api/analytics/freelancer` for earnings, payment status, active project count, and completion rate.
6. Add explicit authorization rules for proposal acceptance, payment release, milestone review, file deletion, and project updates.
7. Move the implementation to MongoDB/Mongoose and document all IDs as MongoDB ObjectIds after the migration.

## Example authenticated request

```bash
curl -X PATCH http://localhost:5000/api/kanban/kb-1/column \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"column":"review"}'
```

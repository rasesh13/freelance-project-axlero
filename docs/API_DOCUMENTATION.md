# 🟠 WORKVERSE — API Documentation

### Developer Reference · REST API · Backend v2.0.0

**Discover. Collaborate. Deliver.**

A comprehensive technical reference for the Workverse freelance marketplace and project management platform.

---

## 1. API Overview

Workverse provides a RESTful backend that powers authentication, talent discovery, project management, proposals, contracts, messaging, payments, and workspace operations.

| Property | Details |
|---|---|
| API Name | Workverse Backend API |
| API Version | 2.0.0 (OpenAPI specification) |
| Backend | Node.js + Express 5 |
| Database | SQLite (WAL Mode) |
| Authentication | JWT Bearer Authentication |
| Data Format | JSON |
| API Architecture | REST |
| Default Port | 5000 |

### Base URLs

| Environment | URL |
|---|---|
| Local Development | `http://localhost:5000/api` |
| Loopback | `http://127.0.0.1:5000/api` |

### Documentation Endpoints

- Swagger UI: `http://localhost:5000/docs`
- Alternative documentation: `http://localhost:5000/api/docs`
- OpenAPI JSON: `http://localhost:5000/openapi.json`
- API metadata: `http://localhost:5000/api`

---

## 2. Getting Started

### Start the backend

```bash
cd backend
npm install
npm start
```

The backend starts on port 5000 by default.

### Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### Verify the API

```bash
curl http://localhost:5000/api/health
```

A successful health check confirms that the backend is reachable.

---

## 3. Authentication

Workverse uses JSON Web Tokens (JWT) to authenticate protected API requests.

### Authentication flow

1. Register a new account or log in.
2. Receive an authentication token.
3. Store the token securely on the client.
4. Include the token in subsequent protected requests.

### Authorization header

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Authentication endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register an account | Public |
| POST | `/api/auth/login` | Authenticate a user | Public |
| GET | `/api/auth/me` | Retrieve current user | Required |
| POST | `/api/auth/forgot-password` | Password reset acknowledgement | Public |

### Example: Login

```http
POST /api/auth/login
```

```json
{
  "email": "sarah@example.com",
  "password": "password123",
  "role": "client"
}
```

### Example: Authenticated request

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**User roles:** `client` and `freelancer`.

---

## 4. API Endpoint Directory

The following reference covers the implemented backend routes.

### 4.1 System & Monitoring

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api` | API service information | No |
| GET | `/api/health` | Server and database health | No |
| GET | `/api/stats` | Platform statistics | No |

### 4.2 Authentication & Settings

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create an account | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/me` | Current user profile | Yes |
| POST | `/api/auth/forgot-password` | Password reset acknowledgement | No |
| GET | `/api/settings` | Retrieve workspace settings | Yes |
| PUT | `/api/settings` | Update workspace settings | Yes |

### 4.3 Talent Discovery

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/talents` | Retrieve talent directory | No |
| GET | `/api/talents/:id` | Retrieve an individual profile | No |

**Supported query parameters:**

- `search` — Search talent profiles.
- `category` — Filter by professional category.
- `experience` — Filter by experience level.

Example:

```http
GET /api/talents?search=react&category=Development
```

### 4.4 Projects Management

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/projects` | Retrieve projects | No |
| GET | `/api/projects/:id` | Retrieve project details | No |
| POST | `/api/projects` | Create a project | Yes |
| PATCH | `/api/projects/:id` | Update project information | Yes |
| DELETE | `/api/projects/:id` | Delete a project | Yes |

**Create project:**

```http
POST /api/projects
```

```json
{
  "title": "SaaS Analytics Dashboard",
  "category": "Web Development",
  "description": "Build a responsive analytics dashboard.",
  "budget": "$4,500",
  "budgetType": "Fixed Price",
  "duration": "2 - 3 Weeks",
  "deadline": "Dec 20, 2026",
  "skills": ["React", "Node.js"],
  "team": []
}
```

**Update project:**

```http
PATCH /api/projects/proj-1
```

```json
{
  "status": "In Progress",
  "progress": 60,
  "deadline": "Dec 25, 2026"
}
```

### 4.5 Kanban & Task Management

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/kanban` | Retrieve Kanban tasks | Yes |
| POST | `/api/kanban` | Create a task | Yes |
| PATCH | `/api/kanban/:id/column` | Move a task between columns | Yes |
| DELETE | `/api/kanban/:id` | Delete a task | Yes |

**Create task:**

```json
{
  "title": "Implement authentication",
  "project": "SaaS Dashboard",
  "column": "backlog",
  "priority": "High",
  "estimate": "4 hrs"
}
```

**Update task column:**

```http
PATCH /api/kanban/kb-1/column
```

```json
{
  "column": "review"
}
```

Supported columns:

- `backlog`
- `progress`
- `review`
- `done`

### 4.6 Contracts & Proposals

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/contracts` | Retrieve contracts | Yes |
| POST | `/api/contracts` | Create a contract | Yes |
| GET | `/api/proposals` | Retrieve proposals | Yes |
| POST | `/api/proposals` | Submit a proposal | Yes |
| PATCH | `/api/proposals/:id/status` | Update proposal status | Yes |

**Submit proposal:**

```json
{
  "project_id": "proj-1",
  "project_title": "SaaS Dashboard",
  "bid_amount": "$1,500",
  "duration": "3 Weeks",
  "pitch": "I will deliver production-ready code.",
  "cover_letter": "I am interested in this project."
}
```

Supported proposal statuses: `pending`, `accepted`, `rejected`.

### 4.7 Time Tracking

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/time/log` | Record a time-tracking session | Yes |
| GET | `/api/time/logs` | Retrieve recent time logs | Yes |

**Log working time:**

```json
{
  "seconds": 3600,
  "project_title": "SaaS Dashboard",
  "hourly_rate": 45,
  "formatted_time": "01:00:00"
}
```

The backend calculates the amount earned using the recorded duration and hourly rate.

### 4.8 Wallet & Payments

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/wallet` | Retrieve wallet information | Yes |
| POST | `/api/wallet/withdraw` | Submit withdrawal request | Yes |
| GET | `/api/payments` | Retrieve payment records | Yes |
| PATCH | `/api/payments/:id/release` | Release escrow payment | Yes |

**Withdrawal request:**

```json
{
  "amount": 500,
  "method": "stripe"
}
```

### 4.9 Messaging

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/messages` | Retrieve conversations | Yes |
| POST | `/api/messages` | Send a message or start a thread | Yes |

**Send message:**

```json
{
  "thread_id": "thread-1",
  "text": "Hello! Let's discuss the project.",
  "project": "SaaS Dashboard"
}
```

### 4.10 Files & Deliverables

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/files` | Retrieve file records | Yes |
| POST | `/api/files` | Create file metadata record | Yes |
| DELETE | `/api/files/:id` | Delete file record | Yes |

**Register file metadata:**

```json
{
  "name": "project-report.pdf",
  "size": "2.5 MB",
  "project": "SaaS Dashboard"
}
```

**Important:** The current POST endpoint registers file metadata. It does not perform an actual binary file upload.

### 4.11 Team Management

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/team` | Retrieve team members | Yes |
| POST | `/api/team` | Add a team member | Yes |

**Add team member:**

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "role": "Contributor",
  "project": "SaaS Dashboard"
}
```

### 4.12 Subscription & Pricing

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/pricing` | Retrieve available pricing plans | No |
| POST | `/api/subscriptions` | Change subscription plan | Yes |

**Subscribe:**

```json
{
  "planId": "pro",
  "billingCycle": "monthly"
}
```

### 4.13 Resources & Bookmarks

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/resources` | Retrieve knowledge resources | No |
| GET | `/api/bookmarks` | Retrieve saved bookmarks | Yes |
| POST | `/api/bookmarks/toggle` | Add or remove a bookmark | Yes |

**Toggle bookmark:**

```json
{
  "itemType": "talent",
  "itemId": "talent-1"
}
```

Optional query parameter for bookmarks: `type`.

### 4.14 Newsletter & Search

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/newsletter` | Subscribe to newsletter | No |
| GET | `/api/search` | Search platform resources | No |

Example:

```http
GET /api/search?q=react
```

### 4.15 Notifications

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/notifications` | Retrieve notifications | Yes |
| PATCH | `/api/notifications/read-all` | Mark all scoped notifications as read | Yes |
| PATCH | `/api/notifications/:id/read` | Mark one notification as read | Yes |
| DELETE | `/api/notifications/:id` | Delete a notification | Yes |

Optional notification query parameter: `role`.

---

## 5. HTTP Status Codes

The backend uses standard HTTP status codes to communicate request outcomes.

| Status | Meaning | Description |
|---|---|---|
| 200 | OK | Request completed successfully |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid or missing input |
| 401 | Unauthorized | Authentication required or invalid |
| 404 | Not Found | Requested resource does not exist |
| 500 | Internal Server Error | Unexpected backend error |

### Error response example

```json
{
  "error": "Project not found"
}
```

Error response properties can vary by endpoint.

---

## 6. Database & Persistence

Workverse currently uses SQLite with Write-Ahead Logging (WAL) enabled.

### Persistence characteristics

- SQLite database stored in `backend/database.sqlite`.
- Foreign-key enforcement enabled.
- WAL mode enabled for database operations.
- Database schema initialized by `backend/db.js`.
- Database operations are implemented using Node.js `DatabaseSync`.

### Main data domains

| Domain | Purpose |
|---|---|
| Users | Account and profile information |
| Talents | Freelancer directory |
| Projects | Project and job information |
| Kanban Tasks | Task tracking |
| Contracts | Contract records |
| Proposals | Freelancer applications |
| Time Logs | Recorded working sessions |
| Wallet Transactions | Financial activity |
| Payments | Payment and escrow records |
| Messages | Conversation records |
| Files | Deliverable metadata |
| Team Members | Team information |
| Notifications | User notifications |
| Bookmarks | Saved resources and profiles |

---

## 7. Security Considerations

The backend implements:

- JWT-based authentication.
- Password hashing using bcryptjs.
- CORS middleware.
- JSON request parsing with a 2 MB body limit.
- HTTP security headers.
- Protected route middleware.

**Production recommendations:**

1. Set a strong `JWT_SECRET` through environment variables.
2. Restrict CORS to trusted frontend origins.
3. Implement authorization checks for resource ownership and user roles.
4. Use HTTPS in production.
5. Add rate limiting to authentication endpoints.
6. Avoid returning sensitive account information.
7. Validate and sanitize all incoming data.

Never expose JWT secrets or passwords in source control.

---

## 8. Testing & Validation

Run the backend test suite:

```bash
npm test
```

Run individual test categories:

```bash
npm run test:api
npm run test:db
npm run test:health
```

### Recommended testing workflow

1. Start the backend.
2. Open Swagger UI.
3. Register or authenticate a test account.
4. Copy the JWT token.
5. Authorize protected endpoints.
6. Test GET, POST, PATCH, and DELETE operations.
7. Verify database changes.
8. Check error responses and authentication behavior.

---

## 9. Project Architecture

```text
WORKVERSE
│
├── frontend/
│   └── React + Vite
│       ├── Components
│       ├── Pages
│       ├── API Client
│       └── Application State
│
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── openapi.js
│   ├── dashboard.js
│   └── database.sqlite
│
├── docs/
│   └── API_DOCUMENTATION.md
│
├── docker-compose.yml
└── README.md
```

### Request lifecycle

```text
Frontend Application
        |
        v
    HTTP Request
        |
        v
  Express Middleware
        |
        v
 Authentication Check
        |
        v
   API Route Handler
        |
        v
   SQLite Database
        |
        v
  JSON Response
        |
        v
 Frontend Application
```

---

## 10. Important Implementation Notes

This documentation describes the current implementation, not proposed future functionality.

- The API uses SQLite, not MongoDB.
- The backend is currently organized around route handlers in `server.js`, rather than a fully separated controller/service/repository architecture.
- File endpoints store metadata; they do not upload binary files.
- Password reset currently provides an acknowledgement rather than a demonstrated complete email-based reset workflow.
- The presence of JWT authentication does not automatically guarantee ownership-based authorization on every endpoint.
- Wallet withdrawals and payment releases should not be assumed to represent integration with a live external payment gateway.
- Some public GET endpoints expose records without requiring authentication. Their access policies should be reviewed before production deployment.

---

## 11. Developer Resources

| Resource | Location |
|---|---|
| Backend entry point | `backend/server.js` |
| Database configuration | `backend/db.js` |
| OpenAPI specification | `backend/openapi.js` |
| Interactive API explorer | `/docs` |
| API JSON specification | `/openapi.json` |
| Automated API tests | `backend/test-api.js` |
| Database tests | `backend/test-db.js` |

---

<div align="center">

# 🟠 WORKVERSE

### Discover. Collaborate. Deliver.

**API Documentation · Version 2.0.0**

Built to connect talent, empower collaboration, and simplify freelance project management.

*End of Documentation*

</div>

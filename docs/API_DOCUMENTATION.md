<div align="center">

# 🟠 WORKVERSE

### API REFERENCE · DEVELOPER HANDBOOK

**Discover. Collaborate. Deliver.**

A complete integration guide for the Workverse freelance marketplace and project-management platform.

![API](https://img.shields.io/badge/API-REST-F36B21?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-Backend-171717?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-5-171717?style=for-the-badge&logo=express)
![Database](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite)
![Auth](https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge)

</div>

---

> [!IMPORTANT]
> This is the **GitHub Markdown edition** of Workverse API docs. GitHub supports badges, tables, code blocks, collapsible sections, and Mermaid diagrams—but it does not execute custom CSS animations. The floating shapes and animated background are available in the companion HTML edition.

<div align="center">

**API QUICK LINKS** · [Swagger UI](http://localhost:5000/docs) · [OpenAPI JSON](http://localhost:5000/openapi.json) · [Health](http://localhost:5000/api/health)

</div>

------------------------------------------------------------------------

## 🧭 Documentation Navigation

-   [01 · Introduction](#01--introduction)
-   [02 · Local setup](#02--local-setup)
-   [03 · API conventions](#03--api-conventions)
-   [04 · Authentication](#04--authentication)
-   [05 · Endpoint reference](#05--endpoint-reference)
-   [06 · Request examples](#06--request-examples)
-   [07 · Responses and errors](#07--responses-and-errors)
-   [08 · Rate limiting](#08--rate-limiting)
-   [09 · Data and persistence](#09--data-and-persistence)
-   [10 · Security notes](#10--security-notes)
-   [11 · Testing](#11--testing)
-   [12 · Project structure](#12--project-structure)

------------------------------------------------------------------------

## 01 · 🌐 Introduction

Workverse exposes a JSON-based REST API for the platform's core
workflows: account access, talent discovery, projects, Kanban tasks,
contracts, proposals, messaging, deliverables, team collaboration,
wallet activity, and notifications.

  Property                  Value
  ------------------------- --------------------------------------
  API base path             `/api`
  Local base URL            `http://localhost:5000/api`
  Runtime                   Node.js
  HTTP framework            Express 5
  Persistence               SQLite
  Database mode             Write-Ahead Logging (WAL)
  Authentication            JWT Bearer token
  Request/response format   JSON
  Interactive API docs      `http://localhost:5000/docs`
  OpenAPI document          `http://localhost:5000/openapi.json`

> **Implementation-first documentation:** This guide describes the
> backend behavior represented by the current project source. It does
> not imply that an external payment gateway, binary file-storage
> service, email delivery provider, or production-grade authorization
> policy is configured.

### Service URLs

  Resource               Local URL
  ---------------------- --------------------------------------
  API metadata           `http://localhost:5000/api`
  Health check           `http://localhost:5000/api/health`
  Swagger UI             `http://localhost:5000/docs`
  Alternate docs route   `http://localhost:5000/api/docs`
  OpenAPI JSON           `http://localhost:5000/openapi.json`

------------------------------------------------------------------------

## 02 · ⚙️ Local Setup

### Prerequisites

-   Node.js installed
-   npm installed
-   Git
-   A terminal (PowerShell, Command Prompt, or integrated VS Code
    terminal)

### Start the backend

From the repository root:

``` bash
cd backend
npm install
npm start
```

The backend listens on port `5000` by default. The port can be
overridden with the `PORT` environment variable.

### Start the frontend

Open a second terminal:

``` bash
cd frontend
npm install
npm run dev
```

The Vite development server proxies `/api` requests to
`http://127.0.0.1:5000` in the local configuration.

### Verify backend health

PowerShell:

``` powershell
Invoke-RestMethod http://localhost:5000/api/health
```

cURL:

``` bash
curl http://localhost:5000/api/health
```

A successful response indicates that the API health route is reachable.
It does not replace full integration testing.

------------------------------------------------------------------------

## 03 · 📐 API Conventions

### HTTP methods

  Method     Intended use
  ---------- ----------------------------------------
  `GET`      Read a resource or collection
  `POST`     Create a resource or execute an action
  `PATCH`    Partially update an existing resource
  `PUT`      Replace/update settings
  `DELETE`   Remove a resource

### Request format

Send JSON bodies with:

``` http
Content-Type: application/json
```

Example:

``` http
POST /api/projects
Content-Type: application/json
Authorization: Bearer <JWT>
```

### Path parameters

A segment beginning with `:` is a path parameter.

For example, `/api/projects/:id` uses the actual project identifier in
place of `:id`:

``` http
GET /api/projects/proj-123
```

### Query parameters

Filters are supplied in the URL after `?` and joined with `&`:

``` http
GET /api/talents?search=react&category=Development
```

### Authentication notation

-   **Public** --- route does not invoke JWT authentication middleware.
-   **Bearer** --- send a valid JWT in the `Authorization` header.

A public route is not necessarily suitable for unrestricted production
exposure. Review data sensitivity and access policy before deployment.

------------------------------------------------------------------------

## 04 · 🔐 Authentication

Workverse uses JSON Web Tokens (JWT) for protected routes. Registration
and login return a token that the client can send on subsequent
requests.

### Authentication flow

1.  Register an account or sign in.
2.  Read the `token` value from the response.
3.  Keep the token in an appropriately protected client-side storage
    strategy.
4.  Send it with protected API requests.
5.  Handle expired or invalid tokens by returning the user to the
    sign-in flow.

### Authorization header

``` http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Roles

The application recognizes these user roles:

-   `client`
-   `freelancer`

### Register

`POST /api/auth/register`

Creates an account.

Example request shape:

``` json
{
  "name": "Taylor Morgan",
  "email": "taylor@example.com",
  "password": "ChooseAStrongPassword123",
  "role": "freelancer"
}
```

The backend validates required registration fields and returns a
created-account response with a JWT and user profile. Use the live
Swagger schema for the exact accepted registration fields.

### Login

`POST /api/auth/login`

``` json
{
  "email": "taylor@example.com",
  "password": "ChooseAStrongPassword123",
  "role": "freelancer"
}
```

Successful login returns a token and user object.

### Current user

`GET /api/auth/me` --- **Bearer**

``` bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Forgot password

`POST /api/auth/forgot-password`

``` json
{
  "email": "taylor@example.com"
}
```

**Current behavior note:** The route returns a password-reset
acknowledgement and account-existence indicator/message. Do not treat it
as a complete email-based password-reset workflow unless an email
delivery and token-verification flow is added.

------------------------------------------------------------------------

## 05 · 🧩 Endpoint Reference

The tables below summarize the routes documented by the current backend.
For exact request schemas and any route-specific constraints, use the
running Swagger UI and `backend/openapi.js`.

### 5.1 System & monitoring

  Method   Endpoint        Description                          Access
  -------- --------------- ------------------------------------ --------
  `GET`    `/api`          API service metadata                 Public
  `GET`    `/api/health`   Server/database health information   Public
  `GET`    `/api/stats`    Platform/database statistics         Public

### 5.2 Authentication & settings

  -----------------------------------------------------------------------------------
  Method            Endpoint                      Description       Access
  ----------------- ----------------------------- ----------------- -----------------
  `POST`            `/api/auth/register`          Register an       Public
                                                  account           

  `POST`            `/api/auth/login`             Authenticate a    Public
                                                  user              

  `GET`             `/api/auth/me`                Retrieve current  Bearer
                                                  user              

  `POST`            `/api/auth/forgot-password`   Request reset     Public
                                                  acknowledgement   

  `GET`             `/api/settings`               Retrieve user     Bearer
                                                  workspace         
                                                  settings          

  `PUT`             `/api/settings`               Update workspace  Bearer
                                                  preferences       
  -----------------------------------------------------------------------------------

### 5.3 Talent discovery

  Method   Endpoint             Description                       Access
  -------- -------------------- --------------------------------- --------
  `GET`    `/api/talents`       List and filter talent profiles   Public
  `GET`    `/api/talents/:id`   Retrieve one talent profile       Public

Supported list filters:

  Parameter      Purpose
  -------------- -------------------------------------
  `search`       Match talent name, title, or skills
  `category`     Filter by professional category
  `experience`   Filter by experience level

Example:

``` http
GET /api/talents?search=react&category=Development&experience=Intermediate
```

### 5.4 Projects

  Method     Endpoint              Description                Access
  ---------- --------------------- -------------------------- --------
  `GET`      `/api/projects`       List projects              Public
  `GET`      `/api/projects/:id`   Retrieve project details   Public
  `POST`     `/api/projects`       Create a project           Bearer
  `PATCH`    `/api/projects/:id`   Update project fields      Bearer
  `DELETE`   `/api/projects/:id`   Delete a project           Bearer

List filters:

  Parameter    Purpose
  ------------ -------------------------------------
  `status`     Filter by project status
  `category`   Filter by project category
  `search`     Match title, description, or skills

Create-project example:

``` json
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

Update-project example:

``` json
{
  "status": "In Progress",
  "progress": 60,
  "deadline": "Dec 25, 2026"
}
```

### 5.5 Kanban & task management

  --------------------------------------------------------------------------------
  Method            Endpoint                   Description       Access
  ----------------- -------------------------- ----------------- -----------------
  `GET`             `/api/kanban`              Retrieve Kanban   Bearer
                                               tasks             

  `POST`            `/api/kanban`              Create a task     Bearer

  `PATCH`           `/api/kanban/:id/column`   Move a task to    Bearer
                                               another column    

  `DELETE`          `/api/kanban/:id`          Delete a task     Bearer
  --------------------------------------------------------------------------------

Create-task example:

``` json
{
  "title": "Implement authentication",
  "project": "SaaS Dashboard",
  "column": "backlog",
  "priority": "High",
  "estimate": "4 hrs"
}
```

Move-task example:

``` http
PATCH /api/kanban/kb-123/column
```

``` json
{
  "column": "review"
}
```

Supported columns: `backlog`, `progress`, `review`, `done`.

### 5.6 Contracts & proposals

  -----------------------------------------------------------------------------------
  Method            Endpoint                      Description       Access
  ----------------- ----------------------------- ----------------- -----------------
  `GET`             `/api/contracts`              List contracts    Bearer

  `POST`            `/api/contracts`              Create a contract Bearer

  `GET`             `/api/proposals`              List proposals    Bearer

  `POST`            `/api/proposals`              Submit a proposal Bearer

  `PATCH`           `/api/proposals/:id/status`   Update proposal   Bearer
                                                  status            
  -----------------------------------------------------------------------------------

Proposal example:

``` json
{
  "project_id": "proj-123",
  "project_title": "SaaS Dashboard",
  "bid_amount": "$1,500",
  "duration": "3 Weeks",
  "pitch": "I will deliver production-ready code.",
  "cover_letter": "I am interested in this project."
}
```

Documented proposal statuses: `pending`, `accepted`, `rejected`.

### 5.7 Time tracking

  Method   Endpoint           Description             Access
  -------- ------------------ ----------------------- --------
  `POST`   `/api/time/log`    Record a time session   Bearer
  `GET`    `/api/time/logs`   Retrieve time logs      Bearer

Example:

``` json
{
  "seconds": 3600,
  "project_title": "SaaS Dashboard",
  "hourly_rate": 45,
  "formatted_time": "01:00:00"
}
```

The backend calculates the recorded amount using the supplied duration
and hourly rate.

### 5.8 Wallet & payments

  -----------------------------------------------------------------------------------
  Method            Endpoint                      Description       Access
  ----------------- ----------------------------- ----------------- -----------------
  `GET`             `/api/wallet`                 Retrieve wallet   Bearer
                                                  and ledger        
                                                  information       

  `POST`            `/api/wallet/withdraw`        Submit a          Bearer
                                                  withdrawal        
                                                  request           

  `GET`             `/api/payments`               Retrieve payment  Bearer
                                                  records           

  `PATCH`           `/api/payments/:id/release`   Release a         Bearer
                                                  payment/escrow    
                                                  record            
  -----------------------------------------------------------------------------------

Withdrawal example:

``` json
{
  "amount": 500,
  "method": "stripe"
}
```

> **Financial integration note:** These API operations manage
> application-side wallet/payment records. Do not assume that they move
> real money or connect to Stripe (or another payment processor) without
> a separately configured and verified payment integration.

### 5.9 Messaging

  -----------------------------------------------------------------------
  Method            Endpoint          Description       Access
  ----------------- ----------------- ----------------- -----------------
  `GET`             `/api/messages`   Retrieve message  Bearer
                                      conversations     

  `POST`            `/api/messages`   Send a message or Bearer
                                      create a thread   
  -----------------------------------------------------------------------

Example:

``` json
{
  "thread_id": "thread-123",
  "text": "Hello! Let's discuss the project.",
  "project": "SaaS Dashboard"
}
```

### 5.10 Files & deliverables

  Method     Endpoint           Description              Access
  ---------- ------------------ ------------------------ --------
  `GET`      `/api/files`       Retrieve file records    Bearer
  `POST`     `/api/files`       Register file metadata   Bearer
  `DELETE`   `/api/files/:id`   Delete a file record     Bearer

Example:

``` json
{
  "name": "project-report.pdf",
  "size": "2.5 MB",
  "project": "SaaS Dashboard"
}
```

**Important:** The documented `POST /api/files` operation registers file
metadata. It is not, by itself, a multipart/binary file upload service.

### 5.11 Team management

  Method   Endpoint      Description             Access
  -------- ------------- ----------------------- --------
  `GET`    `/api/team`   Retrieve team members   Bearer
  `POST`   `/api/team`   Add a team member       Bearer

Example:

``` json
{
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "role": "Contributor",
  "project": "SaaS Dashboard"
}
```

### 5.12 Subscription & pricing

  Method   Endpoint               Description                Access
  -------- ---------------------- -------------------------- --------
  `GET`    `/api/pricing`         Retrieve pricing plans     Public
  `POST`   `/api/subscriptions`   Change subscription plan   Bearer

Example:

``` json
{
  "planId": "pro",
  "billingCycle": "monthly"
}
```

### 5.13 Resources & bookmarks

  Method   Endpoint                  Description                    Access
  -------- ------------------------- ------------------------------ --------
  `GET`    `/api/resources`          Retrieve knowledge resources   Public
  `GET`    `/api/bookmarks`          Retrieve saved bookmarks       Bearer
  `POST`   `/api/bookmarks/toggle`   Add/remove a bookmark          Bearer

Bookmark example:

``` json
{
  "itemType": "talent",
  "itemId": "talent-123"
}
```

Optional query parameter: `type`.

### 5.14 Newsletter & search

  -------------------------------------------------------------------------
  Method            Endpoint            Description       Access
  ----------------- ------------------- ----------------- -----------------
  `POST`            `/api/newsletter`   Subscribe an      Public
                                        email to the      
                                        newsletter        

  `GET`             `/api/search`       Search platform   Public
                                        content           
  -------------------------------------------------------------------------

Example:

``` http
GET /api/search?q=react
```

### 5.15 Notifications

  -------------------------------------------------------------------------------------
  Method            Endpoint                        Description       Access
  ----------------- ------------------------------- ----------------- -----------------
  `GET`             `/api/notifications`            Retrieve          Bearer
                                                    notifications     

  `PATCH`           `/api/notifications/read-all`   Mark scoped       Bearer
                                                    notifications as  
                                                    read              

  `PATCH`           `/api/notifications/:id/read`   Mark one          Bearer
                                                    notification as   
                                                    read              

  `DELETE`          `/api/notifications/:id`        Delete a          Bearer
                                                    notification      
  -------------------------------------------------------------------------------------

Optional query parameter: `role`.

------------------------------------------------------------------------

## 06 · 💻 Request Examples

### Create a project with cURL

``` bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "SaaS Analytics Dashboard",
    "category": "Web Development",
    "description": "Build a responsive analytics dashboard.",
    "budget": "$4,500",
    "budgetType": "Fixed Price",
    "skills": ["React", "Node.js"]
  }'
```

### Fetch projects with PowerShell

``` powershell
Invoke-RestMethod `
  -Uri "http://localhost:5000/api/projects?category=Web%20Development" `
  -Method Get
```

### Call a protected route with PowerShell

``` powershell
$token = "YOUR_JWT_TOKEN"

$headers = @{
  Authorization = "Bearer $token"
}

Invoke-RestMethod `
  -Uri "http://localhost:5000/api/auth/me" `
  -Headers $headers `
  -Method Get
```

### Example JavaScript fetch

``` javascript
const response = await fetch("http://localhost:5000/api/projects", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

if (!response.ok) {
  throw new Error(`API request failed: ${response.status}`);
}

const projects = await response.json();
console.log(projects);
```

------------------------------------------------------------------------

## 07 · 📬 Responses & Errors

Responses are JSON. The exact response shape depends on the endpoint.

### Common HTTP status codes

  Status   Meaning                 Typical cause
  -------- ----------------------- ---------------------------------------------
  `200`    OK                      Request completed
  `201`    Created                 Resource created
  `400`    Bad Request             Missing or invalid input
  `401`    Unauthorized            Missing/invalid credentials or failed login
  `404`    Not Found               Resource or route not found
  `429`    Too Many Requests       Rate limit reached
  `500`    Internal Server Error   Unexpected server-side failure

### Error example

``` json
{
  "error": "Project not found"
}
```

Some endpoints return additional fields such as `success`, `message`,
`project`, `task`, `token`, or `user`. Clients should not assume every
route uses an identical response envelope.

### Recommended client handling

-   Check `response.ok` before treating a response as successful.
-   Parse the JSON body when available.
-   Display a useful message for `400` validation errors.
-   On `401`, re-authenticate or refresh the user's session.
-   On `404`, show a not-found state.
-   On `429`, respect the `Retry-After` header.
-   Avoid exposing raw internal exception details to end users.

------------------------------------------------------------------------

## 08 · 🚦 Rate Limiting

The backend includes an in-memory sliding-window limiter for
authentication endpoints.

  -----------------------------------------------------------------------
  Setting                             Current behavior
  ----------------------------------- -----------------------------------
  Protected operation group           Authentication routes using the
                                      limiter

  Window                              60 seconds

  Maximum                             60 requests per window

  Exceeded response                   `429 Too Many Requests`

  Retry information                   `Retry-After` header

  Additional headers                  `X-RateLimit-Limit`,
                                      `X-RateLimit-Remaining`,
                                      `X-RateLimit-Reset`
  -----------------------------------------------------------------------

The limiter is in-memory. Its counters reset when the process restarts
and are not shared between multiple server instances.

------------------------------------------------------------------------

## 09 · 🗄️ Data & Persistence

Workverse uses SQLite for application persistence.

### Persistence characteristics

-   Database initialization is handled by `backend/db.js`.
-   The database file is stored at `backend/database.sqlite`.
-   Write-Ahead Logging (WAL) mode is enabled.
-   Foreign-key enforcement is enabled.
-   Database access uses Node.js `DatabaseSync`.

### Main data domains

  Domain                   Responsibility
  ------------------------ ----------------------------------
  Users                    Account and profile records
  Talents                  Freelancer directory
  Projects                 Project listings and details
  Kanban tasks             Task board state
  Contracts                Contract and milestone records
  Proposals                Freelancer submissions
  Messages                 Conversation and message records
  Files                    Deliverable metadata
  Team members             Workspace team records
  Payments                 Escrow/payment records
  Time logs                Tracked work sessions
  Wallet transactions      Wallet ledger activity
  Notifications            User notifications
  Bookmarks                Saved talents/projects/resources
  Pricing plans            Subscription plan information
  Resources                Knowledge-base content
  Newsletter subscribers   Newsletter sign-ups

------------------------------------------------------------------------

## 10 · 🛡️ Security Notes

### Implemented backend controls

The current backend source includes:

-   JWT-based authentication middleware.
-   Password hashing and comparison using `bcryptjs`.
-   CORS middleware.
-   JSON request parsing with a 2 MB body limit.
-   Basic HTTP security headers.
-   Authentication-route rate limiting.
-   Request logging.

### Deployment checklist

Before exposing the API publicly:

-   [ ] Set a long, random `JWT_SECRET` through environment
    configuration.
-   [ ] Do not use the development fallback JWT secret in production.
-   [ ] Restrict CORS to trusted frontend origins.
-   [ ] Serve the API over HTTPS.
-   [ ] Review authorization and resource ownership checks on every
    protected route.
-   [ ] Validate and sanitize all user-controlled input.
-   [ ] Avoid returning passwords, token secrets, or private account
    data.
-   [ ] Use a shared rate-limit store if deploying multiple backend
    instances.
-   [ ] Configure backups and recovery for the SQLite database.
-   [ ] Integrate a real payment provider before processing real funds.
-   [ ] Implement a complete email/token-based password-reset workflow
    before describing password recovery as fully operational.

> **Authorization reminder:** Authentication confirms who is making a
> request. It does not automatically prove that the user owns the
> requested project, contract, payment, file, or message. Resource-level
> authorization must be reviewed separately.

------------------------------------------------------------------------

## 11 · 🧪 Testing

Run commands from the repository root or use the `--prefix` option.

### Complete backend test suite

``` bash
npm test --prefix backend
```

### Individual test groups

``` bash
npm run test:api --prefix backend
npm run test:db --prefix backend
npm run test:health --prefix backend
```

### Suggested verification workflow

1.  Start the backend.
2.  Check `/api/health`.
3.  Open Swagger UI.
4.  Register or sign in with a test account.
5.  Copy the returned JWT.
6.  Authorize protected endpoints.
7.  Exercise successful and invalid requests.
8.  Verify persisted changes in the database.
9.  Run the automated test suite.

Use test accounts and non-production data when validating write
operations.

------------------------------------------------------------------------

## 12 · 🗂️ Project Structure

``` text
WORKVERSE/
├── backend/
│   ├── server.js           # Express application and API routes
│   ├── db.js               # SQLite setup and database operations
│   ├── openapi.js          # OpenAPI specification
│   ├── dashboard.js        # Dashboard and documentation rendering
│   ├── package.json
│   ├── test-api.js
│   ├── test-db.js
│   └── test-runner.js
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   └── API_DOCUMENTATION.md
│
├── docker-compose.yml
├── package.json
└── README.md
```

### Key developer files

  File                        Purpose
  --------------------------- --------------------------------------------
  `backend/server.js`         Route handlers, middleware, authentication
  `backend/db.js`             SQLite schema and persistence
  `backend/openapi.js`        OpenAPI schema used by API docs
  `backend/test-api.js`       API integration tests
  `backend/test-db.js`        Database tests
  `backend/test-runner.js`    Combined test runner
  `frontend/vite.config.js`   Frontend development proxy

------------------------------------------------------------------------

::: {align="center"}
## ✨ Markdown vs. Animated HTML

<details>
<summary><strong>Why this file cannot have floating animated objects</strong></summary>

GitHub sanitizes Markdown and does not allow custom stylesheet rules or JavaScript to run inside repository Markdown. This edition uses GitHub-native elements to keep the design polished and accessible: badges, emoji section markers, callout quotes, tables, fenced code, links, and collapsible details. For animated floating gradients, cursor effects, and motion, open the companion `API_DOCUMENTATION.html` file locally in a browser.

</details>

---

## 🟠 WORKVERSE

**Discover. Collaborate. Deliver.**

API Documentation · Developer Reference

*Build better workflows. Connect people. Deliver meaningful work.*
:::

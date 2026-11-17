::: {align="center"}
# WORKVERSE

### Where Talent Meets Opportunity.

**A unified freelance marketplace and project management workspace.**

Discover talent. Find meaningful work. Manage projects, conversations,
deliverables, and escrow workflows --- all in one place.

`<br/>`{=html}

[![Version](https://img.shields.io/badge/version-1.0.0-F36B21?style=for-the-badge)](#release-v100)
[![Frontend](https://img.shields.io/badge/frontend-React%2019-171717?style=for-the-badge&logo=react&logoColor=61DAFB)](#technology-stack)
[![Backend](https://img.shields.io/badge/backend-Node.js-171717?style=for-the-badge&logo=nodedotjs&logoColor=5FA04E)](#technology-stack)
[![Build](https://img.shields.io/badge/build-Vite-171717?style=for-the-badge&logo=vite&logoColor=646CFF)](#getting-started)
[![API](https://img.shields.io/badge/API-OpenAPI%203.0-F36B21?style=for-the-badge)](#api-documentation)

`<br/>`{=html}

**Warm Ivory** `#FFF9F5`  ·  **Architectural Orange** `#F36B21`  · 
**Charcoal** `#171717`
:::

------------------------------------------------------------------------

## Contents

```{=html}
<details open>
```
```{=html}
<summary>
```
`<strong>`{=html}Explore Workverse`</strong>`{=html}
```{=html}
</summary>
```
-   [Overview](#overview)
-   [Highlights](#highlights)
-   [Platform modules](#platform-modules)
-   [Architecture](#architecture)
-   [Role-based access](#role-based-access)
-   [Technology stack](#technology-stack)
-   [Getting started](#getting-started)
-   [API documentation](#api-documentation)
-   [Testing and production build](#testing-and-production-build)
-   [Project structure](#project-structure)
-   [Release v1.0.0](#release-v100)
-   [Roadmap](#roadmap)

```{=html}
</details>
```

------------------------------------------------------------------------

## Overview

**Workverse** is a modern freelance marketplace and project management
platform built to bring clients and freelancers into one connected
workspace. It combines talent discovery, project opportunities, project
execution, communication, deliverable management, and financial
tracking.

The experience is shaped around a minimal, responsive interface with an
architectural visual language and GSAP-powered motion.

```{=html}
<table>
```
```{=html}
<tr>
```
```{=html}
<td width="33%" align="center">
```
**Discover**

Find freelancers, explore portfolios, and browse opportunities.

```{=html}
</td>
```
```{=html}
<td width="33%" align="center">
```
**Collaborate**

Coordinate projects, proposals, messages, teams, and deliverables.

```{=html}
</td>
```
```{=html}
<td width="33%" align="center">
```
**Manage**

Track milestones, time, escrow balances, and payouts.

```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
</table>
```
## Highlights

  -----------------------------------------------------------------------
  Experience                          What it brings
  ----------------------------------- -----------------------------------
  **Architectural UI**                Responsive layouts, a warm
                                      ivory/orange/charcoal design
                                      system, and smooth GSAP
                                      transitions.

  **Talent discovery**                Freelancer profiles, search,
                                      advanced filters, quick filters,
                                      pagination, and messaging modals.

  **Work discovery**                  Searchable opportunities,
                                      project-scope drawers,
                                      milestone-based escrow breakdowns,
                                      and proposal submission.

  **Project workspace**               Seven connected modules for project
                                      execution and administration.

  **Pricing**                         INR, USD, and EUR currency options,
                                      monthly/annual billing, plan
                                      selection, and FAQ accordion.

  **Knowledge base**                  Searchable articles, guides,
                                      playbooks, and category filters.

  **Freelancer profiles**             Portfolios, experience, project
                                      history, reviews, ratings,
                                      messaging, and escrow contract
                                      creation.

  **Command palette**                 Universal search and quick
                                      navigation with `Ctrl + K`
                                      (Windows/Linux) or `Cmd + K`
                                      (macOS).
  -----------------------------------------------------------------------

## Platform modules

### Find Talent

-   Discover and explore freelancer profiles.
-   Search and filter candidates.
-   Use quick filters and stateful pagination.
-   Start conversations through interactive messaging modals.

### Find Work

-   Browse freelance opportunities.
-   Search and filter available projects.
-   Inspect detailed project scopes in a drawer.
-   Review milestone-based escrow schedules.
-   Submit proposals.

### Projects Hub

The Projects Hub brings seven project workflows together:

  -----------------------------------------------------------------------
  Module                              Capabilities
  ----------------------------------- -----------------------------------
  **Projects Directory**              Track projects, filter by status,
                                      view progress, and create projects.

  **Proposals Manager**               Review bids and pitch details, then
                                      accept proposals.

  **Live Messages**                   Split-pane messaging interface with
                                      message sending.

  **Deliverables Drive**              Manage files, preview metadata, and
                                      use upload/download interactions.

  **Squad & Team Roster**             Manage contributors, assign roles
                                      and permissions, and send
                                      invitations.

  **Escrow Financials**               Track escrow balances, release
                                      payouts, and manage receipts.

  **Workspace Settings**              Configure security preferences, 2FA
                                      toggles, and notifications.
  -----------------------------------------------------------------------

### Pricing & Resources

-   Pricing plans with INR, USD, and EUR currency options.
-   Monthly and annual billing selection.
-   Expandable FAQ accordion.
-   Searchable knowledge base with articles, guides, playbooks, and
    category filters.

### Global command palette

Use the keyboard shortcut to search across talent, projects, and
resources, then navigate directly to a relevant area of the platform.

```{=html}
<pre>
Windows / Linux     Ctrl + K
macOS               Cmd + K
</pre>
```

------------------------------------------------------------------------

## Architecture

Workverse follows a decoupled client/API/persistence architecture. The
frontend communicates with the REST API, while the backend handles
authentication, routing, persistence, and the financial ledger.

``` mermaid
flowchart TB
    subgraph CLIENT["Frontend application · React 19 + Vite 8"]
        UI["Ivory & charcoal interface"]
        GSAP["GSAP 3 animation engine"]
        DND["HTML5 native Kanban drag & drop"]
        STATE["Client / Freelancer persona state"]
    end

    subgraph API["REST API layer · Node.js + Express 5"]
        ROUTER["Express REST router · /api/*"]
        AUTH["JWT bearer authentication"]
        CORS["CORS & request sanitization"]
        DOCS["OpenAPI 3.0 · Swagger UI"]
    end

    subgraph DATA["Persistence & financial engine"]
        DB[("SQLite · WAL mode")]
        LEDGER["Double-entry escrow & wallet ledger"]
        TABLES["18 normalized relational tables"]
    end

    UI --> ROUTER
    GSAP --> UI
    DND --> ROUTER
    STATE --> AUTH
    ROUTER --> CORS
    ROUTER --> AUTH
    ROUTER --> DOCS
    ROUTER --> DB
    ROUTER --> LEDGER
    LEDGER --> TABLES
    DB --> TABLES
```

### Engineering notes

-   **Frontend:** React 19 application built with Vite 8.
-   **API:** Express 5 REST endpoints.
-   **Authentication:** JWT bearer-token flow.
-   **Persistence:** SQLite configured in Write-Ahead Logging (WAL)
    mode.
-   **Financial workflows:** Escrow and wallet ledger functionality.
-   **API reference:** OpenAPI 3.0 schema and Swagger UI.

## Role-based access

Workverse models two platform personas: **Client** and **Freelancer**.
The available project description identifies persona-specific workflows
and backend security policies, but the original RBAC matrix is
incomplete. The table below therefore summarizes only the documented
distinction.

  -----------------------------------------------------------------------
  Area                    Client persona          Freelancer persona
  ----------------------- ----------------------- -----------------------
  Project creation        Create and scope        Discover projects and
                          projects, set budgets   submit bids
                          and milestones          

  Sprint milestones       Inspect and approve     Move task cards through
                          workflow columns        the board

  Deliverables            Review and download     Upload code and design
                          deliverables            bundles

  Escrow wallet           Deposit, lock, and      Request payouts and
                          release funds           withdrawals

  Workspace               Configure 2FA and       Manage portfolio and
                          auto-disbursement       hourly rates
  -----------------------------------------------------------------------

> **Note:** Backend policy descriptions in the source include validation
> for fixed budgets/hourly rates, optimistic UI with SQLite
> synchronization, SHA-256 metadata verification, non-negative wallet
> assertions, and JWT-authenticated session policies.

------------------------------------------------------------------------

## Technology stack

  Layer               Technologies
  ------------------- -------------------------
  Frontend            React.js, JavaScript
  Build tool          Vite
  Styling             CSS
  Animation           GSAP
  Backend             Node.js, Express 5
  Database            SQLite (WAL mode)
  API specification   OpenAPI 3.0, Swagger UI
  Package manager     npm
  Version control     Git & GitHub

------------------------------------------------------------------------

## Getting started

Run Workverse locally using the frontend and backend development
servers.

### Prerequisites

-   **Node.js:** v18.0.0 or higher
-   **npm:** v9.0.0 or higher
-   **Git**

### 1. Clone the repository

``` bash
git clone https://github.com/rasesh13/freelance-project-axlero.git
cd freelance-project-axlero
```

### 2. Start the backend

Open a terminal:

``` bash
cd backend
npm install
npm start
```

Backend base URL: `http://localhost:5000`

  Resource       URL
  -------------- --------------------------------------
  Backend        `http://localhost:5000`
  Swagger UI     `http://localhost:5000/docs`
  OpenAPI JSON   `http://localhost:5000/openapi.json`
  Health check   `http://localhost:5000/api/health`

### 3. Start the frontend

Open a second terminal from the repository root:

``` bash
cd frontend
npm install
npm run dev
```

Frontend development URL: `http://localhost:5173`

------------------------------------------------------------------------

## API documentation

Workverse exposes a REST API with interactive Swagger documentation and
an OpenAPI 3.0 schema.

-   **Swagger UI:**
    [`http://localhost:5000/docs`](http://localhost:5000/docs)
-   **Raw OpenAPI JSON:**
    [`http://localhost:5000/openapi.json`](http://localhost:5000/openapi.json)
-   **Health check:**
    [`http://localhost:5000/api/health`](http://localhost:5000/api/health)

### Endpoint catalog

```{=html}
<details open>
```
```{=html}
<summary>
```
`<strong>`{=html}Health, metrics & authentication`</strong>`{=html}
```{=html}
</summary>
```
  ----------------------------------------------------------------------------
  Method            Endpoint               Description       Auth
  ----------------- ---------------------- ----------------- -----------------
  `GET`             `/api/health`          SQLite WAL        No
                                           connectivity,     
                                           uptime, and       
                                           server status     

  `GET`             `/api/stats`           Aggregated        No
                                           platform metrics  

  `POST`            `/api/auth/login`      Authenticate and  No
                                           issue JWT bearer  
                                           token             

  `POST`            `/api/auth/register`   Register a client No
                                           or freelancer     
                                           account           

  `GET`             `/api/auth/me`         Fetch             Bearer
                                           authenticated     
                                           session claims    
                                           and profile       
  ----------------------------------------------------------------------------

```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}Projects & Kanban`</strong>`{=html}
```{=html}
</summary>
```
  --------------------------------------------------------------------------------
  Method            Endpoint                   Description       Auth
  ----------------- -------------------------- ----------------- -----------------
  `GET`             `/api/projects`            Query projects by No
                                               category, status, 
                                               and text filter   

  `POST`            `/api/projects`            Create a          No
                                               fixed-price or    
                                               hourly project    

  `GET`             `/api/projects/:id`        Retrieve project  No
                                               details and scope 

  `DELETE`          `/api/projects/:id`        Remove a project  No

  `GET`             `/api/kanban`              Retrieve sprint   Bearer
                                               tasks grouped by  
                                               columns           

  `POST`            `/api/kanban`              Create a task     Bearer
                                               card with         
                                               checklist         
                                               subtasks          

  `PATCH`           `/api/kanban/:id/column`   Update a card's   Bearer
                                               column after drag 
                                               and drop          

  `DELETE`          `/api/kanban/:id`          Remove a sprint   Bearer
                                               task card         
  --------------------------------------------------------------------------------

```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}Files, wallet & payments`</strong>`{=html}
```{=html}
</summary>
```
  -----------------------------------------------------------------------------------
  Method            Endpoint                      Description       Auth
  ----------------- ----------------------------- ----------------- -----------------
  `GET`             `/api/files`                  Query project     Bearer
                                                  files and upload  
                                                  metadata          

  `POST`            `/api/files`                  Upload/register   Bearer
                                                  deliverable asset 
                                                  metadata          

  `DELETE`          `/api/files/:id`              Remove a          Bearer
                                                  deliverable file  

  `GET`             `/api/wallet`                 Fetch balance,    Bearer
                                                  escrow holdings,  
                                                  and ledger        
                                                  records           

  `POST`            `/api/wallet/withdraw`        Submit a balance  Bearer
                                                  withdrawal        
                                                  request           

  `POST`            `/api/time/log`               Record billable   Bearer
                                                  time and credit   
                                                  wallet balance    

  `GET`             `/api/payments`               Query escrow      Bearer
                                                  milestone         
                                                  disbursements     

  `PATCH`           `/api/payments/:id/release`   Release milestone Bearer
                                                  funds to a        
                                                  beneficiary       
  -----------------------------------------------------------------------------------

```{=html}
</details>
```
```{=html}
<details>
```
```{=html}
<summary>
```
`<strong>`{=html}Contracts, proposals, messages, search &
settings`</strong>`{=html}
```{=html}
</summary>
```
  ------------------------------------------------------------------------
  Method            Endpoint           Description       Auth
  ----------------- ------------------ ----------------- -----------------
  `GET`             `/api/contracts`   Fetch active      Bearer
                                       engagement        
                                       contracts         

  `GET`             `/api/proposals`   Query freelancer  Bearer
                                       proposals and     
                                       pitch letters     

  `GET`             `/api/messages`    Retrieve          Bearer
                                       conversation      
                                       threads           

  `POST`            `/api/messages`    Send a workspace  Bearer
                                       message           

  `GET`             `/api/search`      Search talent,    No
                                       projects, and     
                                       resources         

  `GET`             `/api/settings`    Retrieve          No
                                       workspace and     
                                       escrow settings   

  `PUT`             `/api/settings`    Update            No
                                       preferences, 2FA, 
                                       and payout limits 
  ------------------------------------------------------------------------

```{=html}
</details>
```

------------------------------------------------------------------------

## Testing and production build

The project includes a backend test runner covering REST API
integration, database checks, and health verification.

### Run the test suite

``` bash
# Unified test suite
npm test --prefix backend

# Individual test stages
npm run test:api --prefix backend
npm run test:db --prefix backend
npm run test:health --prefix backend
```

  Test stage            Reported coverage
  --------------------- ----------------------------------------
  API integration       26 end-to-end REST API tests
  Database audit        13 relational integrity and WAL checks
  Health verification   Backend health-check ping

### Build the frontend

``` bash
cd frontend
npm run build
```

The supplied release notes report a production build of **2,076 modules
transformed with 0 errors**.

------------------------------------------------------------------------

## Project structure

``` text
Workverse/
├── backend/
│   ├── dashboard.js
│   ├── db.js
│   ├── openapi.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

------------------------------------------------------------------------

## Release v1.0.0

**Workverse v1.0.0** marks completion of the documented 10-day milestone
development plan.

```{=html}
<details open>
```
```{=html}
<summary>
```
`<strong>`{=html}10-day development timeline`</strong>`{=html}
```{=html}
</summary>
```
  -----------------------------------------------------------------------
                                       Day Milestone
  ---------------------------------------- ------------------------------
                                        01 Design tokens, palette
                                           configuration, GSAP
                                           animations, responsive navbar

                                        02 Find Talent & Find Work
                                           directories, scope modals,
                                           candidate cards

                                        03 Interactive sprint board,
                                           stopwatch time tracker, 3-step
                                           project setup wizard

                                        04 Express 5 REST API, SQLite WAL
                                           persistence, OpenAPI 3.0 &
                                           Swagger UI

                                        05 Unified app architecture, JWT
                                           authentication, client &
                                           freelancer personas

                                        06 Projects Hub navigation,
                                           escrow wallet telemetry, SVG
                                           donut analytics

                                        07 Milestones delivery board,
                                           native HTML5 drag and drop,
                                           backend column sync

                                        08 Task checklist modals,
                                           split-pane chat drawer, escrow
                                           dispute resolution

                                        09 39-test automated runner,
                                           SQLite integrity audit, health
                                           verification

                                        10 Architecture diagrams, OpenAPI
                                           guide, developer
                                           documentation, v1.0.0 release
  -----------------------------------------------------------------------

```{=html}
</details>
```
### Release verification

-   [x] Frontend production build --- 2,076 modules transformed, 0
    errors (as reported).
-   [x] Backend API integration tests --- 26/26 passed (as reported).
-   [x] Database relational integrity checks --- 13/13 passed (as
    reported).
-   [x] SQLite Write-Ahead Logging mode verified (as reported).
-   [x] OpenAPI 3.0 schema and Swagger UI documented.
-   [x] Linear Git commit stream on branch `rasesh` (as reported).

------------------------------------------------------------------------

## Roadmap

Planned areas for future enhancement:

-   Enhanced real-time notifications.
-   Advanced analytics and reporting.
-   Secure payment gateway integration.
-   Improved file sharing and collaboration.
-   Further automation of project workflows.

------------------------------------------------------------------------

::: {align="center"}
## Workverse

### Where Talent Meets Opportunity.

*Built to empower better collaboration and smarter project management.*

`<br/>`{=html}

**Discover · Collaborate · Deliver**
:::

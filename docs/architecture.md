# After Sales Intelligence – System Architecture (Draft)

## Goal

Build an independent intelligence layer that analyzes after-sales service issues
in the Indian consumer market and guides users toward realistic next steps.

## High-Level Components

### 1. Frontend (Next.js)

- User issue intake
- Timeline and context building
- Display insights and guidance
- Admin / internal views (later)

### 2. Backend (Node.js)

- Agent orchestration
- Data validation and cleanup
- API layer for frontend
- Scheduling and background jobs

### 3. Data Layer

- Primary database (validated cases)
- Temporary user-session data
- Logs and system health data

### 4. AI Layer

- Fast signal classification and triage
- Controlled evidence analysis and validation
- User-facing reasoning with explicit confidence labeling
- Strict separation between signal collection and judgment

## Design Principles

- Monolith-first, modular internally
- Human-readable data flow
- Auditability over raw automation
- Startup-scale, not hyperscale

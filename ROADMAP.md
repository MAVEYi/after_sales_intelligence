# Product Roadmap – After Sales Service Intelligence Initiative

This document describes the staged evolution of the product from a
logic-first MVP to a potential live service.

The roadmap is intentionally incremental to reduce risk, control scope,
and ensure the system remains explainable and auditable at each stage.

---

## Alpha 1 — Architecture & Logic Validation (Current)

**Status:** In Progress  
**Primary Goal:** Validate end-to-end system design without AI dependency.

### Scope

- Full backend + database + frontend pipeline operational
- Rule-based logic simulating analyst and user-facing intelligence
- Seeded / dummy data to validate:
  - signal intake
  - investigation flow
  - case packaging
  - user query resolution
- No external users
- No login
- No AI agents yet

### What This Stage Proves

- The system architecture is sound
- Data flows correctly across layers
- There are no blind spots in agent boundaries
- The product can function deterministically

### Excluded

- Automated web intelligence
- Live RSS ingestion
- AI reasoning
- UX polish

---

## Alpha 2 — AI-Enabled Early Public

**Status:** Planned  
**Primary Goal:** Validate usefulness with real users.

### Scope

- AI agents enabled (Gemini + Jina tools)
- RSS-based signal intake activated
- Real investigation and case creation
- Public access without login
- Feedback collection from early users

### Success Criteria

- Users can resolve real after-sales issues
- Guidance is understandable and relevant
- AI does not hallucinate critical facts

---

## Alpha 3 — Stability & Signal Validation

**Status:** Planned  
**Primary Goal:** Decide whether continued development is justified.

### Scope

- Prompt refinement
- Confidence scoring
- Basic usage analytics
- Performance and reliability improvements

### Outcome

- Go / No-Go decision for Beta phase

---

## Beta 1 — UX & Value Refinement

**Status:** Planned  
**Primary Goal:** Improve experience and perceived value.

### Scope

- UI/UX polish
- Flow simplification
- Feedback-driven improvements
- Minor feature additions

---

## Beta 2 — Final Staging

**Status:** Planned  
**Primary Goal:** Prepare for freeze or live continuation.

### Scope

- Automation
- Documentation finalization
- Stability hardening
- Decide:
  - freeze as portfolio-grade product
  - or continue as live service

---

## Live (Optional)

**Status:** Conditional  
**Primary Goal:** Continuous operation and improvement.

### Scope

- Ongoing maintenance
- Potential Android wrapper app
- Same backend and data model

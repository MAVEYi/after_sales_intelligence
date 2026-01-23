# AFTER SALES INTELLIGENCE – SYSTEM BLUEPRINT

## 1. PURPOSE OF THE SYSTEM

The system exists to act as a neutral intelligence layer between Indian consumers
and fragmented after-sales ecosystems.

The system does NOT:

- sell products
- act as a legal authority
- replace official service channels

The system DOES:

- observe
- classify
- validate
- guide

The goal is informed guidance, not enforcement.

## 2. CORE DESIGN PRINCIPLES (NON-NEGOTIABLE)

These rules apply to the entire system:

1. No single source is trusted
2. No agent has final authority
3. Low confidence data is allowed but never disguised
4. Guidance is provided, not instructions
5. Silence is better than hallucination
6. User identity is disposable by default

If any implementation violates these rules, it is incorrect even if it functions.

## 3. HIGH-LEVEL RUNTIME FLOW

Signal appears
→ Signal Agent observes
→ Classification and confidence assignment
→ Contact Agent enriches and validates
→ Analyst Agent reconciles and normalizes
→ Knowledge Base updated
→ User-facing Agent retrieves and guides

No step is skipped.
No agent communicates directly with users except the User Agent.

## 4. AGENTS AND RESPONSIBILITIES

AGENT 1 — SIGNAL DISCOVERY AND CLASSIFICATION AGENT

Purpose:
Detect potential after-sales incidents and decide whether they are worth tracking.

Inputs:

- broad alerts (brand + geography + service keywords)
- public RSS feeds
- public forums (surface-level only)
- news sites
- company community boards

Explicit constraints:

- no login-required scraping
- no rate-limit abuse
- no deep crawling
- no private user data

Outputs (stored in Investigation Store):

- raw text
- source metadata
- preliminary classification:
  - one-off
  - recurring
  - emerging
  - non-issue
- initial confidence score (low by default)

Failure handling:

- ambiguous signal → parked, not escalated
- low volume → monitored silently

AGENT 2 — CONTACT DISCOVERY AND VALIDATION AGENT

Purpose:
Attach actionable but honest contact information to validated issues.

Inputs:

- issues marked “eligible” by Agent 1
- public brand contact pages
- Google Maps listings
- user-reported contact success or failure (if available)

Validations performed:

- is the number official
- is it reachable
- is it IVR-only
- is WhatsApp active
- is the address current

Outputs (stored in Enriched Store):

- official contacts (flagged official)
- alternative contacts (flagged community-reported)
- validation status:
  - verified
  - partially verified
  - unverified
- last-checked timestamp

Important rule:
The agent never claims a contact “works”.
It only records observed behavior.

AGENT 3 — ANALYST AND JANITOR AGENT

Purpose:
Prevent system decay and AI hallucination.

This agent operates in two modes.

Analyst mode (slow / thinking):

- cross-check Agent 1 and Agent 2 outputs
- detect duplicates
- resolve conflicts
- adjust confidence levels
- promote or demote cases

Janitor mode (fast):

- clean outdated data
- archive dead issues
- normalize wording
- compress history into summaries

Outputs (stored in Primary Knowledge Base):

- normalized issue records
- confidence-tagged guidance blocks
- historical trails without user identity

AGENT 4 — USER INTERACTION AGENT

Purpose:
Translate system knowledge into human-understandable guidance.

Inputs:

- user-submitted description
- location (optional)
- brand or product (optional)

Responsibilities:

- convert user input into structured context
- retrieve relevant cases
- explain:
  - what is likely happening
  - what options usually exist
  - what has worked for others
- present confidence disclaimers clearly

Important rule:
This agent never invents new facts.
If the system does not know, it says so.

User data handling:

- stored temporarily
- stripped of identity
- deleted after extraction window

## 5. DATA STORES (CONCEPTUAL)

Investigation Store:

- raw, unverified signals

Enriched Store:

- signals with attached contact data

Primary Knowledge Base:

- validated and normalized intelligence

User Session Store:

- temporary user inputs only

No store modifies another without an agent acting as intermediary.

## 6. CONFIDENCE MODEL

All outputs must be labeled as one of:

High confidence:

- multiple sources
- time consistency

Medium confidence:

- partial validation
- low to moderate volume

Low confidence:

- early signals
- anecdotal patterns

Low confidence data is allowed only with explicit labeling.

## 7. WHAT THE SYSTEM WILL NOT DO

- predict outcomes
- provide legal advice
- rank brands
- name individuals
- guarantee success
- automate harassment or escalation

These limits protect users, developers, and long-term viability.

## 8. PHASE BOUNDARIES

This blueprint defines Phase 1 and Phase 2 behavior only.

Explicitly excluded:

- monetization
- legal tooling
- pre-purchase advisory
- brand scoring
- automated escalation

Each excluded area requires separate risk analysis.

## 9. DEFINITION OF A WORKING SYSTEM

The system is considered working when:

- agents run independently
- confidence is preserved end-to-end
- false positives are safely parked
- guidance does not overpromise
- the system can say “we don’t know”

The system is NOT considered working when:

- UI is polished
- AI output sounds fluent
- endpoints simply return 200

## 10. CLOSING NOTE

This document is the source of truth for system behavior.

Code, UI, and deployment may change.
This logic must not drift.

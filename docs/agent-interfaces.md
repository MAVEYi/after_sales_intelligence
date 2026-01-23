# AFTER SALES INTELLIGENCE – AGENT INTERFACES (PHASE 1)

## GENERAL RULES (APPLY TO ALL AGENTS)

- Agents are stateless between runs
- Agents may only read/write through defined stores
- Agents do not call each other directly
- Agents do not access frontend
- Agents do not modify confidence arbitrarily
- Agents must return structured output

## AGENT 1: SIGNAL DISCOVERY & CLASSIFICATION

Trigger:

- Scheduled (manual or cron-based)

Input:

- Source list (URLs, feeds, text seeds)

Output:

- Signal records only

May write to:

- Investigation Store

May NOT:

- create Cases
- create Contacts
- delete Signals
- interact with users

Failure behavior:

- On uncertainty, classify as non-issue or park

## AGENT 2: CONTACT DISCOVERY & VALIDATION

Trigger:

- Scheduled or invoked by Analyst Agent

Input:

- Eligible Case references
- Brand identifiers

Output:

- Contact records with validation metadata

May write to:

- Enriched Store

May NOT:

- modify Case confidence
- remove Contacts
- promise effectiveness

Failure behavior:

- Mark contact as unverified

## AGENT 3: ANALYST & JANITOR

Trigger:

- Scheduled batch process

Input:

- Signals
- Enriched Contacts

Output:

- Case creation or updates
- Confidence adjustments
- Archival decisions

May write to:

- Primary Knowledge Base

May NOT:

- create Signals
- interact with users
- fabricate missing data

Failure behavior:

- Defer decision
- Preserve prior confidence

## AGENT 4: USER INTERACTION AGENT

Trigger:

- User request

Input:

- User description
- Optional location
- Optional brand/product

Output:

- Guidance object

May write to:

- User Session Store (temporary)

May NOT:

- store persistent user data
- alter Case records
- invent facts

Failure behavior:

- Return “insufficient data” guidance

## AGENT EXECUTION ORDER (PHASE 1)

1. Agent 1 runs independently
2. Agent 2 runs on eligible cases
3. Agent 3 reconciles and normalizes
4. Agent 4 responds to users

No agent skips the chain.

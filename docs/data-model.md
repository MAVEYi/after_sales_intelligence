# AFTER SALES INTELLIGENCE – PHASE 1 DATA MODEL

## 1. SIGNAL

A Signal represents a raw observation that something may be wrong.

Created by:

- Signal Discovery Agent

Fields:

- signal_id (internal identifier)
- source_type (news, forum, social, community)
- source_reference (URL or description)
- raw_text (unprocessed content)
- detected_brand (optional)
- detected_product (optional)
- detected_region (optional)
- detected_at (timestamp)
- initial_classification (one-off / recurring / emerging / non-issue)
- initial_confidence (low by default)

Rules:

- Signals are immutable
- Signals may never be shown to users
- Signals can be archived but not deleted

## 2. CASE

A Case represents a normalized issue pattern derived from one or more signals.

Created by:

- Analyst Agent

Fields:

- case_id
- title (human-readable summary)
- brand
- product_category
- issue_type (service denial, delay, defect, contact failure, etc.)
- regions_affected (list)
- signal_ids (references)
- current_status (active / monitoring / archived)
- confidence_level (low / medium / high)
- first_detected_at
- last_updated_at

Rules:

- A Case must reference at least one Signal
- Multiple Signals may map to one Case
- Cases evolve over time

## 3. CONTACT

A Contact represents a possible channel for after-sales resolution.

Created by:

- Contact Discovery Agent

Fields:

- contact_id
- associated_brand
- contact_type (phone / email / whatsapp / physical)
- contact_value (number, email, address)
- official_status (official / community-reported)
- validation_status (verified / partially verified / unverified)
- last_checked_at
- notes (optional)

Rules:

- Contacts do not claim effectiveness
- Validation reflects observation, not promise
- Contacts may expire

## 4. GUIDANCE

Guidance is what the user-facing agent presents.

Created by:

- User Interaction Agent (assembled dynamically)

Fields:

- guidance_id
- related_case_id
- summary_text
- recommended_actions (descriptive, not imperative)
- confidence_level
- disclaimers
- generated_at

Rules:

- Guidance must reference a Case
- Guidance must carry confidence labeling
- Guidance may say “insufficient data”

## 5. RELATIONSHIPS (SUMMARY)

Signal → Case: many-to-one
Case → Contact: one-to-many
Case → Guidance: one-to-many (generated per interaction)

## 6. PHASE-1 CONSTRAINTS

- No user entity
- No authentication
- No write access from frontend
- No historical metrics
- No personalization

## 7. DATA STORE MAPPING (PHASE 1)

- Signals are stored in the Investigation Queue (DB-1)
- Raw evidence and investigation artifacts are stored temporarily in the Evidence Vault (DB-2)
- Verified Cases and Contacts are stored in the Knowledge Base (DB-3)
- User context and uploads are stored temporarily in the User Context Store (DB-4)
- Admin-seeded context may originate from a separate Admin Seed Store (DB-0)

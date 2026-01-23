# After Sales Intelligence

An early-stage system focused on analyzing and guiding after-sales service issues in the Indian consumer market.

This project explores how fragmented warranties, unreliable service centers, and inconsistent seller responsibility affect consumers after the purchase window closes.

The goal is to build a neutral, independent intelligence layer that helps users understand:

- What kind of after-sales issue they are facing
- What options realistically exist based on brand and location
- What next steps are most likely to work

---

## Project Status

This repository currently contains the **system skeleton only**.

No production logic, scraping, or AI execution has been implemented yet.
The focus at this stage is on **architecture, boundaries, and scalability**.

---

## High-Level Architecture

The system is designed as a **single backend service** with modular internal components, and a separate frontend application.

### Frontend (`/frontend`)

- User-facing web application
- Responsible for input collection and output presentation
- Will communicate with backend via APIs
- Planned to be deployed on Vercel

### Backend (`/backend`)

- Core intelligence layer
- Responsible for data ingestion, validation, and reasoning
- Designed to host multiple internal AI agents
- Planned to be deployed as a single service on Render

---

## Agent-Based Design (Conceptual)

The backend is planned around internal agents with distinct responsibilities:

- **Signal Agent**  
  Detects and classifies public after-sales incidents and complaints

- **Contact Intelligence Agent**  
  Collects and validates official and alternative service contacts

- **Analyst / Maintenance Agent**  
  Deduplicates data, assigns confidence levels, and maintains data quality

- **User Guidance Agent**  
  Translates user input into structured context and suggests next steps

These agents are conceptual at this stage and not yet implemented.

---

## What This Is (and Is Not)

This project is:

- A portfolio-grade system design and implementation
- Focused on real-world consumer pain points
- Built incrementally with transparency

This project is **not**:

- A finished consumer product
- A legal advisory service
- A replacement for official brand support

---

## Next Steps

- Initialize frontend application structure
- Define backend API contracts
- Introduce basic non-production endpoints
- Add environment configuration templates

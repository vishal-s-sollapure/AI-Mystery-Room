# AI Mystery Room — Phase 1: Repository Audit & Gap Report

**Audit Date:** 2026-10-27  
**Specification:** [SPEC.md](file:///c:/Users/VISHAL/OneDrive/Desktop/AI%20Mystery%20Room/SPEC.md) (v1.1.0)  
**Status:** Phase 1 Complete

---

## 1. Feature-by-Feature Gap Matrix

| Feature / Requirement | Current State in Repository | SPEC.md v1.1.0 & Prompt Requirement | Gap Severity | Action Plan |
| :--- | :--- | :--- | :--- | :--- |
| **API Route Structure** | `/api/v1/mysteries` routes in `server.ts` | Base `/api` with `/api/health`, `/api/cases`, `/api/cases/:id`, `/api/cases/:id/clues/:clueId/discover`, `/api/cases/:id/hints`, `/api/cases/:id/accuse`, `/api/cases/:id/result`, `/api/cases/:id/notes`, `/api/my-cases` | **High** | Implement clean REST router adhering to exact specification contracts. |
| **Data Architecture** | 4 separate collections (`Mystery`, `Suspect`, `Evidence`, `InvestigationSession`) | Single unified `MysteryCase` document with embedded `suspects`, `clues`, `hints`, `timeline`, `solution`, `progress` | **High** | Migrate to unified embedded Mongoose schema per SPEC §7.1. Enables atomic state transitions, eliminates multi-collection sync bugs. |
| **Mystery Generation** | Basic prototype generating suspects and evidence; missing hints; evidence counts not strictly aligned | Strict counts: Easy (3s/5c/2h), Medium (4s/7c/3h), Hard (5s/9c/3h). Standard vs Extended case length support. Structured hints (nudge, connection, deduction). | **High** | Enhance Gemini generator with structured JSON schema, caseLength handling, clue teaser/content separation, ordered hints, and bounded retries. |
| **Clue Discovery Mechanism** | Evidence returned all at once; no server-side discovery state or score tie-in | Teaser visible before discovery; full content returned only upon discovery POST; idempotent discovery; 5 pts per distinct clue | **High** | Implement `POST /api/cases/:id/clues/:clueId/discover` with content redaction on case get and point accumulation. |
| **Hints & Penalties** | No hint generation or endpoints exist | Ordered hints, server-enforced limits, -10 pts per successful hint, idempotency keys | **High** | Implement `POST /api/cases/:id/hints` with atomic penalty deduction and progression. |
| **Scoring Engine** | Non-existent | Server-only calculation: `max(0, basePoints + 5*clues - 10*hints)` with 0-floor and full breakdown | **High** | Implement pure scoring service with comprehensive unit tests. |
| **Accusation & Verdict** | Simple check in prototype, missing decisive clue details, why misleading was misleading, score breakdown | Comprehensive accusation evaluation, solution reveal (motive, method, opportunity, explanation, decisive clues), atomic status transition to `completed` | **High** | Implement `POST /api/cases/:id/accuse` and `GET /api/cases/:id/result`. |
| **Investigator Notes** | UI-only mock notes; patched on session in old prototype | Server-persisted notes with autosave, validation, and restore upon refresh/case load | **Medium** | Implement notes persistence in case progress. |
| **My Cases & Resumption** | Endpoint `/api/v1/mysteries` existed but frontend did not call it | Full My Cases drawer/modal or page listing active & completed cases with metadata, score, and resume link | **Medium** | Connect frontend to `/api/cases` list, allow seamless case switching and resume. |
| **Frontend Architecture** | Single static file (`client/src/main.tsx`) with hardcoded mock case ("The Ashford Relic") | Modular multi-page application with real API client, routing (`/`, `/create`, `/cases/:id`, `/cases/:id/investigate`, `/cases/:id/accuse`, `/cases/:id/result`, `/how-to-play`), responsive panels/tabs | **Critical** | Build modular React application preserving the dark cinematic detective aesthetic. |
| **Testing Suite** | No test scripts or automated tests in repository | Unit, integration, and E2E tests covering generation, scoring, clue discovery, hint limits, solution redaction, ownership | **Critical** | Install Vitest + Supertest, write full test suite for server and scoring. |
| **Security & Privacy** | Solutions returned in some responses or partially redacted | Strict redaction of `solution`, `culpritId`, and undiscovered clue contents across all pre-accusation endpoints | **Critical** | Create Zod DTO transformers ensuring zero solution leakage. |

---

## 2. Preserved Assets & Visual Identity

The existing styles in `client/src/styles.css` provide an authentic, high-quality dark cinematic detective aesthetic:
- **Palette:** Dark charcoal base (`#0e1114`, `#161a1f`), muted slate borders (`#262c35`), warm ivory text (`#ede8df`, `#b3ab9d`), aged amber/gold highlights (`#d49a3d`, `#e5ab55`), and restrained burgundy seals (`#6b2828`).
- **Typography:** Playfair/Cinzel style serif headers, clean sans body text, and monospace metadata tags (`CASE FILE`, `CLASSIFIED`, timestamps).
- **Layout:** Evidence desk feel, inspectable suspect directory, interactive clue viewer, timeline events, and confirmation seals.

We will preserve all of these visual design choices and components, wire them to the live API, add the missing pages/modals (Create Mystery with live counts, Hint Tray, My Cases drawer, How To Play guide, and Accusation Confirmation Modal), and ensure complete responsiveness on mobile devices with tabs/drawers.

---

## 3. Plan of Execution (Phases 2–7)

- **Phase 2: Data models, API contracts, validation, security & test setup**
  - Install Vitest and Supertest in server.
  - Implement unified `MysteryCase` Mongoose model.
  - Implement Zod API schemas and public DTO transformers.
  - Implement guest auth middleware (`amr_guest` cookie).
  - Implement standard response envelopes and error handling.
- **Phase 3: Gemini generation, mystery consistency & persistence**
  - Implement `GeminiService` using `@google/genai`.
  - Implement prompt engineering with exact difficulty counts (Easy 3/5/2, Medium 4/7/3, Hard 5/9/3) and case lengths (Standard/Extended).
  - Implement bounded retries and cross-reference validation.
  - Write unit/mock tests for generation.
- **Phase 4: Evidence discovery, suspect profiles, notes, timeline & hints**
  - Implement clue discovery endpoint with full content gating and score update.
  - Implement ordered hint endpoint with penalty and limit enforcement.
  - Implement investigator notes autosave.
  - Write integration tests.
- **Phase 5: Accusation, results, scoring & My Cases**
  - Implement pure scoring engine with zero-floor rule.
  - Implement accusation endpoint with atomic completion and solution reveal.
  - Implement result retrieval and My Cases listing.
  - Write tests for scoring and accusation idempotency.
- **Phase 6: Frontend integration, responsive polish & accessibility**
  - Implement API client (`/api`) with cookie support.
  - Implement client routing: Home, Create, Investigation room, Accusation modal, Result page, How to Play, My Cases.
  - Connect suspect directory, evidence archive, search/filters, clue discovery, hint request, notes autosave, accusation submission.
  - Ensure mobile responsiveness with tabs/collapsible panels.
- **Phase 7: Automated testing, bug fixes, production build & verification**
  - Run `npm test`, `npm run typecheck`, `npm run build`.
  - Verify complete end-to-end player journey.

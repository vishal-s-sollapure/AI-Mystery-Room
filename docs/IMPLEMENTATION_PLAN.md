# AI Mystery Room — Requirement-to-File Implementation Plan

**Specification:** [SPEC.md](file:///c:/Users/VISHAL/OneDrive/Desktop/AI%20Mystery%20Room/SPEC.md) (v1.1.0)  
**Date:** 2026-10-29  
**Status:** Implementation Blueprint Ready

---

## 1. Requirement-to-File Mapping

| Requirement Area | Source of Truth | Primary Files Affected | Key Implementation Details |
| :--- | :--- | :--- | :--- |
| **Data Models & Schema** | SPEC §7.1, §7.2, §7.3 | `server/src/models/case.model.ts`<br>`server/src/types/case.types.ts` | Unified `MysteryCase` document; embedded suspects, clues, hints, timeline, solution, progress; add `lastHintIdempotencyKey` and `lastAccuseIdempotencyKey` to progress. |
| **API Endpoints & Auth** | SPEC §8.1-§8.8<br>Prompt §10 | `server/src/routes/case.routes.ts`<br>`server/src/routes/auth.routes.ts`<br>`server/src/middleware/auth.middleware.ts` | Standard endpoints with Zod validation; `amr_guest` cookie authentication; add `GET /api/auth/session` for session metadata and badge info. |
| **Gemini Mystery Generation** | SPEC §6.1-§6.6<br>Prompt §4 | `server/src/services/gemini.service.ts`<br>`server/src/schemas/api.schema.ts` | Configurable timeout (`GEMINI_TIMEOUT_MS`); prompt tuned for `gemini-3.5-flash-lite`; explicit Standard vs Extended narrative guidance; strict counts (Easy 3s/5c/2h, Medium 4s/7c/3h, Hard 5s/9c/3h); bounded retries; fallback parity. |
| **Scoring Engine** | SPEC §3.1, §3.2<br>Prompt §8 | `server/src/services/scoring.service.ts` | Authoritative formula: `max(0, basePoints + 5*clues - 10*hints)` with 0-floor; base points (100/150/200) only for correct accusation; server-calculated breakdown. |
| **Clue Discovery & Hints** | SPEC §4.4, §4.5<br>Prompt §5, §8 | `server/src/services/mystery.service.ts`<br>`server/src/schemas/dto.schema.ts` | Full clue content gated until discovery POST; repeated discovery is idempotent (no duplicate points); hints ordered (nudge, connection, deduction); idempotency key prevents duplicate penalty. |
| **Accusation & Verdict** | SPEC §4.6<br>Prompt §9 | `server/src/services/mystery.service.ts`<br>`client/src/components/AccuseModal.tsx`<br>`client/src/pages/ResultPage.tsx` | Single final accusation; confirmation step; atomic completion state; full solution reveal (motive, method, opportunity, explanation, decisive clues, misleading explanation); score breakdown. |
| **Suspect Directory** | Prompt §6 | `client/src/pages/InvestigationPage.tsx` | Suspect cards + modal displaying: biography, motive context, alibi, statements, connected clues (clickable), related timeline events. Zero culprit leakage. |
| **Evidence Presentation** | Prompt §5 | `client/src/pages/InvestigationPage.tsx`<br>`client/src/styles.css` | Specialized styling for transcripts, access logs, CCTV/stills, witness statements, documents, physical evidence bags, lab notes; discovery status filter (`All`, `Discovered`, `Sealed`); honest fallbacks; AI-generated disclaimer tags. |
| **Session & Sign In UI** | Prompt §2, §10 | `client/src/pages/HomePage.tsx`<br>`client/src/components/SignInModal.tsx` | "Sign In" navigation item; modal displaying active Guest Investigator ID, explaining session persistence, and supporting session verification. |
| **Testing Suite** | SPEC §12<br>Prompt §13 | `server/src/test/scoring.test.ts`<br>`server/src/test/dto.test.ts`<br>`server/src/test/mystery.service.test.ts`<br>`server/src/test/gemini.validation.test.ts` | Cover all 15 required acceptance categories: Easy/Medium/Hard, Standard/Extended, exact counts, schema validation, unsolvable rejection, clue discovery idempotency, hint limits/penalties, accusation correctness, score floor, solution redaction, auth isolation, notes persistence, My Cases, provider failure handling. |
| **Documentation & Deployment** | SPEC §11, §14<br>Prompt §14 | `.env.example`<br>`README.md`<br>`docs/API.md`<br>`docs/ARCHITECTURE.md` | Accurate environment placeholders; clear architecture docs; verified production build scripts. |

---

## 2. Phase-by-Phase Execution Roadmap

- **Phase 1: Repository Audit & Gap Report** (COMPLETE)
  - Detailed audit of codebase against `SPEC.md` and user requirements.
  - Verification of existing baseline: tests passing, build passing, live model tested.
  - Documentation of gaps and plan.
- **Phase 2: Data Models, API Contracts, Validation, and Security**
  - Add `lastHintIdempotencyKey` and `lastAccuseIdempotencyKey` to `MysteryCase.progress` in `case.model.ts`.
  - Add `GET /api/auth/session` endpoint for guest identity inspection in `case.routes.ts` / `auth.routes.ts`.
  - Enforce `idempotencyKey` on `discoverClue`, `requestHint`, and `accuse`.
- **Phase 3: Gemini Generation, Mystery Consistency, and Persistence**
  - Update `server/src/services/gemini.service.ts`:
    * Configurable timeout (`env.GEMINI_TIMEOUT_MS`, default 25000ms).
    * Enhanced prompt with explicit narrative instructions for Standard vs Extended case length.
    * Extended procedural fallback with deeper contextual descriptions matching `caseLength`.
    * Strict cross-reference and integrity validation.
  - Add unit tests for Gemini validation schemas and unsolvable/contradictory mystery rejection.
- **Phase 4: Evidence Discovery, Suspect Profiles, Notes, Timeline, and Hints**
  - Update `client/src/pages/InvestigationPage.tsx`:
    * Display connected clues and timeline events in suspect modal.
    * Add discovery status filter (`All`, `Discovered`, `Sealed`).
    * Thematic styling for chat, access logs, CCTV stills, witness statements, physical evidence, lab notes.
    * Honest media fallbacks with clear fictional AI labeling.
  - Verify notes persistence with length constraints.
- **Phase 5: Accusation, Results, Scoring, and My Cases**
  - Update `client/src/components/AccuseModal.tsx` with explicit confirmation step and irreversibility warning.
  - Ensure results page displays all required breakdown elements (motive, method, opportunity, decisive proof, misleading clues, score breakdown).
  - Test My Cases listing and active case resumption.
- **Phase 6: Frontend Integration, Responsive Polish, Accessibility, and Error States**
  - Add `SignInModal.tsx` and wire "Sign In" navigation on `HomePage.tsx`.
  - Verify mobile responsive tabs (`Suspects`, `Evidence`, `Timeline & Notes`).
  - Verify keyboard accessibility and focus rings.
- **Phase 7: Automated Testing, Bug Fixes, Production Build, and Deployment Verification**
  - Run full test suite covering all 15 acceptance criteria.
  - Run `npm run typecheck`, `npm run build`.
  - Update `README.md`, `docs/API.md`, `.env.example`.

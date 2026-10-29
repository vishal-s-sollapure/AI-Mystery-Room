# AI Mystery Room — Phase 1: Comprehensive Repository Audit & Gap Report

**Audit Date:** 2026-10-29  
**Specification Reference:** [SPEC.md](file:///c:/Users/VISHAL/OneDrive/Desktop/AI%20Mystery%20Room/SPEC.md) (v1.1.0)  
**Status:** Phase 1 Complete (Baseline Verified, Gap Matrix & Implementation Plan Updated)

---

## 1. Executive Summary

A comprehensive audit was performed across all frontend components, backend controllers, data models, validation schemas, scoring logic, test suites, and environment settings.

The project currently has a working MERN baseline with an Express backend, MongoDB persistence, and a dark cinematic React frontend. However, several critical gaps and production hardening requirements must be completed to satisfy `SPEC.md` and user requirements:

1. **Gemini Model & Timeout Optimization**: Google Gemini has deprecated `gemini-2.5-flash` ("no longer available to new users"). `gemini-3.5-flash-lite` is fully verified and functional. However, the current generation timeout of 10s is too short under network load, causing unnecessary fallbacks. The prompt also does not yet distinguish narrative depth between `standard` and `extended` case lengths.
2. **Idempotency & Request Protection**: `idempotencyKey` schemas exist in `api.schema.ts`, but are not yet tracked in the database or handled in `mysteryService.requestHint` and `accuse` to prevent duplicate penalties or double submissions on retries.
3. **Suspect Profile Completeness**: Section 6 requires displaying connected evidence items and related timeline events within suspect profiles. Currently, the suspect modal only shows basic biographical text.
4. **Evidence Presentation & Honest Media Fallbacks**: Evidence types (`chat`, `access_log`, `video`, `document`, `statement`, `physical`, `lab_note`) should have specialized thematic styling, explicit fictional AI labels, and honest visual placeholders (no fake video controls or broken links). Discovery status filtering ("All", "Discovered", "Sealed") is also needed.
5. **Sign In & Investigator Session Navigation**: The landing page navigation requires "How It Works, My Cases, and Sign In navigation" (SPEC §1.1, §4.7 & Prompt §2, §10). A secure server-issued session is already active via `amr_guest` cookies; a dedicated Investigator Session / Sign In modal and navigation control will expose session status, allow badge viewing, and maintain strict guest ownership.
6. **Accusation Safety & Confirmation**: A two-step explicit confirmation modal with an irreversible-warning acknowledgment is needed before submitting accusations.
7. **Comprehensive Test Suite**: The 15 test categories specified in Section 13 must be thoroughly implemented, verified, and automated.

---

## 2. Feature-by-Feature Gap Matrix

| Feature / Requirement | Current Implementation State | SPEC.md v1.1.0 & Prompt Requirement | Gap Severity | Action Plan |
| :--- | :--- | :--- | :--- | :--- |
| **1. AI Model & Generation** | `gemini-3.5-flash-lite` configured in `.env`, but hardcoded 10s timeout triggers fallback prematurely. `isExtended` not used in prompt. | Configurable timeout (`GEMINI_TIMEOUT_MS`, default 25s). Distinct prompt styling for `standard` (concise forensic brief) vs `extended` (rich narrative, in-depth testimony). Strict count enforcement (Easy 3s/5c/2h, Medium 4s/7c/3h, Hard 5s/9c/3h). | **High** | Update `gemini.service.ts` prompt and timeout logic. Verify model response times and procedural fallback parity. |
| **2. Case Length Support** | Standard and Extended UI buttons exist; passed to backend; but generated narrative differences are minimal. | Standard: concise narrative and compact evidence descriptions. Extended: richer narrative, deeper testimony, more detailed timeline, while retaining identical difficulty counts and scoring rules. | **Medium** | Differentiate prompt guidelines and fallback generation for `caseLength`. Add tests for both lengths across all 3 difficulties. |
| **3. Clue Discovery & Filters** | Clue discovery POST works (+5 pts). Type filter exists. | Add discovery status filter (`All`, `Discovered`, `Sealed`). Ensure repeated clicks never award extra points. Add stylized viewer for each clue type (chat bubbles, access log terminal, evidence bag, surveillance stills) with fictional AI badge. | **Medium** | Enhance `InvestigationPage.tsx` with discovery status toggle and stylized clue views. |
| **4. Suspect Profiles** | Shows name, role, profile, motive, alibi. | Must also show connected evidence items (clickable) and related timeline events per Prompt §6. | **Medium** | Update suspect profile modal to dynamically list connected clues and chronological events. |
| **5. Hint Idempotency** | Hints work with -10 pt penalty and limit enforcement. | Client-supplied `idempotencyKey` must be recorded to guarantee network retries do not charge twice. | **Medium** | Add `lastHintIdempotencyKey` tracking in `MysteryCase.progress` and handle in `requestHint`. |
| **6. Accusation Workflow** | Accusation evaluates culprit, sets completed status, and calculates score. | Add 2-step confirmation with explicit acknowledgment of finality. Support `idempotencyKey`. | **Medium** | Update `AccuseModal.tsx` and `mystery.service.ts` with explicit confirmation and idempotency. |
| **7. Navigation & Sign In** | "How it works" and "My Cases" present. Guest cookie (`amr_guest`) active. | Add "Sign In / Investigator Session" in navigation. Show active investigator dossier ID and session status. | **Low / Polish** | Add `GET /api/auth/session` endpoint and `SignInModal.tsx` on client. |
| **8. Automated Tests** | Unit tests for scoring, DTO, and basic service lifecycle pass (24 tests). | Expand tests to cover all 15 required categories: schema validation, unsolvable case rejection, standard/extended for all difficulties, hint idempotency, unauthorized isolation, Gemini errors. | **High** | Add dedicated test suites in `server/src/test/` and run `npm test`. |
| **9. Production Build & Docs** | Client and server build successfully (`tsc -b && vite build`, `tsc`). | Update `.env.example`, `README.md`, `API.md` with complete architecture, scoring formula, and deployment guidelines. | **Medium** | Update documentation and verify production build. |

---

## 3. Exit Criteria for Phase 1

- [x] Read `SPEC.md` and user instructions completely.
- [x] Full inspection of frontend, backend, models, routes, tests, configuration.
- [x] Real Gemini API model tested and operational (`gemini-3.5-flash-lite`).
- [x] Baseline test suite executed and passed (`npm test` — 24 passing tests).
- [x] Typecheck executed and passed (`npm run typecheck`).
- [x] Production build executed and passed (`npm run build`).
- [x] Requirement-to-file implementation plan documented in `docs/IMPLEMENTATION_PLAN.md`.

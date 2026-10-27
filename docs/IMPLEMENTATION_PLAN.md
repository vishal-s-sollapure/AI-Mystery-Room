# AI Mystery Room — Implementation Plan & Repository Assessment (Phase 1)

**Specification:** [SPEC.md](file:///c:/Users/VISHAL/OneDrive/Desktop/AI%20Mystery%20Room/SPEC.md) (v1.1.0)  
**Status:** Phase 1 Complete (Plan & Assessment Ready)

---

## 1. Executive Summary & Repository Assessment

An initial prototype exists in the repository, but requires alignment with **SPEC.md v1.1.0**:

| Component | Current State | Target State (SPEC v1.1.0) | Gap / Action |
| :--- | :--- | :--- | :--- |
| **API Endpoints** | `/api/v1/mysteries` with disparate routes | `/api/cases`, `/api/health`, `/api/cases/:id/clues/:clueId/discover`, `/api/cases/:id/hints`, `/api/cases/:id/accuse`, `/api/cases/:id/result` | Standardize base URL to `/api` and implement exact endpoint contract. |
| **Data Model** | 4 separate collections (`Mystery`, `Suspect`, `Evidence`, `InvestigationSession`) | Single embedded `MysteryCase` document per SPEC §7.1 | Unify into single embedded schema; simplifies atomic operations, eliminates complex multi-collection sync. |
| **Difficulty & Counts** | Flexible evidence counts (5-14) | Exact counts: Easy (3 suspects, 5 clues, 2 hints), Medium (4 suspects, 7 clues, 3 hints), Hard (5 suspects, 9 clues, 3 hints) | Enforce exact counts in prompt, Zod validation, and database schema. |
| **Scoring Engine** | Non-existent | Server-side authoritative formula: `max(0, basePoints + discoveredCluePoints - hintPenalty)` | Build dedicated scoring service with zero-floor, idempotency, and full breakdown. |
| **Clue & Hint System** | Evidence listing without discovery mechanics or ordered hints | Clue discovery returns full content only on POST; hints ordered by specificity (nudge/connection/deduction) with 10pt penalty | Implement clue discovery with teaser/content split and hint progression with server-enforced limits. |
| **Solution Privacy** | Partial redaction in custom helpers | Strict server-only fields; public DTOs never contain solution, culpritId, or decisive clues prior to verdict | Enforce Zod-based DTO transformers; zero leakage in any pre-accusation endpoint. |
| **Frontend** | Single static mock component in [client/src/main.tsx](file:///c:/Users/VISHAL/OneDrive/Desktop/AI%20Mystery%20Room/client/src/main.tsx) | Complete multi-route application (`/`, `/create`, `/cases/:id`, `/cases/:id/investigate`, `/cases/:id/accuse`, `/cases/:id/result`, `/how-to-play`) | Implement modular React components, API client with cookies, routing, and loading/error states. |
| **Testing** | No test scripts or automated test files | Unit tests for rules/scoring/schemas; integration tests with mocked Gemini provider | Install Vitest + Supertest, write comprehensive test suites for unit and integration testing. |

---

## 2. Requirement-to-File Implementation Map

### 2.1 Backend Architecture (`server/src/`)
```
server/src/
├── config/
│   └── env.ts               # Zod-validated environment config (PORT, MONGODB_URI, GEMINI_API_KEY, GEMINI_MODEL, etc.)
├── models/
│   └── case.model.ts        # Mongoose MysteryCase schema with nested Suspect, Clue, Hint, Timeline, Solution, Progress
├── schemas/
│   ├── api.schema.ts        # Request validation schemas (create case, discover clue, request hint, accuse)
│   ├── gemini.schema.ts     # Strict AI output schema & cross-reference integrity checks
│   └── dto.schema.ts        # Public case DTO, clue DTO, result DTO definitions
├── services/
│   ├── gemini.service.ts    # @google/genai wrapper, structured JSON output, bounded retries (max 2), error handling
│   ├── mystery.service.ts   # Core business logic: case lifecycle, ownership check, progress updates
│   └── scoring.service.ts   # Pure scoring engine implementing SPEC §3.1 formula
├── middleware/
│   ├── auth.middleware.ts   # Secure guest cookie (amr_guest) management
│   ├── error.middleware.ts  # Standard error envelope formatter with request ID
│   └── rate-limit.ts        # Route-level rate limiting
├── routes/
│   ├── health.routes.ts     # GET /api/health
│   └── case.routes.ts       # All /api/cases endpoints
├── app.ts                   # Express app setup (CORS, Helmet, cookies, JSON parsing, routes, error handler)
└── server.ts                # Server bootstrap, DB connection, graceful shutdown
```

### 2.2 Frontend Architecture (`client/src/`)
```
client/src/
├── components/
│   ├── layout/              # Navbar, Footer, CaseHeader, Breadcrumbs
│   ├── ui/                  # Button, Badge, Modal, Card, Tabs, Spinner, Alert
│   └── evidence/            # ClueCard, ClueViewer, SuspectCard, TimelineList
├── pages/
│   ├── HomePage.tsx         # FR-001 - FR-006: Hero, 3-step loop, How to Play, Create CTA
│   ├── CreateMysteryPage.tsx# FR-010 - FR-018: Premise input, difficulty selector, live counts, loader
│   ├── CaseOverviewPage.tsx # Route /cases/:id: Case story, setting, suspect overview, resume CTA
│   ├── InvestigationPage.tsx# Route /cases/:id/investigate: Suspects, clue discovery, teasers, hints, provisional score
│   ├── AccusePage.tsx       # Route /cases/:id/accuse: Suspect selector, confirmation modal, submit
│   ├── ResultPage.tsx       # Route /cases/:id/result: Verdict seal, culprit reveal, explanation, score breakdown
│   ├── HowToPlayPage.tsx    # Detailed rules, scoring explanation, tips
│   └── NotFoundPage.tsx     # Clean 404 with safe back navigation
├── services/
│   └── api.ts               # Fetch client with credentials: 'include', request ID tracking, error handling
├── types/
│   └── case.types.ts        # Shared TypeScript types for cases, clues, hints, suspects, results
├── styles/                  # Tailwind CSS styling with dark charcoal, burgundy & amber theme
├── App.tsx                  # Client-side router matching SPEC §5.1
└── main.tsx                 # Root render
```

---

## 3. Authoritative Game Rules & Logic Matrix

### 3.1 Difficulty Limits
| Difficulty | Suspects | Clues | Hints | Correct Accusation Base Points |
| :--- | :--- | :--- | :--- | :--- |
| **Easy** | 3 | 5 | 2 | 100 |
| **Medium** | 4 | 7 | 3 | 150 |
| **Hard** | 5 | 9 | 3 | 200 |

### 3.2 Scoring Formula
$$\text{Final Score} = \max\left(0, \text{basePoints} + (\text{discoveredClues} \times 5) - (\text{hintsUsed} \times 10)\right)$$
- If accusation is incorrect: $\text{basePoints} = 0$. Clue points and hint penalties still apply (bounded at 0).
- Backend is sole authority for all scoring; client never sends or overrides scores.

---

## 4. Risks & Mitigations

1. **MongoDB Connection String in `.env`:**
   - *Risk:* Accidental CLI output and unescaped characters in password inside `.env`.
   - *Mitigation:* Fix and validate `.env` format, properly URL-encode special characters, add test connection script.
2. **Secret Leakage in `.env.example`:**
   - *Risk:* Real credentials committed to `.env.example`.
   - *Mitigation:* Sanitize `.env.example` with clear placeholders as mandated by SPEC §11.
3. **Gemini Output Inconsistency:**
   - *Risk:* LLM returning incorrect number of clues, missing cross-references, or invalid JSON.
   - *Mitigation:* Schema-constrained generation (`responseJsonSchema`), bounded retry loop (max 2 retries), deterministic post-generation validation with strict Zod schemas before saving to DB.
4. **Accusation & Hint Idempotency:**
   - *Risk:* Network double-click submitting two accusations or deducting hint penalty twice.
   - *Mitigation:* Support client-generated `idempotencyKey` on hints and accusations; atomic checks on case status (`investigating` vs `completed`).

---

## 5. Phase-by-Phase Roadmap

- **Phase 1 (Current):** Inspect and Plan — COMPLETE.
- **Phase 2:** Project setup — scripts (`build`, `test`, `lint`, `typecheck`), Tailwind configuration, Express app structure, environment validation, MongoDB connection.
- **Phase 3:** Models and API contracts — `MysteryCase` Mongoose model, Zod validators, public DTOs, guest cookie authentication, unit & route integration tests.
- **Phase 4:** Gemini mystery generation — `@google/genai` integration, structured prompt, bounded retry, mock provider tests.
- **Phase 5:** Clues, hints, and scoring — Clue discovery endpoint, ordered hint mechanics, scoring engine, idempotency guards, unit tests.
- **Phase 6:** Frontend game flow — React router, all 7 specified pages, detective case-file UI, responsive layouts, API integration.
- **Phase 7:** Security and QA — Solution redaction verification, cross-user isolation test, full test suite pass, production build.
- **Phase 8:** Deployment readiness — MongoDB Atlas verification, environment configuration, build verification.

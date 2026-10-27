# AI Mystery Room --- Single Source of Truth
File: SPEC.md
Version: 1.1.0
Status: Implementation-ready MVP specification
Development method: Spec-Driven Development (SDD)
Frontend: React + Vite + Tailwind CSS
Backend: Node.js + Express
Database: MongoDB + Mongoose
AI: Gemini API via the official @google/genai SDK
Validation: Zod
Deployment target: Vercel frontend, hosted Node.js backend, MongoDB Atlas

This document combines the original project brief with the requirements in the supplied Build Your AI Mystery Room --- Guide Page. It is the authoritative product and engineering specification. If implementation details are missing, Codex must choose the smallest secure, maintainable option and document the decision rather than silently changing product behavior.

---

## 1. Product Overview

AI Mystery Room is an AI-powered fictional detective game. A player submits a short premise, chooses a difficulty, and Gemini generates a mystery with a story, suspects, clues, hints, and a hidden solution. The player investigates by discovering clues, requesting hints when stuck, and finally accusing one suspect. The backend evaluates the accusation and returns a verdict, culprit, explanation, and score.

The objective is a complete, working mystery-solving experience on a deployed website---not just a mockup or a set of disconnected pages.

### 1.1 Core user journey
1. Open the website.
2. Enter a mystery premise and choose a difficulty.
3. Submit the form; the backend validates it and asks Gemini to generate a structured mystery.
4. The backend validates the generated data and stores the case with the solution kept private.
5. Read the case story and inspect suspect profiles.
6. Discover clues as the investigation progresses.
7. Request optional hints if needed.
8. Select and submit a final accusation.
9. See the verdict, culprit, explanation, score breakdown, and case summary.
10. Start a new mystery.

### 1.2 Product principles
- The mystery must be solvable from its clues.
- Every case has exactly one correct culprit.
- Clues, hints, and scoring are validated and recorded by the backend.
- The hidden culprit and solution are never sent to the browser before accusation.
- AI output is untrusted input until it passes schema and consistency validation.
- The complete game must work after deployment.
- All cases, suspects, clues, hints, and evidence are fictional and clearly labeled as AI-generated.

---

## 2. Goals, Scope, and Non-Goals

### 2.1 MVP goals
- Generate a mystery from a user-supplied premise.
- Support Easy, Medium, and Hard difficulty.
- Generate a story, suspects, clues, hints, and a hidden solution.
- Show a dedicated investigation room.
- Let players discover clues and request hints.
- Track progress and score on the server.
- Accept one final accusation per case.
- Reveal the verdict and explanation after accusation.
- Save cases and progress in MongoDB.
- Provide clear loading, empty, validation, and failure states.
- Deploy and verify the complete experience.

### 2.2 Out of scope for the MVP
- Multiplayer or collaborative investigations.
- Real police, CCTV, WhatsApp, or other external private-data integrations.
- Real criminal investigations or claims about real people.
- Payments, subscriptions, leaderboards, social networking, or user-published cases.
- Live voice interrogation.
- Mandatory registration or a complex account system.
- Real video generation as a blocking dependency for case creation. Optional visual assets may enrich the game, but the core game must be playable using generated text and structured clues even if an image/video provider is unavailable.

---

## 3. Difficulty and Scoring --- Authoritative Rules

The following values come directly from the supplied project guide and must not be changed without an explicit specification update.

| Difficulty | Suspects | Clues | Hints | Correct accusation points |
| :--- | :--- | :--- | :--- | :--- |
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

### 3.1 Score formula
```
score = max(0, basePoints + discoveredCluePoints - hintPenalty)
```
Where:
- `basePoints` = 100 for Easy, 150 for Medium, 200 for Hard only when the accusation is correct.
- `discoveredCluePoints` = 5 × number of distinct clues discovered.
- `hintPenalty` = 10 × number of hints used.
- Minimum score = 0.
- An incorrect accusation earns 0 base accusation points. The player may still receive clue-discovery points, less hint penalties, subject to the minimum score of 0.
- A clue is counted once, even if a request is repeated.
- Each hint request is counted once only when the server successfully returns a hint. Failed hint requests do not incur a penalty.
- Score is calculated exclusively on the backend. Never accept a score, base points, clue count, hint count, or correctness flag from the client.

*Example:* A Medium case with a correct accusation, 4 distinct clues discovered, and 1 successful hint gives `150 + (4 × 5) - 10 = 160` points.

### 3.2 Score breakdown in results
Show:
- Difficulty base points, or 0 if incorrect.
- Number of distinct clues discovered and points earned.
- Number of hints used and points deducted.
- Final score.
- Whether the accusation was correct.

---

## 4. Functional Requirements

### 4.1 Home page
- **FR-001:** Explain the game in concise language.
- **FR-002:** Provide a prominent Create Mystery action.
- **FR-003:** Show the three-step loop: Create → Investigate → Accuse.
- **FR-004:** Explain that mysteries and evidence are fictional and AI-generated.
- **FR-005:** Provide How to Play and basic project/privacy information.
- **FR-006:** Work on mobile and desktop.

### 4.2 Create Mystery page
- **FR-010:** Accept a premise from 20 to 1,500 characters.
- **FR-011:** Require one difficulty: Easy, Medium, or Hard.
- **FR-012:** Optionally accept a mystery category; default to a general detective mystery if omitted.
- **FR-013:** Display the required suspect/clue/hint counts for the selected difficulty before submission.
- **FR-014:** Validate inputs in the browser for usability and again on the server for security.
- **FR-015:** Prevent accidental duplicate submissions while generation is in progress.
- **FR-016:** Display generation progress without claiming a case is ready before validation and persistence succeed.
- **FR-017:** Handle Gemini quota, timeout, malformed output, and server errors with a useful message and retry action.
- **FR-018:** Do not expose prompts, API keys, hidden solution, or internal validation details in the response.

### 4.3 Mystery generation
- **FR-020:** Generate title, story, setting, incident, suspects, clues, hints, timeline, and solution.
- **FR-021:** Generate exactly the number of suspects, clues, and hints specified by the difficulty table.
- **FR-022:** Generate exactly one culprit that references an existing suspect.
- **FR-023:** Ensure the solution is supported by the available clues.
- **FR-024:** Validate every required field, enum, ID, reference, and array count before saving.
- **FR-025:** Retry invalid AI output only a bounded number of times.
- **FR-026:** Do not create a playable case if validation fails.
- **FR-027:** Keep the solution in a server-only data structure or server-only fields excluded from every public DTO.
- **FR-028:** Store model and prompt-version metadata for troubleshooting, without storing API secrets.

### 4.4 Investigation room
- **FR-030:** Display the case title, story, difficulty, and progress.
- **FR-031:** Display suspect cards with name, role, profile, motive/context, and alibi when appropriate.
- **FR-032:** Display the list of undiscovered clues without exposing their hidden contents.
- **FR-033:** Allow a player to discover a clue. The server marks it discovered and returns its content.
- **FR-034:** Repeated discovery of the same clue must not grant extra points.
- **FR-035:** Display discovered clues with title, description, category, and relevant timestamp.
- **FR-036:** Provide a timeline or chronology of the case.
- **FR-037:** Show progress, discovered clue count, hint count, and current provisional score.
- **FR-038:** Persist progress so refresh/revisit does not reset it.
- **FR-039:** Provide a clear navigation path to the accusation screen.
- **FR-040:** Do not reveal the culprit through UI text, source maps, API payloads, or client-side state.

### 4.5 Hints
- **FR-045:** Let the player request a hint through a dedicated control.
- **FR-046:** Provide exactly the number of hints specified by difficulty.
- **FR-047:** Hints must guide reasoning without directly naming the culprit or giving away the complete solution.
- **FR-048:** Hints are revealed in order, one per successful request.
- **FR-049:** Each successfully returned hint incurs a 10-point penalty.
- **FR-050:** Enforce hint limits on the backend. Client state cannot bypass the limit.
- **FR-051:** Repeated network retries must not charge twice for the same successful request. Use an idempotency key or equivalent safe request handling.
- **FR-052:** If no hints remain, return a clear HINTS_EXHAUSTED response.

### 4.6 Accusation and results
- **FR-060:** Show all suspects as selectable candidates.
- **FR-061:** Require the player to select one suspect and confirm before submitting.
- **FR-062:** Validate that the selected suspect belongs to the requested case.
- **FR-063:** Permit one final accusation per case/session for the MVP.
- **FR-064:** Compare the accusation to the hidden culprit on the backend.
- **FR-065:** Calculate and persist the score on the backend.
- **FR-066:** Only after the accusation, reveal the verdict, culprit, explanation, motive, method, and decisive clues.
- **FR-067:** Show a score breakdown and a Play Again action.
- **FR-068:** A repeated accusation request must return the existing result or a conflict response; it must not alter the result or award duplicate points.

### 4.7 Case persistence and guest access
- **FR-070:** A player can resume a case after refreshing or revisiting the page.
- **FR-071:** Store progress server-side, including discovered clues, hints used, and case status.
- **FR-072:** Use a secure server-issued guest session or equivalent ownership mechanism.
- **FR-073:** Never trust an arbitrary ownerId sent by the browser.
- **FR-074:** Users must not access or mutate another user's case.
- **FR-075:** Allow a player to start another case without resetting an existing case.
- **FR-076:** If deletion is provided, confirm it and clean up associated assets according to retention rules.

---

## 5. UX and Page Specifications

### 5.1 Required pages
| Route | Purpose and required content |
| :--- | :--- |
| `/` | Product introduction, how it works, Create Mystery action |
| `/create` | Premise form, difficulty selector, counts, validation |
| `/cases/:id` | Case story, suspects, progress, start/resume investigation |
| `/cases/:id/investigate` | Suspects, clue discovery, discovered clues, hints, progress |
| `/cases/:id/accuse` | Suspect selection, confirmation, submission state |
| `/cases/:id/result` | Verdict, culprit, explanation, score breakdown, replay |
| `/how-to-play` | Instructions, clue/hint/score rules |
| `*` | Not-found page with a safe navigation action |

A dashboard/list of saved cases is recommended if time permits, but it must not delay completion of the end-to-end game.

### 5.2 Visual direction
Build a polished, cinematic detective interface with a dark charcoal/graphite base, restrained burgundy and aged-amber accents, warm readable text, subtle borders, and purposeful spacing. Avoid generic blue-and-white dashboards, neon glow, excessive gradients, and decorative effects that reduce readability.

The investigation should feel like a case file or evidence desk, but clarity comes first. Use responsive stacked panels or tabs on mobile rather than shrinking a desktop evidence board.

### 5.3 Required UI states
For each API-driven page/component, handle:
- Initial/loading state.
- Success state.
- Empty state where applicable.
- Validation error.
- Network/server error.
- Retry state where safe.
- Completed/locked state.
- Unauthorized or missing-case state.

Use semantic HTML, keyboard-accessible controls, visible focus, meaningful labels, appropriate contrast, and reduced-motion support.

---

## 6. AI and Mystery Logic

### 6.1 SDK and configuration
Use the official `@google/genai` package on the backend. Keep the Gemini API key exclusively in the server environment. Use a configurable, currently supported Gemini text model; do not hardcode the model name across modules.

### 6.2 Generation pipeline
1. Validate premise and difficulty.
2. Build the generation prompt with the difficulty counts.
3. Request structured mystery data from Gemini.
4. Parse the response and validate it with Zod.
5. Validate unique IDs and all cross-references.
6. Validate clue/hint counts and culprit reference.
7. Run deterministic chronology and solution consistency checks.
8. Persist the valid case and private solution.
9. Return only the public case DTO.

Use bounded retries for malformed or inconsistent output. Do not loop indefinitely or silently fall back to an unrelated mystery.

### 6.3 Required generated mystery fields
- Case title.
- Short premise and full story.
- Category and difficulty.
- Fictional setting and incident summary.
- Exactly 3/4/5 suspects for Easy/Medium/Hard.
- Exactly 5/7/9 clues for Easy/Medium/Hard.
- Exactly 2/3/3 ordered hints for Easy/Medium/Hard.
- Chronological events.
- One hidden culprit ID.
- Hidden motive, method, opportunity, explanation, and decisive clue IDs.
- Public-safe suspect descriptions and clue metadata.

### 6.4 Clue design requirements
Every clue must have a stable ID, title, short teaser, full content, type, optional timestamp, and relevant suspect references. Keep teaser separate from content: teasers may appear before discovery, while full clue contents are returned only after discovery.

Clues must not all point in the same obvious direction. Include meaningful evidence, plausible red herrings, and enough corroboration to distinguish the culprit from innocent suspects. Red herrings must be explainable and must not make the solution unfair.

### 6.5 Hint design requirements
Hints are ordered by increasing specificity:
1. **Nudge:** directs attention to a relevant detail.
2. **Connection:** suggests comparing two clues or a clue and a statement.
3. **Deduction:** narrows the reasoning without directly naming the culprit.

Easy cases use two hints; Medium and Hard use three. Hints must be generated with the mystery and stored before gameplay begins. Do not call Gemini on every hint click; this avoids inconsistent hints, added latency, and unpredictable costs.

### 6.6 Validation limits
Validate at minimum:
- Required field presence and lengths.
- Difficulty enum and exact counts.
- Unique suspect, clue, hint, and timeline IDs.
- Exactly one valid culprit reference.
- All clue/suspect/timeline references resolve.
- Decisive clue IDs exist and are discoverable.
- Chronological values parse correctly.
- No public summary, teaser, or hint explicitly reveals the culprit.
- Every mystery has a defensible explanation based on the clues.

Structural validation is mandatory. Optional AI-based critique can supplement it but cannot replace it. If validation still fails after bounded retries, fail safely and show a retryable error.

---

## 7. Data Model

Use Mongoose schemas and matching TypeScript types. Use separate public response DTOs; never serialize raw database documents directly.

### 7.1 Case document
```typescript
type Difficulty = "easy" | "medium" | "hard";
type CaseStatus = "generating" | "active" | "completed" | "failed";

interface MysteryCase {
  _id: ObjectId;
  ownerId: string;
  title: string;
  premise: string;
  story: string;
  category: string;
  difficulty: Difficulty;
  status: CaseStatus;
  setting: string;
  incidentSummary: string;
  suspects: Suspect[];
  clues: Clue[];
  hints: Hint[];
  timeline: TimelineEvent[];
  solution: {
    culpritId: string;
    motive: string;
    method: string;
    opportunity: string;
    explanation: string;
    decisiveClueIds: string[];
  }; // server-only; never included in public DTO before result
  progress: {
    discoveredClueIds: string[];
    hintsUsed: number;
    accusation?: {
      suspectId: string;
      isCorrect: boolean;
      submittedAt: Date;
    };
    score?: number;
    status: "investigating" | "completed";
  };
  generationMetadata: {
    provider: "gemini";
    model: string;
    promptVersion: string;
    schemaVersion: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### 7.2 Nested types
```typescript
interface Suspect {
  id: string;
  name: string;
  role: string;
  profile: string;
  motiveContext: string;
  alibi: string;
}

interface Clue {
  id: string;
  title: string;
  teaser: string;
  content: string;
  type: "document" | "chat" | "image" | "video" | "statement" | "physical";
  timestamp?: string;
  relatedSuspectIds: string[];
}

interface Hint {
  id: string;
  order: number;
  text: string;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  relatedSuspectIds: string[];
  relatedClueIds: string[];
}
```

Use strict Zod schemas for AI output and request bodies. Mongoose validation is an additional persistence guard, not a replacement for API validation.

### 7.3 Data protection
- The culprit ID and solution must not be returned by create, retrieve, clue, hint, or timeline endpoints.
- Do not send an `isCulprit` field to the client.
- Public clue listing may return undiscovered clue IDs, titles, types, timestamps, and teasers only.
- The clue-discovery endpoint returns full content only for the requested clue after server-side authorization.
- The result endpoint is available only for a completed case and returns the solution and score breakdown.
- Index owner, status, and creation time as useful for retrieval.
- Store dates consistently and validate references.
- Do not store API keys or large base64 media blobs in MongoDB.
- For the MVP, embedding nested case data in a single case document is acceptable because counts are small. Separate collections may be introduced only when justified and documented.

---

## 8. REST API Contract

Base prefix: `/api`  
Use JSON request and response bodies, consistent error codes, and appropriate HTTP status codes. Add a request ID to logs and responses.

### 8.1 Required endpoints
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| GET | `/api/health` | Health check |
| POST | `/api/cases` | Generate and save a mystery |
| GET | `/api/cases/:id` | Retrieve public case details |
| POST | `/api/cases/:id/clues/:clueId/discover` | Discover a clue |
| POST | `/api/cases/:id/hints` | Request the next available hint |
| POST | `/api/cases/:id/accuse` | Submit final accusation |
| GET | `/api/cases/:id/result` | Retrieve result after completion |

Additional endpoints may be added for progress retrieval, case listing, deletion, or asynchronous generation if required. Document any additions in `docs/API.md`.

### 8.2 Create case
Request:
```json
{
  "premise": "A valuable diamond disappears during a private museum event.",
  "difficulty": "medium",
  "category": "theft"
}
```
Success response returns the case ID, public title/story, difficulty, public suspect profiles, clue teasers, hint count, and progress summary. It must not return solution, culpritId, decisive clue mappings, or a hidden correctness flag.
Suggested status: 201 Created for synchronous successful creation. If the implementation uses asynchronous generation, define and document a job/status response instead.

### 8.3 Retrieve case
`GET /api/cases/:id` returns the public case and current progress. It must never return the solution before completion.

### 8.4 Discover clue
Request body may be empty or contain an idempotency key.
Server behavior:
1. Validate case ownership and active status.
2. Validate that the clue belongs to the case.
3. If already discovered, return its content without adding points again.
4. Otherwise mark it discovered and persist progress.
5. Return the full content of that clue and updated score preview.

### 8.5 Request hint
Request body:
```json
{
  "idempotencyKey": "unique-client-generated-key"
}
```
Server behavior:
1. Validate ownership and active case status.
2. Enforce the difficulty-specific hint limit.
3. Return the next pre-generated hint.
4. Persist hint usage exactly once.
5. Return updated score preview and remaining hints.

If the same idempotency key is retried, return the same successful outcome without charging twice.

### 8.6 Accuse
Request:
```json
{
  "suspectId": "suspect_2",
  "idempotencyKey": "unique-client-generated-key"
}
```
Server behavior:
1. Validate ownership and active status.
2. Confirm the suspect belongs to the case.
3. Enforce one final accusation.
4. Evaluate against the private culprit ID.
5. Calculate score from server-recorded progress.
6. Persist accusation, correctness, score, and completion timestamp atomically where possible.
7. Return the verdict and authorized result payload.

### 8.7 Result
`GET /api/cases/:id/result` must return `409 CASE_NOT_COMPLETED` or an equivalent safe error before accusation. After completion, return verdict, culprit, explanation, decisive clues, and score breakdown.

### 8.8 Standard response format
Success:
```json
{
  "success": true,
  "data": {},
  "requestId": "request-id"
}
```
Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please enter a valid mystery premise."
  },
  "requestId": "request-id"
}
```
Suggested error codes include `VALIDATION_ERROR`, `CASE_NOT_FOUND`, `UNAUTHORIZED`, `CLUE_NOT_FOUND`, `HINTS_EXHAUSTED`, `CASE_ALREADY_COMPLETED`, `CASE_NOT_COMPLETED`, `AI_PROVIDER_ERROR`, `AI_OUTPUT_INVALID`, `RATE_LIMITED`, and `INTERNAL_ERROR`.

---

## 9. Security and Reliability
- Keep `GEMINI_API_KEY` on the backend only.
- Never commit `.env` files or secrets.
- Validate every body, query, and route parameter with Zod.
- Use Helmet, restrictive CORS, rate limiting, request-size limits, and centralized error handling.
- Authenticate guest ownership using a server-issued secure session/token; never trust client-supplied owner IDs.
- Use secure, HttpOnly cookies if cookie sessions are used and protect state-changing requests against CSRF.
- Ensure all case reads and mutations enforce ownership.
- Avoid mass assignment; allow only explicit update fields.
- Do not expose stack traces, prompts, hidden solution, or secrets in production errors.
- Use bounded retries and timeouts for Gemini.
- Handle MongoDB and AI-provider failures gracefully.
- Do not use client-calculated scores as authoritative.
- Ensure clue discovery, hint usage, and accusation updates are safe against duplicate requests.
- Use atomic updates or transactions where appropriate to prevent race conditions.

---

## 10. Project Structure

Recommended starting structure:
```
ai-mystery-room/
├── SPEC.md
├── README.md
├── .gitignore
├── client/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── create-mystery/
│   │   │   ├── investigation/
│   │   │   ├── hints/
│   │   │   └── results/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── main.tsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── validators/
│   │   ├── services/
│   │   │   ├── gemini/
│   │   │   ├── mystery/
│   │   │   └── scoring/
│   │   ├── dto/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    └── TESTING.md
```

TypeScript is recommended for both applications. The guide's essential stack remains React, Vite, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, and Gemini API.

---

## 11. Environment Configuration

Create `.env.example` files with placeholders, never real credentials.

Backend example:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai-mystery-room
GEMINI_API_KEY=replace_with_your_key
GEMINI_MODEL=replace_with_supported_model
CLIENT_URL=http://localhost:5173
SESSION_SECRET=replace_with_long_random_secret
```

Frontend example:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Only public configuration belongs in `VITE_*` variables. Never put Gemini keys, database credentials, or session secrets in the frontend environment.

The server must validate required environment variables at startup and fail with a clear, secret-free message when configuration is missing.

---

## 12. Testing and Acceptance Criteria

### 12.1 Unit tests
Test:
- Difficulty configuration and required counts.
- Premise validation.
- AI-output Zod schemas.
- Unique IDs and reference integrity.
- Clue-discovery idempotency.
- Hint limits and hint penalties.
- Score formula, including the zero floor.
- Correct and incorrect accusations.
- Public DTO solution redaction.
- Ownership and status guards.

### 12.2 Integration tests
Using a mocked Gemini provider, verify:
- Valid case generation and persistence.
- Invalid AI output is rejected or retried a bounded number of times.
- All three difficulty levels have the exact required counts.
- Public case and clue-list endpoints do not reveal hidden solution data.
- Discovering a clue returns content and awards points only once.
- Successful hint requests apply one penalty; failed requests do not.
- Hint exhaustion is enforced server-side.
- Correct accusation gets the proper base score.
- Incorrect accusation gets zero base accusation points.
- Final score never falls below zero.
- Repeated accusation cannot alter or duplicate a result.
- Cross-user access is rejected.
- Result endpoint is blocked before completion.

### 12.3 End-to-end acceptance criteria
The project is ready to submit only when:
- A user can generate Easy, Medium, and Hard mysteries.
- Each difficulty has the exact required suspects, clues, and hints.
- Generated output is validated before being playable.
- The player can inspect suspects and discover clues.
- The player can request hints within the allowed limit.
- Clue points and hint penalties are correct.
- The player can submit an accusation.
- The result reveals the culprit and explanation only after accusation.
- Score is calculated by the backend and displayed with a breakdown.
- The player can start and solve another mystery.
- Progress survives refresh.
- The app handles Gemini/API failures gracefully.
- No hidden solution is present in pre-accusation API responses.
- Production build succeeds and all automated tests pass.
- The deployed website completes the entire game flow.

### 12.4 Verification commands
Document and run the actual scripts configured in `package.json`, including equivalents of:
```bash
npm run lint
npm run typecheck
npm test
npm run build
```
Do not claim a command passed unless it was run. External Gemini calls should be mocked in routine tests; use separate, explicitly configured smoke tests for the real provider.

---

## 13. Implementation Phases for Codex

Implement incrementally. Do not generate the entire application in one unverified step.

### Phase 1 --- Inspect and plan
- Read this entire SPEC.md.
- Inspect the repository and preserve working code.
- Map requirements to modules, API contracts, data models, and tests.
- Record any conflicts or blockers before changing the specification.
- *Exit gate:* A clear implementation plan and repository assessment exist.

### Phase 2 --- Project setup
- Create client and server applications.
- Configure Vite, React, Tailwind, Express, TypeScript, and scripts.
- Configure environment validation, logging, error handling, and health endpoint.
- Connect MongoDB.
- *Exit gate:* Client and server run locally; health check and database connection are verified.

### Phase 3 --- Models and API contracts
- Implement case model, nested schemas, public DTOs, routes, and request validation.
- Implement guest ownership and status checks.
- Add unit and integration tests.
- *Exit gate:* API behavior is tested with fixture data without requiring Gemini.

### Phase 4 --- Gemini mystery generation
- Implement the Gemini service using `@google/genai`.
- Generate structured cases, clues, hints, and hidden solutions.
- Validate counts, IDs, references, and logical requirements.
- Store valid cases and return sanitized DTOs.
- *Exit gate:* Valid fixture/mocked generation tests pass for all difficulty levels.

### Phase 5 --- Clues, hints, and scoring
- Implement clue discovery.
- Implement ordered hints and hint limits.
- Implement server-side scoring.
- Add idempotency and duplicate-request protections.
- *Exit gate:* Scoring and progression tests pass.

### Phase 6 --- Frontend game flow
- Build Home and Create Mystery pages.
- Build case overview and investigation room.
- Build clue discovery and hint controls.
- Build accusation and result pages.
- Add loading/error/empty states and responsive behavior.
- *Exit gate:* The full game works against the local backend.

### Phase 7 --- Security and QA
- Test solution leakage, ownership, malformed inputs, race conditions, and provider failure.
- Run lint, typecheck, tests, and production builds.
- Fix failures before proceeding.
- *Exit gate:* Acceptance criteria pass; any remaining limitations are explicitly documented.

### Phase 8 --- Deployment and submission
- Configure MongoDB Atlas.
- Deploy backend to a suitable Node.js host.
- Configure environment variables and CORS.
- Deploy frontend to Vercel.
- Test the complete production workflow.
- Update README with setup, architecture, environment variables, API overview, tests, and live URL.
- *Exit gate:* Create and solve a mystery on the deployed website; verify all key difficulty, clue, hint, accusation, and scoring behaviors.

### Rules for every phase
- Work only on the current phase unless a dependency requires otherwise.
- Update tests with implementation.
- Run relevant checks and report actual outcomes.
- List files changed, requirements completed, tests passed/failed, and limitations.
- Never silently skip a requirement.
- Do not mark a phase complete while its exit criteria fail.
- Update this spec only after an explicit product decision, and record meaningful changes in a changelog or commit message.

---

## 14. Definition of Done
The MVP is complete when:
- The whole core loop works from premise to final result.
- Difficulty counts match the guide exactly.
- Clue discovery, hints, and scoring work as specified.
- The culprit and solution remain private until accusation.
- Data and progress persist in MongoDB.
- The backend owns all authoritative game state and scoring.
- Errors and provider outages are handled gracefully.
- The app is responsive and usable.
- Tests, type checks, lint, and production builds pass.
- The application is deployed and the live workflow has been tested.
- GitHub repository and live website URL are ready for submission.

A page existing is not proof of completion. Each feature must work end-to-end, including API integration, validation, persistence, error states, and tests.

---

## 15. Submission and Project Guide Notes
The supplied guide lists:
- Project: AI Mystery Room.
- Submission form: https://bit.ly/ai-mystery-room-sub-form
- Deadline stated in the guide: 2 November, 11:59 PM. Confirm the intended year and timezone with the organizer if needed.
- Required submission deliverables: GitHub repository URL and live deployed website URL.
- Required demonstration: Create and solve a mystery on the deployed website.

These are guide-provided details, not application runtime requirements. Verify the submission form and deadline directly before submitting.

---

## 16. Codex Start Prompt
Use the following prompt after adding this file to the repository:

Read SPEC.md completely. It is the single source of truth for AI Mystery Room.
First inspect the repository, existing implementation, dependencies, and scripts. Do not overwrite working code unnecessarily. Start with Phase 1 in Section 13 only.
Produce a requirement-to-file implementation plan and identify risks, missing configuration, and dependencies. Implement only the current phase, add or update tests, run the relevant checks, and report actual results and remaining work.
Preserve all guide-defined rules, especially difficulty counts, hint limits, scoring, server-side validation, and hidden-solution protection. Do not silently change requirements or claim tests passed without running them. Proceed to the next phase only after the current exit gate passes.

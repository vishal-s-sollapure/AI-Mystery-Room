# AI Mystery Room — Product & Engineering Specification

**Document:** `SPEC.md`  
**Project:** AI Mystery Room  
**Version:** 1.0.0  
**Status:** Initial implementation specification  
**Development approach:** Spec-Driven Development (SDD)  
**Primary stack:** MongoDB, Express.js, React, Node.js  
**AI provider:** Google Gemini  
**Primary coding agent:** OpenAI Codex

---

## 1. Project Overview

### 1.1 Product vision

AI Mystery Room is an interactive, AI-powered detective game where users become investigators and solve fictional mysteries using AI-generated evidence.

The user provides a short scenario, story idea, or mystery theme. The AI transforms it into a complete investigation containing a crime or unexplained incident, suspects, timelines, clues, and supporting evidence.

Users examine the evidence, connect the clues, identify contradictions, and select the culprit. The system then evaluates their decision and reveals the complete solution.

The experience should feel like investigating a real case file rather than answering a simple multiple-choice quiz.

### 1.2 Core user journey

1. The user opens the website.
2. The user enters a mystery idea or selects a predefined scenario.
3. The user configures the difficulty and mystery type.
4. The backend asks Gemini to create a consistent fictional mystery.
5. The system generates evidence, including chat messages, images, surveillance footage, and witness statements.
6. The user enters an interactive investigation room.
7. The user examines evidence, suspect profiles, and the timeline.
8. The user selects a suspect and submits a final accusation.
9. The backend evaluates the accusation against the hidden solution.
10. The user receives a result, explanation, and final case report.

### 1.3 Product principles

- **Mystery before decoration:** The investigation must be logically consistent and engaging.
- **Evidence-driven gameplay:** Users should solve cases using clues rather than guesswork.
- **AI-generated content:** Each new case should be generated dynamically from the user's scenario.
- **Server-side truth:** The correct culprit and solution must remain hidden until the case is completed.
- **Reliable generation:** Invalid or contradictory AI responses must not become playable cases.
- **Responsive design:** The application must work on desktop, tablet, and mobile.
- **Privacy and safety:** All cases are fictional and must not expose real people's private information.

---

## 2. Goals and Non-Goals

### 2.1 MVP goals

The initial release must support:

- Custom mystery creation from a user-provided scenario.
- Three difficulty levels: Easy, Medium, and Hard.
- AI-generated cases with a fixed, hidden culprit.
- Multiple suspects with distinct motives, alibis, and profiles.
- AI-generated evidence with metadata and relationships to suspects.
- Evidence inspection and filtering.
- An interactive case timeline.
- Final culprit selection and submission.
- A result screen with an explanation of the solution.
- Saving and resuming investigations.
- Guest play without mandatory registration.
- Persistent case storage in MongoDB.
- Responsive, polished user interfaces.
- Proper loading, validation, retry, and error states.

### 2.2 Non-goals for the initial release

Do not implement these unless explicitly requested in a later specification:

- Multiplayer investigations.
- Live human investigators or chat rooms.
- Real police databases or real criminal investigations.
- Real-world CCTV integrations.
- Public user-generated case publishing.
- Payments, subscriptions, or advertisements.
- A complex social network.
- AI voice conversations with suspects.
- Blockchain, cryptocurrency, or NFTs.

The codebase should remain extensible, but the MVP must prioritize a complete, playable investigation loop.

---

## 3. Target Users and Use Cases

### Primary users

- People who enjoy detective games and escape rooms.
- Mystery and crime-fiction enthusiasts.
- Casual players who want short, interactive challenges.
- Users interested in experimenting with generative AI.

### Core use cases

**UC-01: Create a mystery**

A user submits a short story such as: "A valuable diamond disappears from a locked museum room during a private event."

The system creates a fictional investigation with suspects, evidence, and one correct culprit.

**UC-02: Investigate evidence**

The user opens a suspicious chat conversation, examines an image, reviews surveillance footage, and compares the evidence with suspect alibis.

**UC-03: Build a theory**

The user reviews the timeline, compares contradictions, and identifies which suspect's statements do not match the evidence.

**UC-04: Accuse a suspect**

The user selects one suspect, submits the accusation, and receives a result explaining whether their conclusion was correct.

**UC-05: Resume a case**

A user returns to an unfinished investigation and continues from the previously saved state.

---

## 4. Functional Requirements

Requirements are assigned IDs so that Codex can implement and test them independently.

### 4.1 Landing page

**FR-001:** Display the product name, a short description, and a primary "Create a Mystery" action.

**FR-002:** Display a prominent mystery creation form.

**FR-003:** Include example scenario prompts users can select to populate the form.

**FR-004:** Show the main gameplay steps: Create, Investigate, Accuse, Reveal.

**FR-005:** Include links to About, How to Play, and Privacy information.

**FR-006:** Clearly indicate that all generated investigations are fictional.

### 4.2 Mystery creation

**FR-010:** Accept a user-provided scenario between 20 and 1,500 characters.

**FR-011:** Support the following fields:

- Scenario description.
- Mystery category.
- Difficulty.
- Preferred case length.

**FR-012:** Categories must include theft, disappearance, murder mystery, sabotage, blackmail, and general detective mystery.

**FR-013:** Difficulty options:

- Easy: 3 suspects, approximately 5–7 evidence items.
- Medium: 4 suspects, approximately 8–10 evidence items.
- Hard: 5 suspects, approximately 11–14 evidence items.

These values are initial product defaults and may be adjusted through configuration.

**FR-014:** Case length must support Short, Standard, and Extended presets, with a sensible default.

**FR-015:** Validate input before calling the AI provider.

**FR-016:** Prevent duplicate case-generation requests caused by repeated button clicks.

**FR-017:** Display a progress interface during generation.

**FR-018:** Persist successfully generated cases to MongoDB.

**FR-019:** If generation fails, display a useful error and offer a retry.

**FR-020:** Do not create a playable case until its structure and evidence pass validation.

### 4.3 Investigation room

**FR-030:** Display the case title, incident summary, difficulty, and case status.

**FR-031:** Display suspect cards containing names, roles, portraits where available, motives, and known alibis.

**FR-032:** Display an evidence collection with evidence type, title, timestamp, and summary.

**FR-033:** Allow users to open individual evidence items in a detailed viewer.

**FR-034:** Support filtering evidence by type and searching by title or description.

**FR-035:** Provide an interactive chronological timeline.

**FR-036:** Allow users to mark evidence as reviewed.

**FR-037:** Provide an optional investigator notes area.

**FR-038:** Save reviewed evidence, notes, and progress.

**FR-039:** Display a case progress indicator without exposing the culprit or hidden solution.

**FR-040:** Allow users to return to the dashboard without losing their investigation.

### 4.4 Evidence types

The MVP must support the following evidence types.

**EVIDENCE-01: Chat conversations**

- Fictional WhatsApp-style conversation interface.
- Participants and timestamps.
- Individual messages and conversation context.
- Optional contradictions or clues.
- Clear labeling that the conversation is fictional and AI-generated.

Do not use real WhatsApp credentials or connect to the user's actual WhatsApp account.

**EVIDENCE-02: Images**

- AI-generated scene photographs, object photographs, or fictional forensic images.
- Image title and description.
- Capture timestamp when relevant.
- Clue annotations or hotspot descriptions when appropriate.
- Image viewer with zoom support where practical.

**EVIDENCE-03: Surveillance footage**

- Fictional surveillance clips or animated surveillance sequences.
- Timestamp and camera identifier.
- Video controls where a valid video asset is available.
- Associated incident metadata and relevant observations.

**EVIDENCE-04: Witness statements**

- Written statements from witnesses or suspects.
- Statement timestamps.
- Contradictions with other evidence when relevant.

**EVIDENCE-05: Documents**

- Fictional receipts, access logs, reports, notes, and records.
- Document viewer with realistic formatting.

**EVIDENCE-06: Timeline events**

- Event description.
- Event timestamp.
- Related suspects and evidence references.
- Confidence or reliability metadata where relevant.

Every evidence item must contribute useful information to the investigation. Decorative assets must not be counted as meaningful clues.

### 4.5 Accusation and case resolution

**FR-050:** Provide a final accusation interface.

**FR-051:** Require the user to select one suspect.

**FR-052:** Allow the user to review their decision before submission.

**FR-053:** Submit the accusation to the backend.

**FR-054:** Compare the accusation with the server-stored culprit ID.

**FR-055:** Return a result containing whether the accusation was correct.

**FR-056:** Reveal the solution only after the final accusation is submitted or an explicitly configured reveal action is used.

**FR-057:** Explain the culprit's motive, method, opportunity, and decisive clues.

**FR-058:** Show the evidence items that support the solution.

**FR-059:** Provide a final case report and a "Play Again" action.

**FR-060:** Prevent repeated submissions from creating duplicate results or modifying a completed case.

The MVP uses a single final accusation with no default penalties for incorrect guesses. A limited-attempt mode can be added later.

### 4.6 Case dashboard

**FR-070:** Display active and completed investigations.

**FR-071:** Display case title, difficulty, creation date, and status.

**FR-072:** Allow users to resume active cases.

**FR-073:** Allow users to view results for completed cases.

**FR-074:** Allow users to delete their saved cases after confirmation.

**FR-075:** Support guest sessions using a secure server-issued guest identifier or an equivalent secure ownership mechanism.

### 4.7 Optional accounts

Account registration is not required for the MVP. If authentication is implemented, it must use secure authentication practices and must not be required to play a guest case.

Do not add a complicated authentication system before the guest investigation flow is fully functional.

---

## 5. Application Architecture

Use a modular MERN architecture.

### 5.1 Frontend

- React.
- Vite.
- React Router.
- TypeScript.
- Tailwind CSS.
- A reusable component library or custom design-system components.
- A suitable icon library such as Lucide.
- TanStack Query for server state and API caching.
- React Hook Form with Zod for client-side form validation.

### 5.2 Backend

- Node.js.
- Express.js.
- TypeScript.
- MongoDB.
- Mongoose.
- Zod for API and AI-output validation.
- Official Google Gen AI SDK for Gemini integration.
- Structured application logging.

### 5.3 Infrastructure

- MongoDB Atlas for hosted persistence.
- Vercel or an equivalent platform for the frontend.
- Render or an equivalent Node.js hosting platform for the backend.
- Gemini API credentials stored only in server-side environment variables.

The exact hosting provider may change without changing the core architecture.

### 5.4 Architecture principles

1. The frontend must never call Gemini directly.
2. All AI generation and accusation evaluation must happen on the backend.
3. The backend must validate every incoming request.
4. AI-generated content must be validated before persistence.
5. The hidden culprit and solution must never be included in investigation API responses.
6. Media generation must be separated from mystery generation.
7. AI provider details must be isolated behind service interfaces.
8. The application must support graceful failure when an external AI service is unavailable.

### 5.5 System flow

User → React application → Express API → Validation and business logic → Gemini service → Generated mystery validation → MongoDB → Safe API response → React investigation room.

For image and video generation, the backend uses a separate media-generation service that selects a supported provider and model based on configuration.

---

## 6. Recommended Repository Structure

```text
ai-mystery-room/
├── SPEC.md
├── README.md
├── .gitignore
├── .env.example
├── package.json
│
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── mystery/
│   │   │   ├── evidence/
│   │   │   ├── suspects/
│   │   │   └── ui/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── mystery-creation/
│   │   │   ├── investigation/
│   │   │   ├── accusation/
│   │   │   └── dashboard/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── main.tsx
│   └── tests/
│
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── mysteries/
│   │   │   ├── evidence/
│   │   │   ├── suspects/
│   │   │   ├── accusations/
│   │   │   └── sessions/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── media/
│   │   │   ├── mystery/
│   │   │   └── storage/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   └── tests/
│
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    └── TESTING.md
```

Codex may adjust the folder structure when technically justified, but must preserve the separation between frontend, backend, AI services, domain logic, and persistence.

---

## 7. Database Design

Use MongoDB collections with Mongoose schemas and explicit TypeScript types.

### 7.1 Mystery model

```ts
interface Mystery {
  _id: ObjectId;
  ownerId: string;
  title: string;
  scenario: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  status: "generating" | "active" | "completed" | "failed";
  incident: {
    summary: string;
    location: string;
    occurredAt: string;
    discoveredAt: string;
  };
  suspectIds: ObjectId[];
  evidenceIds: ObjectId[];
  timeline: TimelineEvent[];
  solution?: {
    culpritId: string;
    motive: string;
    method: string;
    opportunity: string;
    explanation: string;
    decisiveEvidenceIds: string[];
  };
  generationMetadata: {
    provider: string;
    model: string;
    promptVersion: string;
    schemaVersion: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

The `solution` field must be restricted to server-side services. Public mystery responses must use a separate response DTO that omits the entire solution.

### 7.2 Suspect model

```ts
interface Suspect {
  _id: ObjectId;
  mysteryId: ObjectId;
  name: string;
  role: string;
  ageDescription?: string;
  biography: string;
  motive: string;
  alibi: string;
  personality: string;
  portraitAssetId?: string;
  publicFacts: string[];
  createdAt: Date;
}
```

The `motive` and `alibi` fields are visible character information, not guaranteed proof of guilt. Do not store a client-visible `isCulprit` flag.

### 7.3 Evidence model

```ts
interface Evidence {
  _id: ObjectId;
  mysteryId: ObjectId;
  type:
    | "chat"
    | "image"
    | "video"
    | "document"
    | "witness_statement"
    | "timeline";
  title: string;
  summary: string;
  description: string;
  timestamp?: string;
  relatedSuspectIds: ObjectId[];
  relatedEvidenceIds: ObjectId[];
  asset?: {
    provider: string;
    mimeType: string;
    storageKey: string;
    thumbnailKey?: string;
    durationSeconds?: number;
  };
  content: Record<string, unknown>;
  clueTags: string[];
  createdAt: Date;
}
```

For chat evidence, `content` contains typed participants and timestamped messages. For image and video evidence, it contains safe descriptive metadata. Validate each evidence subtype with a discriminated schema rather than trusting arbitrary objects.

Internal clue mappings and whether a clue is decisive should remain server-side if they are needed for scoring or solution evaluation.

### 7.4 Investigation session model

```ts
interface InvestigationSession {
  _id: ObjectId;
  mysteryId: ObjectId;
  ownerId: string;
  reviewedEvidenceIds: ObjectId[];
  notes: string;
  status: "active" | "completed";
  accusation?: {
    suspectId: ObjectId;
    isCorrect: boolean;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

The accusation result must be written only by the backend. Enforce one final accusation per session for the MVP.

### 7.5 Database rules

- Add indexes for `ownerId`, `mysteryId`, and frequently queried status/date fields.
- Validate ObjectId references and enforce ownership on every relevant request.
- Use timestamps and consistent UTC storage for dates.
- Apply configurable retention and deletion rules.
- Never store Gemini API keys or other secrets in MongoDB.
- Avoid storing base64 image/video data directly in MongoDB; store media in object storage and retain metadata in MongoDB.
- Do not create indexes that duplicate existing indexes without a clear reason.

---

## 8. AI Mystery Generation

### 8.1 Gemini service responsibilities

Create a dedicated `GeminiMysteryService` that handles:

- Prompt construction.
- Model invocation.
- Structured response generation.
- JSON parsing and schema validation.
- Bounded retries for transient or invalid responses.
- Token and request-size limits.
- Logging and generation metadata.
- Clear error mapping for the API layer.

Use a currently supported Gemini model suitable for structured text generation, configured through environment variables. Do not hardcode a model name throughout the application.

### 8.2 Mystery generation pipeline

1. Validate the user's scenario and settings.
2. Construct a structured mystery-generation prompt.
3. Request the mystery outline, suspects, solution, evidence plan, and timeline.
4. Validate the response against the mystery schema.
5. Verify that all IDs and references are consistent.
6. Run deterministic mystery-integrity checks.
7. Generate media assets for evidence items that require them.
8. Validate and store the assets.
9. Save the case and associated entities in MongoDB.
10. Return a sanitized response containing only investigation-visible data.

If any required stage fails, either retry safely or mark the generation as failed. Never expose a partially generated mystery as a completed playable case.

### 8.3 Core AI prompt requirements

The system prompt must instruct Gemini to:

- Create a completely fictional, self-contained investigation.
- Follow the user's scenario, category, and difficulty.
- Produce exactly one culprit.
- Ensure every suspect has a plausible reason to be investigated.
- Ensure the culprit's motive, method, and opportunity fit the facts.
- Create a coherent chronology of events.
- Produce evidence that is internally consistent.
- Include meaningful clues, misleading but fair red herrings, and contradictions.
- Ensure the solution can be deduced from the available evidence.
- Avoid revealing the culprit in the public case summary or evidence titles.
- Avoid contradictions in dates, locations, identities, and participant names.
- Return structured data matching the expected schema.
- Avoid real-world identifying details and actual accusations against real people.
- Avoid unsafe instructions for committing real crimes or evading law enforcement.

### 8.4 Example structured AI output

```json
{
  "title": "The Midnight Diamond",
  "incident": {
    "summary": "A diamond disappeared during a private museum event.",
    "location": "A fictional museum in Bellhaven",
    "occurredAt": "2026-10-20T21:15:00Z",
    "discoveredAt": "2026-10-20T21:40:00Z"
  },
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Maya Reed",
      "role": "Museum curator",
      "biography": "A curator responsible for the exhibition.",
      "motive": "Under financial pressure",
      "alibi": "Claims she was in the archive"
    }
  ],
  "evidence": [
    {
      "id": "evidence_1",
      "type": "chat",
      "title": "A Late-Night Conversation",
      "summary": "A conversation recorded before the disappearance.",
      "relatedSuspectIds": ["suspect_1"],
      "content": {
        "participants": ["Maya Reed", "Evan Cole"],
        "messages": [
          {
            "timestamp": "2026-10-20T20:55:00Z",
            "sender": "Maya Reed",
            "text": "The gallery will be empty soon."
          }
        ]
      }
    }
  ],
  "timeline": [],
  "solution": {
    "culpritId": "suspect_1",
    "motive": "A financial motive",
    "method": "A fictional method consistent with the evidence",
    "opportunity": "A verified opportunity during the incident",
    "explanation": "The decisive evidence establishes the suspect's involvement.",
    "decisiveEvidenceIds": ["evidence_1"]
  }
}
```

This is a schema illustration, not a finished playable mystery. Production generation must include the required number of suspects, sufficient evidence, a complete timeline, and a logically defensible solution.

### 8.5 Mystery integrity validation

The backend must check:

- Exactly one valid culprit ID exists.
- The culprit ID references an actual suspect.
- All evidence IDs are unique.
- All suspect and evidence references resolve.
- Required difficulty counts are satisfied.
- The chronology is valid.
- Decisive evidence IDs reference actual evidence items.
- The solution is supported by the evidence.
- No public field accidentally contains an explicit solution reveal.
- The mystery contains enough evidence to distinguish the culprit from the innocent suspects.

Use deterministic validation wherever possible. An additional AI-based consistency review may be used, but it must not replace structural validation.

If validation fails, allow a bounded regeneration or repair attempt. Avoid unlimited loops and runaway API costs.

---

## 9. AI-Generated Media

### 9.1 Provider separation

Text generation and media generation must be separate services:

```ts
interface MysteryGenerator {
  generateMystery(input: MysteryInput): Promise<GeneratedMystery>;
}

interface EvidenceMediaGenerator {
  generateImage(input: ImageEvidenceInput): Promise<GeneratedAsset>;
  generateVideo(input: VideoEvidenceInput): Promise<GeneratedAsset>;
}
```

Use appropriate concrete implementations behind these interfaces. If the chosen media provider does not support a requested asset type, report the capability clearly rather than pretending a real asset was generated.

### 9.2 Images

Use a supported Google image-generation model or another explicitly configured image-generation provider.

Each image request should include:

- Case ID.
- Evidence ID.
- Scene description.
- Required visual details.
- Style constraints.
- Relevant fictional time and location.
- Restrictions against real people and identifying details.

Store generated assets in object storage and persist their storage keys in MongoDB.

### 9.3 Surveillance videos

Use a supported video-generation model or service when available. Verify its API capabilities, access requirements, and availability before implementation.

Video generation may be asynchronous. Support job states such as `queued`, `processing`, `completed`, and `failed`, with bounded polling or background job processing.

If video generation is unavailable, the case must clearly indicate that the clip is unavailable or offer an explicitly labeled AI-generated surveillance-style image sequence as an alternative. Never present a still image as an actual video recording.

### 9.4 Media reliability

- Do not block all case creation indefinitely while waiting for a video job.
- Set request timeouts and retry limits.
- Track generation status per asset.
- Validate MIME types and storage keys.
- Generate thumbnails when supported.
- Prevent public access to private media when ownership checks are required.
- Display loading and failure states in the evidence viewer.
- Label generated media as fictional AI-generated content.

### 9.5 Cost and quota management

- Enforce a configurable maximum number of media assets per case.
- Avoid regenerating completed assets on every page load.
- Cache or reuse assets only when the content is genuinely identical and reuse is appropriate.
- Log provider usage and generation failures.
- Never make unsupported assumptions about Gemini pricing, quota, or model availability.

---

## 10. REST API Specification

Base URL: `/api/v1`

All API responses must use consistent JSON structures and appropriate HTTP status codes.

### 10.1 Standard response structure

Successful response:

```json
{
  "success": true,
  "data": {},
  "requestId": "request-id"
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please provide a valid scenario.",
    "details": []
  },
  "requestId": "request-id"
}
```

Do not return stack traces, secret values, internal prompts, or hidden solution data in production error responses.

### 10.2 Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health and readiness checks |
| POST | `/mysteries` | Start mystery generation |
| GET | `/mysteries` | List the current user's cases |
| GET | `/mysteries/:id` | Fetch a sanitized case |
| GET | `/mysteries/:id/evidence` | List evidence |
| GET | `/mysteries/:id/evidence/:evidenceId` | Fetch evidence details |
| GET | `/mysteries/:id/timeline` | Fetch timeline |
| GET | `/mysteries/:id/session` | Fetch investigation progress |
| PATCH | `/mysteries/:id/session` | Save notes and reviewed evidence |
| POST | `/mysteries/:id/accusation` | Submit final accusation |
| GET | `/mysteries/:id/result` | Fetch completed-case result |
| DELETE | `/mysteries/:id` | Delete a user's case |

The case creation endpoint may return a completed case immediately or a generation job ID if asynchronous processing is needed. If asynchronous processing is used, define an explicit generation-status endpoint and document it in `docs/API.md`.

### 10.3 Create mystery request

```json
{
  "scenario": "A priceless diamond disappears during a museum event.",
  "category": "theft",
  "difficulty": "medium",
  "caseLength": "standard"
}
```

Validate all values on the server.

### 10.4 Submit accusation request

```json
{
  "suspectId": "valid-suspect-id"
}
```

The backend must:

1. Verify session ownership.
2. Verify the mystery is playable.
3. Verify the suspect belongs to the mystery.
4. Verify no final accusation has already been submitted.
5. Compare the selected suspect against the hidden solution.
6. Save the result.
7. Return the outcome and authorized explanation.

### 10.5 API security

- Validate all path parameters, query parameters, and request bodies.
- Apply ownership checks to every private resource.
- Rate-limit case generation and accusation requests.
- Limit request sizes and evidence payload sizes.
- Configure CORS for approved frontend origins.
- Use Helmet and appropriate HTTP security headers.
- Use secure, HttpOnly cookies when cookie-based sessions are implemented.
- Protect cookie-authenticated state-changing requests against CSRF.
- Use a secure session strategy for guest play; do not trust a user-supplied `ownerId`.
- Prevent mass assignment by explicitly selecting fields that may be updated.
- Never send the full MongoDB mystery document directly to the frontend.

---

## 11. Frontend Routes

Use React Router.

| Route | Page |
|---|---|
| `/` | Landing page |
| `/create` | Mystery creation |
| `/cases` | Case dashboard |
| `/cases/:id` | Case overview |
| `/cases/:id/investigate` | Investigation room |
| `/cases/:id/evidence/:evidenceId` | Evidence detail |
| `/cases/:id/accuse` | Final accusation |
| `/cases/:id/result` | Case resolution |
| `/how-to-play` | Instructions |
| `/privacy` | Privacy information |
| `*` | Not-found page |

Protect case routes using session ownership checks. Route guards alone are not security; the backend must enforce access control.

---

## 12. UI/UX and Visual Design

### 12.1 Design direction

Create a premium detective-investigation interface inspired by confidential case files, forensic dashboards, evidence boards, and modern narrative games.

The website must feel cinematic, mysterious, polished, and usable—not like a generic AI-generated dashboard.

### 12.2 Color palette

Use a dark, restrained palette:

- Background: charcoal and near-black.
- Surfaces: dark graphite.
- Primary accent: muted burgundy.
- Secondary accent: aged amber.
- Supporting accent: desaturated sage or muted olive.
- Main text: warm off-white.
- Secondary text: muted gray.
- Borders: subtle dark gray.

Use color intentionally. Reserve strong accent colors for key actions, selected evidence, and important statuses. Avoid excessive glow effects, neon colors, generic blue-and-white dashboard styling, and unnecessary gradients.

### 12.3 Typography

Use a clean sans-serif font for the main interface and an optional restrained serif font for case titles and narrative elements.

Maintain readable text sizes, clear hierarchy, and consistent spacing.

### 12.4 Landing page layout

1. Navigation bar with logo and navigation links.
2. Hero section with a strong detective-themed headline.
3. Scenario input panel with example prompts.
4. Difficulty and case-length controls.
5. Primary "Generate Mystery" action.
6. How It Works section.
7. Example evidence preview.
8. Footer with privacy and fictional-content notice.

The scenario creation form must be prominent and usable without scrolling excessively.

### 12.5 Investigation room layout

Desktop:

- Left panel: suspect directory and investigation navigation.
- Center panel: evidence viewer.
- Right panel: case details, timeline, and notes.

On smaller screens, convert the panels into tabs, drawers, or stacked sections. Never force a desktop-width evidence board onto a mobile screen.

### 12.6 Interaction details

- Use skeletons or progress indicators during loading.
- Use clear empty states.
- Provide keyboard-visible focus indicators.
- Add subtle transitions without slowing investigation.
- Use modals for destructive actions and final accusation confirmation.
- Ensure dialogs are keyboard-accessible.
- Provide meaningful image alt text.
- Support keyboard navigation and reduced-motion preferences.
- Do not rely on color alone to communicate evidence status.

### 12.7 Accessibility

Target WCAG 2.2 AA where practical.

Include semantic HTML, appropriate contrast, keyboard support, accessible form labels, screen-reader-friendly status updates, and focus management for dialogs and navigation.

---

## 13. Error Handling and Reliability

Implement centralized error handling on both client and server.

Required error scenarios:

- Invalid scenario input.
- Gemini timeout or quota exhaustion.
- Invalid AI-generated JSON.
- Mystery-integrity validation failure.
- Image or video generation failure.
- MongoDB connection failure.
- Expired or invalid guest session.
- Unauthorized case access.
- Invalid evidence or suspect IDs.
- Duplicate accusation submission.
- Network interruption.
- Deleted or unavailable media.
- Missing configuration or API credentials.

The frontend must provide understandable recovery actions. The backend must log a request ID and technical details without exposing secrets or sensitive user content unnecessarily.

Use bounded retries with backoff for transient failures. Do not retry permanent validation errors indefinitely.

---

## 14. Environment Configuration

Provide `.env.example` files with placeholder values.

Example configuration:

```dotenv
# Server
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai-mystery-room

# Gemini
GEMINI_API_KEY=replace_with_your_key
GEMINI_TEXT_MODEL=replace_with_supported_model

# Media generation
MEDIA_PROVIDER=google
GEMINI_IMAGE_MODEL=replace_with_supported_image_model
VIDEO_PROVIDER=disabled
VIDEO_MODEL=

# Storage
STORAGE_PROVIDER=local
STORAGE_BUCKET=
STORAGE_REGION=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

# Session and security
SESSION_SECRET=replace_with_a_long_random_secret
```

These values are illustrative. The implementation must verify which variables are required for the configured providers and environments.

Never commit `.env` files, real API keys, passwords, or production secrets. Fail fast at startup when mandatory configuration is missing.

Local file storage may be used during development. Production deployments must use persistent storage appropriate for the hosting environment.

---

## 15. Testing Requirements

### 15.1 Unit tests

Test:

- Scenario validation.
- Difficulty configuration.
- Mystery schema validation.
- Suspect and evidence reference integrity.
- Timeline ordering.
- Public-response sanitization.
- Accusation evaluation.
- Ownership and permission helpers.
- Retry and error-mapping logic.

### 15.2 Backend integration tests

Test:

- Creating a mystery using a mocked Gemini provider.
- Rejecting malformed AI responses.
- Persisting a valid mystery.
- Fetching a sanitized case.
- Preventing solution leakage.
- Saving and restoring investigation progress.
- Rejecting unauthorized access.
- Rejecting a suspect from another case.
- Preventing duplicate accusations.
- Handling unavailable media assets.
- Deleting cases and associated resources safely.

### 15.3 Frontend tests

Test:

- Scenario form validation.
- Difficulty selection.
- Generation loading and error states.
- Suspect and evidence rendering.
- Evidence filtering.
- Timeline display.
- Session restoration.
- Accusation confirmation.
- Correct and incorrect result screens.
- Responsive navigation and accessible dialogs.

### 15.4 End-to-end tests

The following flows must pass:

**E2E-01:** A user creates a mystery, opens the investigation, reviews evidence, selects the correct culprit, and sees the solution.

**E2E-02:** A user selects an incorrect suspect and receives the appropriate result.

**E2E-03:** A user refreshes the investigation page and retains saved progress.

**E2E-04:** A user cannot access another user's private investigation.

**E2E-05:** A failed AI generation displays an error and allows a safe retry.

**E2E-06:** The investigation interface works on desktop and mobile.

**E2E-07:** The correct culprit cannot be retrieved through public mystery, evidence, or timeline endpoints before resolution.

### 15.5 Testing policy

- Mock external AI providers in deterministic automated tests.
- Use a small set of explicitly configured integration tests for real Gemini calls.
- Do not require paid AI API access for every test run.
- Include representative fixture cases for all difficulty levels.
- Verify all generated IDs and references.
- Run linting, type checking, unit tests, integration tests, and production builds before declaring a phase complete.

---

## 16. Definition of Done

The MVP is complete only when all of the following are satisfied:

- [ ] The project runs locally using documented commands.
- [ ] MongoDB persistence works.
- [ ] Gemini integration works through the backend.
- [ ] A user can generate a mystery from a custom scenario.
- [ ] Each playable mystery has exactly one valid culprit.
- [ ] The required number of suspects and evidence items is enforced.
- [ ] Generated mysteries pass integrity validation.
- [ ] Evidence items open and render correctly.
- [ ] The timeline is coherent and usable.
- [ ] Users can save and resume progress.
- [ ] Final accusations are evaluated correctly.
- [ ] Solutions are revealed only after authorized resolution.
- [ ] Private case ownership is enforced.
- [ ] Secrets and internal prompts are not exposed.
- [ ] Media failures are handled gracefully.
- [ ] Responsive layouts and accessibility checks pass.
- [ ] Automated tests pass.
- [ ] Production builds succeed.
- [ ] README and API documentation are complete.
- [ ] Deployment and environment setup instructions are documented.

A feature is not complete merely because its page exists or a button responds to a click. It must work end-to-end, including its API, persistence, validation, loading states, error handling, and tests.

---

## 17. Spec-Driven Development Workflow for Codex

`SPEC.md` is the authoritative product specification.

Codex must follow this implementation workflow.

### Phase 1: Repository and architecture

- Inspect the existing repository before modifying it.
- Read `SPEC.md` fully.
- Identify existing code, conventions, dependencies, and deployment constraints.
- Create or update `docs/ARCHITECTURE.md`.
- Define TypeScript types, schemas, API contracts, and environment configuration.
- Do not replace working code without justification.

**Exit criteria:** The architecture and folder structure align with the specification.

### Phase 2: Project foundation

- Set up the client and server.
- Configure TypeScript, linting, formatting, and testing.
- Connect MongoDB.
- Add centralized error handling.
- Add health and readiness checks.
- Create `.env.example` and setup documentation.

**Exit criteria:** Both applications start successfully and automated checks run.

### Phase 3: Mystery domain and persistence

- Implement the mystery, suspect, evidence, and session models.
- Implement request validation and sanitized response DTOs.
- Implement ownership checks.
- Add unit and integration tests.

**Exit criteria:** Mystery data can be stored and retrieved securely without AI integration.

### Phase 4: Gemini integration

- Implement the Gemini service.
- Define structured generation schemas.
- Implement generation, parsing, validation, and bounded retries.
- Add fixture-based tests and mock providers.
- Add hidden-solution protection.

**Exit criteria:** Valid mysteries can be generated and persisted, and malformed responses are rejected.

### Phase 5: Media generation

- Implement the media provider interfaces.
- Integrate supported image generation.
- Integrate video generation only when the configured provider supports it.
- Implement storage, media status tracking, and graceful failure handling.

**Exit criteria:** Every requested media type has a documented supported path or an explicit unavailable state.

### Phase 6: Investigation UI

- Build the landing page and creation form.
- Build suspect cards, evidence viewers, filters, and timeline.
- Build investigation notes and progress persistence.
- Add responsive layouts and accessibility support.

**Exit criteria:** A user can create and investigate a valid case through the UI.

### Phase 7: Accusation and resolution

- Implement final accusation submission.
- Implement server-side evaluation.
- Implement result and explanation screens.
- Enforce one final accusation per session.

**Exit criteria:** Correct and incorrect accusations produce the appropriate results, with no premature solution leakage.

### Phase 8: Quality assurance

- Run all automated tests.
- Test error paths and security boundaries.
- Run linting and type checking.
- Run production builds.
- Verify accessibility and mobile behavior.
- Resolve defects and document any remaining limitations.

**Exit criteria:** All mandatory Definition of Done items pass.

### Phase 9: Deployment

- Configure production environment variables.
- Deploy the backend and frontend.
- Configure MongoDB and persistent media storage.
- Verify production API connectivity and CORS.
- Run end-to-end smoke tests.
- Document deployment and rollback procedures.

**Exit criteria:** The deployed application supports the complete investigation journey.

### Phase execution rules

1. Implement one phase at a time.
2. Read the relevant sections of `SPEC.md` before starting each phase.
3. Write or update tests alongside implementation.
4. Run the phase's verification commands before declaring it complete.
5. Report changed files, completed requirements, test results, and known limitations.
6. Do not silently skip requirements.
7. If a requirement is ambiguous or technically blocked, document the issue and propose the smallest justified change.
8. Update `SPEC.md` only when a deliberate product decision changes the specification.
9. Never mark a phase complete when required tests fail or manual verification remains outstanding.
10. Preserve all previously passing behavior while implementing new features.

---

## 18. Codex Working Rules

The following rules apply throughout development:

- Treat `SPEC.md` as the source of truth for product behavior.
- Treat `docs/API.md` as the source of truth for detailed API contracts, provided it remains consistent with `SPEC.md`.
- Do not invent new product features without justification.
- Do not hardcode secrets, API keys, production URLs, or model names across source files.
- Do not trust AI-generated data without schema and integrity validation.
- Do not expose hidden solutions through public API responses, browser state, or generated assets before resolution.
- Do not substitute static demo data for a required working integration without clearly identifying it as a development fixture.
- Do not use placeholder buttons that appear functional but have no working behavior.
- Avoid unnecessary dependencies and oversized abstractions.
- Prefer typed, modular, maintainable code.
- Do not suppress TypeScript errors to make a build pass.
- Keep development and production configuration separate.
- Ensure every user-facing loading state has a success, failure, or cancellation path.
- Ask for clarification only when an important product decision cannot be safely resolved from this specification.
- Do not claim an API integration works until it has been tested with the appropriate mocks or real provider.

---

## 19. Product Success Metrics

Track these metrics during development and early testing:

- Mystery-generation success rate.
- Percentage of generated cases passing integrity validation.
- Average case-generation time.
- Media-generation success rate by asset type.
- Percentage of users who complete an investigation.
- Correct-accusation rate across controlled test cases.
- Frequency of contradictory or ambiguous clues.
- API error rate.
- Cost per generated mystery.
- User feedback on difficulty and enjoyment.

Do not optimize solely for fast generation. A playable mystery with a defensible solution is more important than a quickly generated but logically broken case.

---

## 20. Final Product Requirement

The finished AI Mystery Room must deliver a complete detective experience:

**User scenario → AI-generated mystery → Fictional suspects → AI-generated evidence → Interactive investigation → Final accusation → Evidence-based solution.**

The product must combine the creativity of generative AI with the reliability of conventional software engineering.

The central quality requirement is that the mystery must be solvable. The culprit must be determined before gameplay begins, the evidence must remain consistent with that culprit, and the final explanation must demonstrate how the evidence supports the solution.

A beautiful interface without a coherent investigation is not a successful implementation.

**End of specification.**

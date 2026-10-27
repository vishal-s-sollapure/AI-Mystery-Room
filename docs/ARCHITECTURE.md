# AI Mystery Room — Architecture

The application is structured as a full-stack MERN detective game built with React, Vite, Express, TypeScript, Mongoose, and the official Google Gemini SDK (`@google/genai`).

---

## 1. Separation of Concerns & Security

- **Server-Authoritative Truth:** The solution, culprit identity, and decisive clues are stored exclusively in the private `solution` field of the `MysteryCase` document in MongoDB. No pre-accusation API endpoint ever serializes or returns this data.
- **DTO Transformation Layer:** `toPublicCaseDto` sanitizes cases before sending them to the browser. Undiscovered clues display short teasers only; full forensic content is returned strictly upon an authorized `POST /api/cases/:id/clues/:clueId/discover` request.
- **Scoring Engine:** The scoring formula (`max(0, basePoints + 5*clues - 10*hints)`) is calculated exclusively on the backend. The client never supplies score values or correctness flags.
- **Ownership & Guest Sessions:** Each browser receives a cryptographically secure, HttpOnly, SameSite `amr_guest` cookie (UUID v4). Cross-user case access and mutations are strictly rejected.

---

## 2. Directory Structure

```
├── client/
│   ├── src/
│   │   ├── components/        # Modals (AccuseModal, HowToPlayModal, MyCasesModal)
│   │   ├── pages/             # HomePage, InvestigationPage, ResultPage
│   │   ├── services/          # API fetch client (/api)
│   │   ├── types/             # Shared TypeScript types
│   │   ├── App.tsx            # Main state and hash-route manager
│   │   └── main.tsx           # React root
│   └── styles.css             # Cinematic dark detective styling
├── server/
│   ├── src/
│   │   ├── config/            # Strict Zod environment validation
│   │   ├── middleware/        # authMiddleware, errorMiddleware
│   │   ├── models/            # Unified MysteryCase Mongoose document schema
│   │   ├── routes/            # /api/cases, /api/health
│   │   ├── schemas/           # Zod request validators and public DTO transformers
│   │   ├── services/          # GeminiService, MysteryService, ScoringService
│   │   ├── test/              # Comprehensive test suites (node:test + tsx)
│   │   ├── app.ts             # Express app factory
│   │   └── server.ts          # Server bootstrap and graceful shutdown
└── docs/                      # SPEC.md, API.md, ARCHITECTURE.md, GAP_REPORT.md
```

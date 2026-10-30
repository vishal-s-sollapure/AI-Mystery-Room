# AI Mystery Room

An AI-powered fictional detective investigation game built with React, Vite, Node.js, Express, MongoDB, and the official Google Gemini SDK (`@google/genai`).

Investigate forensic evidence, interview suspects, track timelines, request tactical hints, and submit your final accusation.

---

## 🌐 Live Production Deployments

- **Frontend Game Website:** [https://ai-mystery-room-sqai.vercel.app/](https://ai-mystery-room-sqai.vercel.app/)
- **Backend API Service:** [https://ai-mystery-room-2-qc7n.onrender.com/](https://ai-mystery-room-2-qc7n.onrender.com/)
- **API Health Check Endpoint:** [https://ai-mystery-room-2-qc7n.onrender.com/api/health](https://ai-mystery-room-2-qc7n.onrender.com/api/health)

---

## 1. Authoritative Game Rules & Scoring

| Difficulty | Suspects | Clues | Hints | Correct Accusation Base Points |
| :--- | :--- | :--- | :--- | :--- |
| **Easy** | 3 | 5 | 2 | 100 |
| **Medium** | 4 | 7 | 3 | 150 |
| **Hard** | 5 | 9 | 3 | 200 |

### Score Formula
$$\text{Score} = \max\left(0, \text{basePoints} + (\text{discoveredClues} \times 5) - (\text{hintsUsed} \times 10)\right)$$

- **Base Points:** Awarded only when the accusation correctly identifies the true culprit. Incorrect accusations receive 0 base points.
- **Clue Discovery Points:** +5 points for each distinct clue analyzed. Repeated discovery is idempotent and does not award duplicate points.
- **Hint Penalties:** -10 points per successfully returned hint. Enforced on the backend; retries with the same `idempotencyKey` return the existing hint without additional penalty.
- **Minimum Score Floor:** The final score is strictly bounded at 0.

### Case Lengths
- **Standard:** Concise mystery brief with compact, punchy forensic evidence descriptions (20–35 words each).
- **Extended:** Atmospheric, multi-layered story with in-depth suspect profiles, detailed forensic evidence content (35–65 words each), and comprehensive chronological detail.
- **Integrity Rule:** Case length does not alter difficulty, scoring rules, suspect counts, clue counts, or hint limits.

---

## 2. Key Architecture & Features

- **Full-Stack MERN Architecture:** React + Vite client paired with an Express REST API and unified MongoDB `MysteryCase` document schema.
- **Official Google Gemini Integration:** Uses `@google/genai` with `gemini-3.5-flash-lite` and structured JSON schemas, bounded retries, and high-quality procedural narrative fallback.
- **Strict Solution Privacy:** The culprit identity, motive, method, explanation, and decisive clues are server-only fields strictly redacted from all public DTOs until final verdict.
- **Evidence Archive & Thematic Views:** Specialized forensic presentations for chat transcripts, access logs, CCTV surveillance frames with honest fallbacks (no fake videos), witness statements, lab notes, and physical evidence bags.
- **Suspect Profiles:** Inspectable profiles displaying background, motive context, stated alibis, connected forensic evidence (clickable), and related timeline events.
- **Investigator Notes:** Persistent notes auto-saved with debounce and manual save controls, restored upon refresh and session reload.
- **Two-Step Accusation:** Clear confirmation modal requiring the player to acknowledge that their accusation is permanent and cannot be modified.
- **My Cases Dossier Archive:** Revisit active investigations or review completed verdicts and scoring breakdowns.
- **Guest Session Security:** Server-issued `amr_guest` HttpOnly cookie with UUID v4 verification, enforcing strict case ownership.

---

## 3. Quick Start Locally

### 1. Configure Environment
Ensure `.env` exists in the repository root (see `.env.example`):
```env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai-mystery-room
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_MS=25000
SESSION_SECRET=a_long_random_secret_at_least_32_characters
```

### 2. Install & Run
```bash
# Install dependencies across all npm workspaces
npm install

# Start both backend API (port 5000) and frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Verification & Testing

```bash
# Typecheck TypeScript across all workspaces
npm run typecheck

# Run automated test suite (Scoring, DTOs, Mystery Lifecycle, Schema Integrity)
npm test

# Build production bundles
npm run build
```

---

## 5. Deployment Guidelines

- **Frontend:** Build with `npm run build --workspace client` and deploy static assets to Vercel or any static host. Configure `VITE_API_BASE_URL` or set up reverse proxy routing for `/api`.
- **Backend:** Host on a Node.js runtime (e.g. Render, Railway, Google Cloud Run). Set environment variables from `.env.example`.
- **Database:** Connect via MongoDB Atlas URI. Ensure network access is permitted from backend host IPs.

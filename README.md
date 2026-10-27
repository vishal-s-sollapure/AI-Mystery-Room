# AI Mystery Room

An AI-powered fictional detective game built with React, Vite, Node.js, Express, MongoDB Atlas, and the official Google Gemini SDK (`@google/genai`).

Investigate forensic evidence, interview suspects, track timelines, request tactical hints, and submit your final accusation.

---

## Authoritative Difficulty & Rules

| Difficulty | Suspects | Clues | Hints | Correct Accusation Base Points |
| :--- | :--- | :--- | :--- | :--- |
| **Easy** | 3 | 5 | 2 | 100 |
| **Medium** | 4 | 7 | 3 | 150 |
| **Hard** | 5 | 9 | 3 | 200 |

### Score Formula
$$\text{Score} = \max\left(0, \text{basePoints} + (\text{discoveredClues} \times 5) - (\text{hintsUsed} \times 10)\right)$$

---

## Quick Start Locally

### 1. Configure Environment
Ensure `.env` exists in the repository root:
```env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
SESSION_SECRET=a_long_random_secret_at_least_32_characters
```

### 2. Install & Run
```bash
# Install dependencies across workspaces
npm install

# Start both backend API (port 5000) and frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Verification & Testing

```bash
# Typecheck TypeScript across all workspaces
npm run typecheck

# Run automated unit and integration tests (Scoring, DTOs, Mystery Lifecycle)
npm test

# Build production bundles
npm run build
```

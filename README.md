# AI Mystery Room

An AI-assisted fictional detective game. Create a case, investigate the evidence, and make one final accusation.

## Start locally

1. Copy `.env.example` to `server/.env` and provide a MongoDB URI and Gemini key for live generation.
2. Run `npm install` from the repository root.
3. Run `npm run dev`.
4. Open `http://localhost:5173`.

The client includes a fully playable demonstration case when the API is not yet connected. The server contains the protected API boundary and is ready for persistence and Gemini integration.

## Structure

- `client/` — React/Vite investigation experience.
- `server/` — Express API, request validation, ownership cookie and safe DTOs.
- `docs/` — architecture and API contracts.

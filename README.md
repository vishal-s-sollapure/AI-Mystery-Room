# AI Mystery Room

An AI-assisted fictional detective game. Create a case, investigate the evidence, and make one final accusation.

## Start locally

1. Copy `.env.example` to `server/.env` and provide a MongoDB URI, Gemini API key/model, and a 32+ character session secret.
2. Run `npm install` from the repository root.
3. Run `npm run dev`.
4. Open `http://localhost:5173`.

The client includes a fully playable demonstration case while the live case screens are being connected. The API persists generated mysteries, suspects, evidence, and investigation sessions in MongoDB. Gemini runs only on the server and must be configured before `POST /api/v1/mysteries` can generate a live case.

## Structure

- `client/` — React/Vite investigation experience.
- `server/` — Express API, request validation, ownership cookie and safe DTOs.
- `docs/` — architecture and API contracts.

# AI Mystery Room — API Documentation

Base path: `/api`  
Standard response format:
```json
{
  "success": true,
  "data": {},
  "requestId": "uuid"
}
```
Error response format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description"
  },
  "requestId": "uuid"
}
```

---

## Endpoints

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service and MongoDB readiness check | Public |
| `GET` | `/api/auth/session` | Retrieve current investigator session details and badge ID | Guest Cookie (`amr_guest`) |
| `POST` | `/api/cases` | Generate and persist a new mystery | Guest Cookie (`amr_guest`) |
| `GET` | `/api/cases` | List all cases for current guest session (My Cases) | Guest Cookie (`amr_guest`) |
| `GET` | `/api/cases/:id` | Retrieve sanitized case details (solution strictly redacted) | Guest Cookie (`amr_guest`) |
| `POST` | `/api/cases/:id/clues/:clueId/discover` | Discover clue, uncover forensic text, +5 pts | Guest Cookie (`amr_guest`) |
| `POST` | `/api/cases/:id/hints` | Unlock next sequential hint, -10 pts penalty (accepts optional `idempotencyKey`) | Guest Cookie (`amr_guest`) |
| `PATCH` | `/api/cases/:id/notes` | Save and persist investigator notes (max 10,000 chars) | Guest Cookie (`amr_guest`) |
| `POST` | `/api/cases/:id/accuse` | Submit final accusation, compute score, lock case (accepts optional `idempotencyKey`) | Guest Cookie (`amr_guest`) |
| `GET` | `/api/cases/:id/result` | Retrieve verdict, culprit, solution & score breakdown (completed cases only) | Guest Cookie (`amr_guest`) |

---

## Authoritative Difficulty & Scoring Rules

| Difficulty | Suspects | Clues | Hints | Correct Accusation Base Points |
| :--- | :--- | :--- | :--- | :--- |
| **Easy** | 3 | 5 | 2 | 100 |
| **Medium** | 4 | 7 | 3 | 150 |
| **Hard** | 5 | 9 | 3 | 200 |

### Scoring Formula
$$\text{Score} = \max\left(0, \text{basePoints} + (\text{discoveredClues} \times 5) - (\text{hintsUsed} \times 10)\right)$$
- If accusation is incorrect: `basePoints = 0`.
- The final score never drops below 0.
- Clue discovery points are awarded once per distinct clue. Repeated requests are idempotent.
- Hint penalties (-10 pts) are deducted only once per successfully returned hint. Repeated requests with the same `idempotencyKey` return the existing hint without additional penalty.

# API contract

Base path: `/api/v1`. All responses use `{ success, data, requestId }` or `{ success:false, error, requestId }`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | readiness check |
| POST | `/mysteries` | validate and begin a mystery |
| GET | `/mysteries` | list owned cases |
| GET | `/mysteries/:id` | sanitized case |
| GET | `/mysteries/:id/evidence` | evidence list |
| GET | `/mysteries/:id/session` | investigation progress |
| PATCH | `/mysteries/:id/session` | save notes/reviewed evidence |
| POST | `/mysteries/:id/accusation` | one final accusation |
| GET | `/mysteries/:id/result` | completed result |
| DELETE | `/mysteries/:id` | delete owned case |

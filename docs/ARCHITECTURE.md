# Architecture

The React client communicates only with `/api/v1`. The Express server owns guest identity, validation, generation, persistence and accusation evaluation. It is the only layer permitted to call Gemini or access hidden case solutions.

Public case DTOs exclude `solution`, `culpritId`, internal clue mappings and any field that reveals the answer. A MongoDB-backed implementation should store mysteries, suspects, evidence and investigation sessions in separate collections keyed by an owner ID from a secure HttpOnly cookie.

Generation is implemented as: request validation → structured Gemini JSON response → Zod schema/integrity validation → MongoDB persistence → sanitized DTO. `Mystery`, `Suspect`, `Evidence`, and `InvestigationSession` are separate Mongoose models. Media generation remains a separate provider concern so a failed asset cannot invalidate the textual investigation.

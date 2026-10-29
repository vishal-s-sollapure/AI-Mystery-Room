import { Router } from 'express';
import {
  accuseSchema,
  createCaseSchema,
  notesSchema,
  requestHintSchema,
} from '../schemas/api.schema.js';
import { GeminiService } from '../services/gemini.service.js';
import { MysteryService } from '../services/mystery.service.js';
import { ok } from '../utils/response.js';
import { env } from '../config/env.js';

export const caseRouter = Router();

const geminiService = new GeminiService(env.GEMINI_API_KEY, env.GEMINI_MODEL);
const mysteryService = new MysteryService(geminiService);

// POST /api/cases - Generate and save a mystery
caseRouter.post('/', async (req, res, next) => {
  try {
    const input = createCaseSchema.parse(req.body);
    const caseDto = await mysteryService.createCase(req.ownerId, input);
    return ok(res, caseDto, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/cases - List current user's cases (My Cases)
caseRouter.get('/', async (req, res, next) => {
  try {
    const cases = await mysteryService.listCases(req.ownerId);
    return ok(res, cases);
  } catch (error) {
    next(error);
  }
});

// GET /api/cases/:id - Retrieve public case details
caseRouter.get('/:id', async (req, res, next) => {
  try {
    const caseDto = await mysteryService.getCase(req.ownerId, req.params.id);
    return ok(res, caseDto);
  } catch (error) {
    next(error);
  }
});

// POST /api/cases/:id/clues/:clueId/discover - Discover a clue
caseRouter.post('/:id/clues/:clueId/discover', async (req, res, next) => {
  try {
    const result = await mysteryService.discoverClue(
      req.ownerId,
      req.params.id,
      req.params.clueId
    );
    return ok(res, result);
  } catch (error) {
    next(error);
  }
});

// POST /api/cases/:id/hints - Request the next available hint
caseRouter.post('/:id/hints', async (req, res, next) => {
  try {
    const input = requestHintSchema.parse(req.body || {});
    const result = await mysteryService.requestHint(
      req.ownerId,
      req.params.id,
      input.idempotencyKey
    );
    return ok(res, result);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/cases/:id/notes - Save investigator notes
caseRouter.patch('/:id/notes', async (req, res, next) => {
  try {
    const input = notesSchema.parse(req.body);
    const result = await mysteryService.saveNotes(
      req.ownerId,
      req.params.id,
      input.notes
    );
    return ok(res, result);
  } catch (error) {
    next(error);
  }
});

// POST /api/cases/:id/accuse - Submit final accusation
caseRouter.post('/:id/accuse', async (req, res, next) => {
  try {
    const input = accuseSchema.parse(req.body);
    const result = await mysteryService.accuse(
      req.ownerId,
      req.params.id,
      input.suspectId,
      input.idempotencyKey
    );
    return ok(res, result);
  } catch (error) {
    next(error);
  }
});

// GET /api/cases/:id/result - Retrieve result after completion
caseRouter.get('/:id/result', async (req, res, next) => {
  try {
    const result = await mysteryService.getResult(req.ownerId, req.params.id);
    return ok(res, result);
  } catch (error) {
    next(error);
  }
});

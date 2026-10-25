import crypto from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from './config.js';
import { Evidence, InvestigationSession, Mystery, Suspect } from './models.js';
import { creationSchema } from './schemas.js';
import { generateMystery, GenerationError } from './services/generation.js';

const app = express();
const env = config();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '250kb' }));
app.use(rateLimit({ windowMs: 60_000, max: 30, standardHeaders: 'draft-7', legacyHeaders: false }));

const idSchema = z.string().refine(mongoose.isValidObjectId, 'Invalid id.');
const sessionPatchSchema = z.object({ notes: z.string().max(10_000).optional(), reviewedEvidenceIds: z.array(idSchema).max(30).optional() });
const accusationSchema = z.object({ suspectId: idSchema });
const requestId = () => crypto.randomUUID();
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data, requestId: requestId() });

function getOwner(req: Request, res: Response) {
  const value = req.headers.cookie?.match(/(?:^|;\s*)amr_guest=([^;]+)/)?.[1];
  if (value && /^[a-f0-9-]{36}$/i.test(value)) return value;
  const ownerId = crypto.randomUUID();
  res.cookie('amr_guest', ownerId, { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' });
  return ownerId;
}

function safeMystery(mystery: any, suspects: any[] = []) {
  return { id: mystery._id.toString(), title: mystery.title, scenario: mystery.scenario, category: mystery.category, difficulty: mystery.difficulty, status: mystery.status, incident: mystery.incident, createdAt: mystery.createdAt, updatedAt: mystery.updatedAt, suspects: suspects.map(s => ({ id: s._id.toString(), name: s.name, role: s.role, biography: s.biography, motive: s.motive, alibi: s.alibi, personality: s.personality, publicFacts: s.publicFacts })) };
}

async function ownedMystery(id: string, ownerId: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Mystery.findOne({ _id: id, ownerId }).lean();
}

app.get('/api/v1/health', async (_req, res, next) => { try { await mongoose.connection.db?.admin().ping(); ok(res, { status: 'ready' }); } catch (error) { next(error); } });

app.post('/api/v1/mysteries', async (req, res, next) => {
  try {
    const input = creationSchema.parse(req.body); const ownerId = getOwner(req, res);
    const mystery = await Mystery.create({ ownerId, title: 'Generating case…', scenario: input.scenario, category: input.category, difficulty: input.difficulty, status: 'generating', incident: {}, suspectIds: [], evidenceIds: [], timeline: [], generationMetadata: { provider: 'google', model: env.GEMINI_TEXT_MODEL, promptVersion: '1.0.0', schemaVersion: '1.0.0' } });
    try {
      const generated = await generateMystery(input, env.GEMINI_API_KEY, env.GEMINI_TEXT_MODEL);
      const suspects = await Suspect.insertMany(generated.suspects.map(s => ({ ...s, mysteryId: mystery._id })));
      const evidence = await Evidence.insertMany(generated.evidence.map(e => ({ type: e.type, title: e.title, summary: e.summary, description: e.description, timestamp: e.timestamp, content: e.content, clueTags: e.clueTags, mysteryId: mystery._id, relatedSuspectIds: e.relatedSuspectIndexes.map(index => suspects[index]._id) })));
      mystery.set({ title: generated.title, status: 'active', incident: generated.incident, suspectIds: suspects.map(s => s._id), evidenceIds: evidence.map(e => e._id), timeline: generated.timeline.map(event => ({ description: event.description, timestamp: event.timestamp, confidence: event.confidence, relatedSuspectIds: event.relatedSuspectIndexes.map(index => suspects[index]._id), relatedEvidenceIds: event.relatedEvidenceIndexes.map(index => evidence[index]._id) })), solution: { culpritId: suspects[generated.solution.culpritIndex]._id, motive: generated.solution.motive, method: generated.solution.method, opportunity: generated.solution.opportunity, explanation: generated.solution.explanation, decisiveEvidenceIds: generated.solution.decisiveEvidenceIndexes.map(index => evidence[index]._id) } });
      await mystery.save(); await InvestigationSession.create({ mysteryId: mystery._id, ownerId, reviewedEvidenceIds: [], notes: '', status: 'active' });
      return ok(res, safeMystery(mystery, suspects), 201);
    } catch (error) { mystery.status = 'failed'; await mystery.save(); throw error; }
  } catch (error) { next(error); }
});

app.get('/api/v1/mysteries', async (req, res, next) => { try { const ownerId = getOwner(req, res); const records = await Mystery.find({ ownerId }).sort({ updatedAt: -1 }).lean(); ok(res, records.map(record => safeMystery(record))); } catch (error) { next(error); } });
app.get('/api/v1/mysteries/:id', async (req, res, next) => { try { const mystery = await ownedMystery(req.params.id, getOwner(req, res)); if (!mystery) return notFound(res); const suspects = await Suspect.find({ mysteryId: mystery._id }).lean(); return ok(res, safeMystery(mystery, suspects)); } catch (error) { next(error); } });
app.get('/api/v1/mysteries/:id/evidence', async (req, res, next) => { try { const mystery = await ownedMystery(req.params.id, getOwner(req, res)); if (!mystery) return notFound(res); const items = await Evidence.find({ mysteryId: mystery._id }).select('type title summary timestamp relatedSuspectIds clueTags createdAt').lean(); return ok(res, items.map(item => ({ ...item, id: item._id.toString() }))); } catch (error) { next(error); } });
app.get('/api/v1/mysteries/:id/evidence/:evidenceId', async (req, res, next) => { try { const mystery = await ownedMystery(req.params.id, getOwner(req, res)); if (!mystery) return notFound(res); const item = await Evidence.findOne({ _id: req.params.evidenceId, mysteryId: mystery._id }).lean(); if (!item) return notFound(res); return ok(res, { ...item, id: item._id.toString() }); } catch (error) { next(error); } });
app.get('/api/v1/mysteries/:id/timeline', async (req, res, next) => { try { const mystery = await ownedMystery(req.params.id, getOwner(req, res)); if (!mystery) return notFound(res); return ok(res, mystery.timeline); } catch (error) { next(error); } });
app.get('/api/v1/mysteries/:id/session', async (req, res, next) => { try { const mystery = await ownedMystery(req.params.id, getOwner(req, res)); if (!mystery) return notFound(res); const session = await InvestigationSession.findOne({ mysteryId: mystery._id, ownerId: mystery.ownerId }).lean(); return ok(res, session ? { ...session, id: session._id.toString() } : null); } catch (error) { next(error); } });
app.patch('/api/v1/mysteries/:id/session', async (req, res, next) => { try { const mystery = await ownedMystery(req.params.id, getOwner(req, res)); if (!mystery) return notFound(res); const patch = sessionPatchSchema.parse(req.body); if (patch.reviewedEvidenceIds) { const count = await Evidence.countDocuments({ _id: { $in: patch.reviewedEvidenceIds }, mysteryId: mystery._id }); if (count !== patch.reviewedEvidenceIds.length) return badRequest(res, 'INVALID_EVIDENCE', 'One or more evidence IDs do not belong to this case.'); } const session = await InvestigationSession.findOneAndUpdate({ mysteryId: mystery._id, ownerId: mystery.ownerId }, { $set: patch }, { new: true }).lean(); return ok(res, session); } catch (error) { next(error); } });
app.post('/api/v1/mysteries/:id/accusation', async (req, res, next) => {
  try {
    const ownerId = getOwner(req, res); if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
    const mystery = await Mystery.findOne({ _id: req.params.id, ownerId });
    if (!mystery || mystery.status !== 'active' || !mystery.solution?.culpritId) return notFound(res);
    const { suspectId } = accusationSchema.parse(req.body);
    const session = await InvestigationSession.findOne({ mysteryId: mystery._id, ownerId }); if (!session) return notFound(res);
    if (session.accusation?.submittedAt) return badRequest(res, 'ALREADY_RESOLVED', 'A final accusation already exists.', 409);
    if (!await Suspect.exists({ _id: suspectId, mysteryId: mystery._id })) return badRequest(res, 'INVALID_SUSPECT', 'Suspect does not belong to this case.');
    const solution = mystery.solution; const culpritId = solution?.culpritId;
    if (!culpritId) return notFound(res); const isCorrect = culpritId.toString() === suspectId;
    session.set({ status: 'completed', accusation: { suspectId, isCorrect, submittedAt: new Date() } }); mystery.set({ status: 'completed', completedAt: new Date() }); await Promise.all([session.save(), mystery.save()]);
    return ok(res, { isCorrect, solution: { motive: solution.motive, method: solution.method, opportunity: solution.opportunity, explanation: solution.explanation, decisiveEvidenceIds: solution.decisiveEvidenceIds.map(id => id.toString()) } });
  } catch (error) { next(error); }
});
app.get('/api/v1/mysteries/:id/result', async (req, res, next) => { try { const mystery = await ownedMystery(req.params.id, getOwner(req, res)); if (!mystery || mystery.status !== 'completed') return notFound(res); const session = await InvestigationSession.findOne({ mysteryId: mystery._id, ownerId: mystery.ownerId }).lean(); if (!session?.accusation) return notFound(res); return ok(res, { accusation: session.accusation, solution: mystery.solution }); } catch (error) { next(error); } });
app.delete('/api/v1/mysteries/:id', async (req, res, next) => { try { const mystery = await ownedMystery(req.params.id, getOwner(req, res)); if (!mystery) return notFound(res); await Promise.all([Mystery.deleteOne({ _id: mystery._id }), Suspect.deleteMany({ mysteryId: mystery._id }), Evidence.deleteMany({ mysteryId: mystery._id }), InvestigationSession.deleteMany({ mysteryId: mystery._id })]); return res.status(204).end(); } catch (error) { next(error); } });

function notFound(res: Response) { return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'The requested case was not found.' }, requestId: requestId() }); }
function badRequest(res: Response, code: string, message: string, status = 400) { return res.status(status).json({ success: false, error: { code, message }, requestId: requestId() }); }
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { console.error(error); if (error instanceof z.ZodError) return badRequest(res, 'VALIDATION_ERROR', 'Please provide valid case details.'); if (error instanceof GenerationError) return res.status(422).json({ success: false, error: { code: 'GENERATION_INVALID', message: 'We could not create a coherent case. Please retry.' }, requestId: requestId() }); return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }, requestId: requestId() }); });

async function start() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected');
  app.listen(env.PORT, () => console.log(`AI Mystery Room API listening on port ${env.PORT}`));
}
start().catch(error => { console.error('Failed to start API:', error); process.exit(1); });

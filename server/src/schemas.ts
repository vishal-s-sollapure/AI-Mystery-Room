import { z } from 'zod';

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export const categorySchema = z.enum(['theft', 'disappearance', 'murder_mystery', 'sabotage', 'blackmail', 'general']);
export const creationSchema = z.object({
  scenario: z.string().trim().min(20).max(1500),
  category: categorySchema,
  difficulty: difficultySchema,
  caseLength: z.enum(['short', 'standard', 'extended']).default('standard'),
});

const generatedSuspectSchema = z.object({ name: z.string().min(2), role: z.string().min(2), biography: z.string().min(20), motive: z.string().min(10), alibi: z.string().min(10), personality: z.string().min(3), publicFacts: z.array(z.string()).min(1) });
const generatedEvidenceSchema = z.object({ type: z.enum(['chat', 'image', 'video', 'document', 'witness_statement']), title: z.string().min(3), summary: z.string().min(10), description: z.string().min(20), timestamp: z.string().min(3), relatedSuspectIndexes: z.array(z.number().int().nonnegative()).min(1), clueTags: z.array(z.string()).min(1), content: z.record(z.unknown()).default({}) });
export const generatedCaseSchema = z.object({
  title: z.string().min(3),
  incident: z.object({ summary: z.string().min(20), location: z.string().min(2), occurredAt: z.string().min(3), discoveredAt: z.string().min(3) }),
  suspects: z.array(generatedSuspectSchema).min(3).max(5),
  evidence: z.array(generatedEvidenceSchema).min(5).max(14),
  timeline: z.array(z.object({ description: z.string().min(5), timestamp: z.string().min(3), relatedSuspectIndexes: z.array(z.number().int().nonnegative()), relatedEvidenceIndexes: z.array(z.number().int().nonnegative()), confidence: z.enum(['high', 'medium', 'low']) })).min(4),
  solution: z.object({ culpritIndex: z.number().int().nonnegative(), motive: z.string().min(10), method: z.string().min(10), opportunity: z.string().min(10), explanation: z.string().min(30), decisiveEvidenceIndexes: z.array(z.number().int().nonnegative()).min(2) }),
});

export type GeneratedCase = z.infer<typeof generatedCaseSchema>;

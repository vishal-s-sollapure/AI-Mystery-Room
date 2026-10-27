import { z } from 'zod';

export const difficultyEnum = z.enum(['easy', 'medium', 'hard']);
export const caseLengthEnum = z.enum(['standard', 'extended']);

export const createCaseSchema = z.object({
  premise: z
    .string({ required_error: 'Premise is required' })
    .trim()
    .min(20, 'Premise must be at least 20 characters')
    .max(1500, 'Premise must be at most 1500 characters'),
  difficulty: difficultyEnum,
  category: z.string().trim().min(2).max(50).default('theft'),
  caseLength: caseLengthEnum.default('standard'),
});

export const discoverClueSchema = z.object({
  idempotencyKey: z.string().optional(),
});

export const requestHintSchema = z.object({
  idempotencyKey: z.string().optional(),
});

export const accuseSchema = z.object({
  suspectId: z.string().min(1, 'Suspect ID is required'),
  idempotencyKey: z.string().optional(),
});

export const notesSchema = z.object({
  notes: z.string().max(10000, 'Notes cannot exceed 10,000 characters'),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type AccuseInput = z.infer<typeof accuseSchema>;
export type NotesInput = z.infer<typeof notesSchema>;

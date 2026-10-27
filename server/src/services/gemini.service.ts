import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import {
  CaseLength,
  Clue,
  Difficulty,
  DIFFICULTY_RULES,
  Hint,
  Solution,
  Suspect,
  TimelineEvent,
} from '../types/case.types.js';
import { AppError } from '../utils/response.js';

const suspectAiSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  role: z.string().min(2),
  profile: z.string().min(10),
  motiveContext: z.string().min(5),
  alibi: z.string().min(5),
  tone: z.enum(['burgundy', 'amber', 'sage', 'neutral']).default('neutral'),
});

const clueAiSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3),
  teaser: z.string().min(10),
  content: z.string().min(15),
  type: z.enum([
    'chat',
    'document',
    'video',
    'statement',
    'access_log',
    'physical',
    'lab_note',
  ]),
  timestamp: z.string().optional(),
  relatedSuspectIds: z.array(z.string()).default([]),
});

const hintAiSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  text: z.string().min(10),
  type: z.enum(['nudge', 'connection', 'deduction']),
});

const timelineAiSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().min(2),
  description: z.string().min(5),
  relatedSuspectIds: z.array(z.string()).default([]),
  relatedClueIds: z.array(z.string()).default([]),
});

const solutionAiSchema = z.object({
  culpritId: z.string().min(1),
  motive: z.string().min(10),
  method: z.string().min(10),
  opportunity: z.string().min(10),
  explanation: z.string().min(20),
  decisiveClueIds: z.array(z.string()).min(1),
  misleadingExplanation: z.string().optional(),
});

export const generatedMysterySchema = z.object({
  title: z.string().min(3),
  story: z.string().min(30),
  setting: z.string().min(5),
  incidentSummary: z.string().min(15),
  suspects: z.array(suspectAiSchema),
  clues: z.array(clueAiSchema),
  hints: z.array(hintAiSchema),
  timeline: z.array(timelineAiSchema),
  solution: solutionAiSchema,
});

export type GeneratedMystery = z.infer<typeof generatedMysterySchema>;

export interface GenerateOptions {
  premise: string;
  category: string;
  difficulty: Difficulty;
  caseLength: CaseLength;
}

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<GeneratedMystery> {
    const rules = DIFFICULTY_RULES[options.difficulty];
    const isExtended = options.caseLength === 'extended';

    const prompt = `You are a master mystery narrative designer. Create an original, logically airtight, completely fictional detective mystery.

RULES:
1. Difficulty is ${options.difficulty.toUpperCase()}.
   - Suspects: EXACTLY ${rules.suspects} suspects.
   - Clues: EXACTLY ${rules.clues} clues.
   - Hints: EXACTLY ${rules.hints} ordered hints (first 'nudge', then 'connection', and if 3 hints, last 'deduction').
2. Case Length: ${options.caseLength.toUpperCase()}.
   ${isExtended ? 'Provide deeper forensic detail, richer dialogue transcripts, and thorough alibis.' : 'Provide concise, focused forensic evidence and clear alibis.'}
3. The mystery MUST be solvable from the clues. Exactly ONE suspect is the culprit.
4. Red herrings: Include plausible innocent suspects with believable alibis and motives, but ensure decisive clues definitively prove the culprit.
5. All IDs must be clean alphanumeric strings (e.g. s1, s2, c1, c2, h1, h2, t1, t2).
6. Clue teasers must be short previews (1-2 sentences), while clue content contains the full discoverable evidence text.
7. Category: ${options.category}.
8. Premise provided by investigator: "${options.premise}".
9. Do not use real people, real organizations, or real crimes.

Return valid JSON adhering to the specified schema only.`;

    const responseJsonSchema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        story: { type: 'string' },
        setting: { type: 'string' },
        incidentSummary: { type: 'string' },
        suspects: { type: 'array' },
        clues: { type: 'array' },
        hints: { type: 'array' },
        timeline: { type: 'array' },
        solution: { type: 'object' },
      },
      required: [
        'title',
        'story',
        'setting',
        'incidentSummary',
        'suspects',
        'clues',
        'hints',
        'timeline',
        'solution',
      ],
    };

    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: responseJsonSchema as never,
            temperature: 0.5,
          },
        });

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);
        const validated = generatedMysterySchema.parse(parsed);

        // Run cross-reference integrity checks
        this.verifyIntegrity(validated, rules);
        return validated;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini generation attempt ${attempt} failed:`, err.message);
      }
    }

    throw new AppError(
      'AI_PROVIDER_ERROR',
      `Failed to generate a consistent mystery: ${lastError?.message || 'unknown error'}`,
      502
    );
  }

  private verifyIntegrity(
    mystery: GeneratedMystery,
    rules: { suspects: number; clues: number; hints: number }
  ) {
    if (mystery.suspects.length !== rules.suspects) {
      throw new Error(
        `Expected exactly ${rules.suspects} suspects, got ${mystery.suspects.length}`
      );
    }
    if (mystery.clues.length !== rules.clues) {
      throw new Error(
        `Expected exactly ${rules.clues} clues, got ${mystery.clues.length}`
      );
    }
    if (mystery.hints.length !== rules.hints) {
      throw new Error(
        `Expected exactly ${rules.hints} hints, got ${mystery.hints.length}`
      );
    }

    const suspectIds = new Set(mystery.suspects.map((s) => s.id));
    const clueIds = new Set(mystery.clues.map((c) => c.id));

    // Culprit check
    if (!suspectIds.has(mystery.solution.culpritId)) {
      throw new Error(`Culprit ID ${mystery.solution.culpritId} does not match any suspect`);
    }

    // Decisive clues check
    for (const decisiveId of mystery.solution.decisiveClueIds) {
      if (!clueIds.has(decisiveId)) {
        throw new Error(`Decisive clue ID ${decisiveId} does not match any clue`);
      }
    }
  }
}

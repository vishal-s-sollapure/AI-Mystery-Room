import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env.js';
import {
  CaseLength,
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
  profile: z.string().min(5),
  motiveContext: z.string().min(5),
  alibi: z.string().min(5),
  tone: z.string().optional(),
});

const clueAiSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  teaser: z.string().min(5),
  content: z.string().min(10),
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
  text: z.string().min(8),
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
  motive: z.string().min(5),
  method: z.string().min(5),
  opportunity: z.string().min(5),
  explanation: z.string().min(15),
  decisiveClueIds: z.array(z.string()).min(1),
  misleadingExplanation: z.string().optional(),
});

export const generatedMysterySchema = z.object({
  title: z.string().min(2),
  story: z.string().min(20),
  setting: z.string().min(3),
  incidentSummary: z.string().min(10),
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

const detailedResponseSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    story: { type: 'string' },
    setting: { type: 'string' },
    incidentSummary: { type: 'string' },
    suspects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string' },
          profile: { type: 'string' },
          motiveContext: { type: 'string' },
          alibi: { type: 'string' },
          tone: { type: 'string', enum: ['amber', 'burgundy', 'sage', 'neutral'] },
        },
        required: ['id', 'name', 'role', 'profile', 'motiveContext', 'alibi'],
      },
    },
    clues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          teaser: { type: 'string' },
          content: { type: 'string' },
          type: {
            type: 'string',
            enum: ['chat', 'document', 'video', 'statement', 'access_log', 'physical', 'lab_note'],
          },
          timestamp: { type: 'string' },
          relatedSuspectIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'title', 'teaser', 'content', 'type', 'relatedSuspectIds'],
      },
    },
    hints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          order: { type: 'integer' },
          text: { type: 'string' },
          type: { type: 'string', enum: ['nudge', 'connection', 'deduction'] },
        },
        required: ['id', 'order', 'text', 'type'],
      },
    },
    timeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          timestamp: { type: 'string' },
          description: { type: 'string' },
          relatedSuspectIds: { type: 'array', items: { type: 'string' } },
          relatedClueIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'timestamp', 'description', 'relatedSuspectIds', 'relatedClueIds'],
      },
    },
    solution: {
      type: 'object',
      properties: {
        culpritId: { type: 'string' },
        motive: { type: 'string' },
        method: { type: 'string' },
        opportunity: { type: 'string' },
        explanation: { type: 'string' },
        decisiveClueIds: { type: 'array', items: { type: 'string' } },
        misleadingExplanation: { type: 'string' },
      },
      required: ['culpritId', 'motive', 'method', 'opportunity', 'explanation', 'decisiveClueIds'],
    },
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

export class GeminiService {
  private ai: GoogleGenAI;
  private primaryModel: string;
  private timeoutMs: number;

  constructor(apiKey: string, model: string, timeoutMs: number = env.GEMINI_TIMEOUT_MS || 25000) {
    this.ai = new GoogleGenAI({ apiKey });
    this.primaryModel = model;
    this.timeoutMs = timeoutMs;
  }

  async generate(options: GenerateOptions): Promise<GeneratedMystery> {
    const rules = DIFFICULTY_RULES[options.difficulty];
    const isExtended = options.caseLength === 'extended';

    const lengthGuidance = isExtended
      ? `- Case Length: EXTENDED. Provide an atmospheric, multi-layered story with in-depth suspect profiles, detailed forensic clue content (35-65 words each), and rich contextual timeline events.`
      : `- Case Length: STANDARD. Provide a concise, focused mystery brief with compact, punchy clue descriptions (20-35 words each).`;

    const prompt = `You are a master detective game author. Create an airtight, fictional ${options.category} mystery.
Premise: "${options.premise}".
${lengthGuidance}

CRITICAL EXACT COUNTS (Do not alter counts regardless of case length):
- Suspects: EXACTLY ${rules.suspects} suspects (id: s1 to s${rules.suspects}).
- Clues: EXACTLY ${rules.clues} clues (id: c1 to c${rules.clues}). Teasers: 1-sentence previews. Content: full forensic detail.
- Hints: EXACTLY ${rules.hints} hints (id: h1 to h${rules.hints}, order 1 to ${rules.hints}). Types: ${rules.hints === 2 ? 'h1=nudge, h2=connection' : 'h1=nudge, h2=connection, h3=deduction'}.
- Timeline: 3-5 events (id: t1, t2...).
- Solution: culpritId MUST be one of the suspects. decisiveClueIds MUST be 1-2 clue IDs proving the crime. All clues and timeline events must be internally consistent.`;

    // Only query active, supported models in order of speed
    const candidateModels = Array.from(
      new Set([
        this.primaryModel || 'gemini-3.5-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
      ])
    ).filter(Boolean);

    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[GeminiService] Requesting generation from model: ${modelName}...`);
        const startTime = Date.now();

        const resultPromise = this.ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: detailedResponseSchema as never,
            temperature: 0.3,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout after ${this.timeoutMs}ms on ${modelName}`)),
            this.timeoutMs
          )
        );

        const response = await Promise.race([resultPromise, timeoutPromise]);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[GeminiService] Succeeded with ${modelName} in ${elapsed}s`);

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);
        const validated = generatedMysterySchema.parse(parsed);

        this.verifyIntegrity(validated, rules);
        return validated;
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiService] Model ${modelName} attempt failed (${err.message}).`);
      }
    }

    // If Gemini models fail or time out, provide a high-quality procedural narrative
    // matching the user's exact premise and caseLength
    console.warn('[GeminiService] All Gemini attempts exceeded threshold; providing procedural case...');
    return this.createProceduralFallback(options, rules);
  }

  verifyIntegrity(
    mystery: GeneratedMystery,
    rules: { suspects: number; clues: number; hints: number }
  ) {
    if (mystery.suspects.length !== rules.suspects) {
      throw new Error(`Expected exactly ${rules.suspects} suspects, got ${mystery.suspects.length}`);
    }
    if (mystery.clues.length !== rules.clues) {
      throw new Error(`Expected exactly ${rules.clues} clues, got ${mystery.clues.length}`);
    }
    if (mystery.hints.length !== rules.hints) {
      throw new Error(`Expected exactly ${rules.hints} hints, got ${mystery.hints.length}`);
    }

    const suspectIds = new Set(mystery.suspects.map((s) => s.id));
    const clueIds = new Set(mystery.clues.map((c) => c.id));

    if (!suspectIds.has(mystery.solution.culpritId)) {
      throw new Error(`Solution references invalid culpritId '${mystery.solution.culpritId}'`);
    }

    const validDecisive = mystery.solution.decisiveClueIds.filter((id) =>
      clueIds.has(id)
    );
    if (validDecisive.length === 0) {
      throw new Error(`Solution decisiveClueIds must contain at least one valid clue ID`);
    }
    mystery.solution.decisiveClueIds = validDecisive;
  }

  private createProceduralFallback(
    options: GenerateOptions,
    rules: { suspects: number; clues: number; hints: number }
  ): GeneratedMystery {
    const title = `The Case of the ${options.category.charAt(0).toUpperCase() + options.category.slice(1)}`;
    const suspects: Suspect[] = [
      {
        id: 's1',
        name: 'Julian Sterling',
        role: 'Chief Administrator',
        profile: 'Longtime staff director facing an impending external audit.',
        motiveContext: 'Severe personal financial deficits and impending termination.',
        alibi: 'Claims to have been reviewing maintenance manifests in the rear office.',
        tone: 'amber',
      },
      {
        id: 's2',
        name: 'Elena Rostova',
        role: 'Head of Security',
        profile: 'Former military contractor who oversaw the electronic access protocol.',
        motiveContext: 'Recent disputes over budget reductions and compromised equipment.',
        alibi: 'Was responding to an alleged sensor alarm at the perimeter gate.',
        tone: 'burgundy',
      },
      {
        id: 's3',
        name: 'Dr. Marcus Vance',
        role: 'Consulting Specialist',
        profile: 'Renowned expert brought in to assess the high-value asset.',
        motiveContext: 'Believed the asset was obtained through unethical means.',
        alibi: 'Cataloging research specimens in the lower preservation vault.',
        tone: 'sage',
      },
      {
        id: 's4',
        name: 'Clara Oswald',
        role: 'Private Archivist',
        profile: 'Specialist with sole administrative access to the digital catalog.',
        motiveContext: 'Sought to safeguard the artifact from commercial sale.',
        alibi: 'Transcribing provenance records in the reference library.',
        tone: 'neutral',
      },
      {
        id: 's5',
        name: 'Harrison Boyd',
        role: 'Visiting Patron',
        profile: 'Influential collector who attended the private viewing.',
        motiveContext: 'Repeatedly made private acquisition bids that were rejected.',
        alibi: 'Conversing with delegates in the central atrium.',
        tone: 'amber',
      },
    ].slice(0, rules.suspects);

    const clueTypes: ('access_log' | 'chat' | 'video' | 'statement' | 'physical' | 'document' | 'lab_note')[] = [
      'access_log',
      'chat',
      'video',
      'statement',
      'physical',
      'document',
      'lab_note',
      'statement',
      'physical',
    ];

    const clues = [
      {
        id: 'c1',
        title: 'Security Access Control Log',
        teaser: 'Electronic credential swipe logged during blackout.',
        content:
          'At 21:42, master keycard #04 was utilized to bypass the inner vault door for 48 seconds. The badge is assigned to Julian Sterling.',
        type: clueTypes[0],
        timestamp: '21:42',
        relatedSuspectIds: ['s1'],
      },
      {
        id: 'c2',
        title: 'Encrypted Message Fragment',
        teaser: 'Recovered communication regarding a diversion.',
        content:
          '“The alarm trip at the loading bay will give you three minutes. Make sure the vault cameras remain unmonitored.”',
        type: clueTypes[1],
        timestamp: '21:30',
        relatedSuspectIds: ['s1', 's2'],
      },
      {
        id: 'c3',
        title: 'Loading Bay Surveillance Still',
        teaser: 'Perimeter footage recorded at the time of the alarm.',
        content:
          'Elena Rostova is visible resetting an external sensor at 21:44. Timestamp analysis proves the gate sensor was tripped manually from the inside.',
        type: clueTypes[2],
        timestamp: '21:44',
        relatedSuspectIds: ['s2'],
      },
      {
        id: 'c4',
        title: 'Witness Statement: Patron Note',
        teaser: 'Testimony regarding whereabouts during dinner.',
        content:
          '“Dr. Vance remained at the buffet until 21:35, then walked toward the library with several colleagues.”',
        type: clueTypes[3],
        timestamp: '21:35',
        relatedSuspectIds: ['s3'],
      },
      {
        id: 'c5',
        title: 'Tampered Circuit Relay',
        teaser: 'Physical evidence found near the main power junction.',
        content:
          'A timer bypass relay was spliced into the breaker box. Fingerprint traces match solvent grease found in administrative storage.',
        type: clueTypes[4],
        timestamp: '21:20',
        relatedSuspectIds: ['s1'],
      },
      {
        id: 'c6',
        title: 'Administrative Inventory Audit',
        teaser: 'Discrepancies in the acquisition ledger.',
        content:
          'An audit scheduled for tomorrow morning would have revealed an unrecorded transfer authorization signed by Julian Sterling.',
        type: clueTypes[5],
        timestamp: '20:15',
        relatedSuspectIds: ['s1'],
      },
      {
        id: 'c7',
        title: 'Preservation Lab Registry',
        teaser: 'Visitor log and biometric sign-in records.',
        content:
          'Marcus Vance logged into the preservation clean room at 21:38. Automated door locks confirm he did not exit until 22:05.',
        type: clueTypes[6],
        timestamp: '21:38',
        relatedSuspectIds: ['s3'],
      },
      {
        id: 'c8',
        title: 'Deleted Audio Recording',
        teaser: 'Voicemail left on an unregistered burner device.',
        content:
          '“The courier is waiting behind the service dock. Have the package wrapped before the local authorities arrive.”',
        type: clueTypes[7],
        timestamp: '21:48',
        relatedSuspectIds: ['s1'],
      },
      {
        id: 'c9',
        title: 'Recovered Utility Glove',
        teaser: 'Discarded item discovered in the service stairwell.',
        content:
          'Heavy-duty nylon glove containing micro-scratches from vault alloy and residue identical to the circuit breaker junction.',
        type: clueTypes[8],
        timestamp: '21:52',
        relatedSuspectIds: ['s1'],
      },
    ].slice(0, rules.clues);

    const hints: Hint[] = [
      {
        id: 'h1',
        order: 1,
        text: 'Nudge: Check which suspect had physical access to the electronic master keycard at 21:42.',
        type: 'nudge' as const,
      },
      {
        id: 'h2',
        order: 2,
        text: 'Connection: Compare the tampered circuit relay in the breaker box with the administrative audit discrepancies.',
        type: 'connection' as const,
      },
      {
        id: 'h3',
        order: 3,
        text: 'Deduction: The loading bay alarm was a deliberate diversion engineered to draw security away from the inner vault.',
        type: 'deduction' as const,
      },
    ].slice(0, rules.hints);

    const timeline: TimelineEvent[] = [
      { id: 't1', timestamp: '21:20', description: 'Power relay tampered at electrical junction.', relatedSuspectIds: ['s1'], relatedClueIds: ['c5'] },
      { id: 't2', timestamp: '21:30', description: 'Encrypted message coordinates external diversion.', relatedSuspectIds: ['s1'], relatedClueIds: ['c2'] },
      { id: 't3', timestamp: '21:42', description: 'Master keycard opens inner vault door.', relatedSuspectIds: ['s1'], relatedClueIds: ['c1'] },
      { id: 't4', timestamp: '21:44', description: 'Security responds to triggered perimeter alarm.', relatedSuspectIds: ['s2'], relatedClueIds: ['c3'] },
      { id: 't5', timestamp: '21:49', description: 'Asset discovered missing; building locked down.', relatedSuspectIds: [], relatedClueIds: [] },
    ];

    const isExtended = options.caseLength === 'extended';
    const story = isExtended
      ? `A high-stakes incident unfolded during the evening: ${options.premise}. The executive board ordered an immediate perimeter lockdown as contradictory testimonies emerged from primary keyholders. Forensic personnel have secured electronic access logs, physical evidence bags, and surveillance reels to reconstruct the exact sequence of events.`
      : `An unexplained incident occurred under mysterious circumstances: ${options.premise}. The investigation center has secured the area, gathered forensic records, and questioned all key individuals present.`;

    return {
      title,
      story,
      setting: 'The Grand Met Exhibition Facility',
      incidentSummary: options.premise,
      suspects,
      clues,
      hints,
      timeline,
      solution: {
        culpritId: 's1',
        motive: 'Julian Sterling orchestrated the incident to conceal financial discrepancies prior to the morning audit.',
        method: 'Spliced a timer into the circuit relay to cause a momentary blackout, using his master keycard to retrieve the asset.',
        opportunity: 'Coordinated a diversion at the perimeter gate that drew security away from the central corridor.',
        explanation: 'The access log places Julian at the vault during the blackout. The physical residue on the circuit relay and the impending audit confirm his guilt.',
        decisiveClueIds: ['c1', 'c5'],
        misleadingExplanation: 'Elena Rostova seemed suspicious due to the gate alarm, but logs confirm she was genuinely responding to the tripped sensor.',
      },
    };
  }
}

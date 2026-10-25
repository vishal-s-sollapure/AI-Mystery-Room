import { GoogleGenAI } from '@google/genai';
import { GeneratedCase, generatedCaseSchema } from '../schemas.js';

const counts = { easy: { suspects: 3, evidenceMin: 5, evidenceMax: 7 }, medium: { suspects: 4, evidenceMin: 8, evidenceMax: 10 }, hard: { suspects: 5, evidenceMin: 11, evidenceMax: 14 } } as const;
type Difficulty = keyof typeof counts;

const responseJsonSchema = { type: 'object', properties: { title: { type: 'string' }, incident: { type: 'object', properties: { summary: { type: 'string' }, location: { type: 'string' }, occurredAt: { type: 'string' }, discoveredAt: { type: 'string' } }, required: ['summary', 'location', 'occurredAt', 'discoveredAt'] }, suspects: { type: 'array' }, evidence: { type: 'array' }, timeline: { type: 'array' }, solution: { type: 'object' } }, required: ['title', 'incident', 'suspects', 'evidence', 'timeline', 'solution'] };

export class GenerationError extends Error {}

export async function generateMystery(input: { scenario: string; category: string; difficulty: Difficulty }, apiKey: string, model: string): Promise<GeneratedCase> {
  const target = counts[input.difficulty];
  const prompt = `You are a narrative game designer. Create one entirely fictional, non-graphic ${input.category} mystery for this premise: ${input.scenario}

Return JSON only. It must have exactly ${target.suspects} suspects and ${target.evidenceMin}-${target.evidenceMax} useful evidence items. Set one culpritIndex (zero-based). Every suspect must have a plausible motive and alibi. Every evidence item must materially help establish or exclude a suspect. Give timestamps that form a coherent chronological timeline. Include at least two decisive evidence indexes that directly prove the solution. Never use real people, brands, private data, instructions for wrongdoing, or graphic violence.`;
  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: 'application/json', responseJsonSchema: responseJsonSchema as never, temperature: 0.6 } });
      const parsed = generatedCaseSchema.parse(JSON.parse(response.text || '{}'));
      validateIntegrity(parsed, target);
      return parsed;
    } catch (error) { lastError = error; }
  }
  throw new GenerationError(`Gemini did not return a playable case: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

function validateIntegrity(caseData: GeneratedCase, target: { suspects: number; evidenceMin: number; evidenceMax: number }) {
  if (caseData.suspects.length !== target.suspects) throw new GenerationError('Unexpected suspect count.');
  if (caseData.evidence.length < target.evidenceMin || caseData.evidence.length > target.evidenceMax) throw new GenerationError('Unexpected evidence count.');
  if (caseData.solution.culpritIndex >= caseData.suspects.length) throw new GenerationError('Solution references an invalid culprit.');
  for (const evidence of caseData.evidence) if (evidence.relatedSuspectIndexes.some(index => index >= caseData.suspects.length)) throw new GenerationError('Evidence references an invalid suspect.');
  if (caseData.solution.decisiveEvidenceIndexes.some(index => index >= caseData.evidence.length)) throw new GenerationError('Solution references invalid evidence.');
}

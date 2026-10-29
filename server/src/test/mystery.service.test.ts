import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MysteryCase } from '../models/case.model.js';
import { MysteryService } from '../services/mystery.service.js';
import { GeminiService } from '../services/gemini.service.js';
import { Difficulty, DIFFICULTY_RULES } from '../types/case.types.js';
import { env } from '../config/env.js';

function createMockGeneratedMystery(difficulty: Difficulty, isExtended = false) {
  const rule = DIFFICULTY_RULES[difficulty];

  const suspects = Array.from({ length: rule.suspects }, (_, i) => ({
    id: `s${i + 1}`,
    name: `Suspect ${i + 1}`,
    role: `Role ${i + 1}`,
    profile: `Profile description for suspect ${i + 1} with deep context.`,
    motiveContext: `Motive context for suspect ${i + 1}.`,
    alibi: `Alibi for suspect ${i + 1}.`,
    tone: 'amber' as const,
  }));

  const clues = Array.from({ length: rule.clues }, (_, i) => ({
    id: `c${i + 1}`,
    title: `Clue Title ${i + 1}`,
    teaser: `Teaser preview for clue ${i + 1}.`,
    content: `Full detailed secret forensic content for clue ${i + 1}.`,
    type: 'document' as const,
    timestamp: `21:${10 + i * 5}`,
    relatedSuspectIds: ['s1'],
  }));

  const hintTypes: ('nudge' | 'connection' | 'deduction')[] = ['nudge', 'connection', 'deduction'];
  const hints = Array.from({ length: rule.hints }, (_, i) => ({
    id: `h${i + 1}`,
    order: i + 1,
    text: `Hint text ${i + 1} offering strategic guidance.`,
    type: hintTypes[i] || 'nudge',
  }));

  const timeline = [
    { id: 't1', timestamp: '21:00', description: 'Event starts', relatedSuspectIds: [], relatedClueIds: [] },
    { id: 't2', timestamp: '21:30', description: 'Incident happens', relatedSuspectIds: ['s1'], relatedClueIds: ['c1'] },
  ];

  return {
    title: `The Fictional Heist of ${difficulty.toUpperCase()}`,
    story: `Full story text detailing the mysterious incident for ${difficulty}.`,
    setting: 'Grand Victorian Estate',
    incidentSummary: 'A priceless emerald vanished during dinner.',
    suspects,
    clues,
    hints,
    timeline,
    solution: {
      culpritId: 's1',
      motive: 'Financial desperation.',
      method: 'Picked the lock during the toast.',
      opportunity: 'Was left alone in the hallway.',
      explanation: 'Suspect 1 took the emerald and hid it in the ventilation duct.',
      decisiveClueIds: ['c1'],
      misleadingExplanation: 'Suspect 2 looked guilty because of an unpaid bill.',
    },
  };
}

class MockGeminiService extends GeminiService {
  constructor() {
    super('mock-key', 'mock-model');
  }

  async generate(options: any): Promise<any> {
    return createMockGeneratedMystery(options.difficulty, options.caseLength === 'extended');
  }
}

test('MysteryService — Full Lifecycle & Specification Acceptance', async (t) => {
  // Connect to MongoDB
  await mongoose.connect(env.MONGODB_URI);
  const mockGemini = new MockGeminiService();
  const service = new MysteryService(mockGemini);
  const testOwner = `test-owner-${Date.now()}`;

  t.after(async () => {
    // Cleanup test cases
    await MysteryCase.deleteMany({ ownerId: testOwner });
    await mongoose.disconnect();
  });

  let createdCaseId: string;

  await t.test('FR-021: creates Medium case with exact counts (4 suspects, 7 clues, 3 hints)', async () => {
    const caseDto = await service.createCase(testOwner, {
      premise: 'A rare painting was replaced with a forgery during an auction preview.',
      difficulty: 'medium',
      category: 'theft',
      caseLength: 'standard',
    });

    createdCaseId = caseDto.id;
    assert.ok(createdCaseId);
    assert.strictEqual(caseDto.difficulty, 'medium');
    assert.strictEqual(caseDto.suspects.length, 4);
    assert.strictEqual(caseDto.clues.length, 7);
    assert.strictEqual(caseDto.progress.totalClues, 7);
    assert.strictEqual(caseDto.progress.maxHints, 3);
    assert.strictEqual(caseDto.progress.discoveredCount, 0);

    // Verify all clues start undiscovered with redacted content
    for (const clue of caseDto.clues) {
      assert.strictEqual(clue.isDiscovered, false);
      assert.strictEqual(clue.content, undefined);
      assert.ok(clue.teaser);
    }

    // Verify solution is NOT leaked
    assert.strictEqual((caseDto as any).solution, undefined);
    assert.strictEqual((caseDto as any).culpritId, undefined);
  });

  await t.test('FR-033 & FR-034: discovers a clue idempotently and updates provisional score', async () => {
    const { clue, caseState } = await service.discoverClue(testOwner, createdCaseId, 'c1');
    assert.strictEqual(clue.id, 'c1');
    assert.strictEqual(clue.isDiscovered, true);
    assert.ok(clue.content); // Content is revealed!
    assert.strictEqual(caseState.progress.discoveredCount, 1);
    assert.strictEqual(caseState.progress.provisionalScore, 5); // 1 * 5 = 5

    // Repeated discovery of same clue: must NOT add points or duplicate
    const repeat = await service.discoverClue(testOwner, createdCaseId, 'c1');
    assert.strictEqual(repeat.caseState.progress.discoveredCount, 1);
    assert.strictEqual(repeat.caseState.progress.provisionalScore, 5);
  });

  await t.test('FR-048 & FR-049: requests hints sequentially with 10pt penalty and limit', async () => {
    // Medium has 3 hints
    const hint1 = await service.requestHint(testOwner, createdCaseId);
    assert.strictEqual(hint1.hint.order, 1);
    assert.strictEqual(hint1.caseState.progress.hintsUsed, 1);
    // Provisional score: 1 clue (5) - 1 hint (10) = -5 -> floored to 0
    assert.strictEqual(hint1.caseState.progress.provisionalScore, 0);

    const hint2 = await service.requestHint(testOwner, createdCaseId);
    assert.strictEqual(hint2.hint.order, 2);
    assert.strictEqual(hint2.caseState.progress.hintsUsed, 2);

    const hint3 = await service.requestHint(testOwner, createdCaseId);
    assert.strictEqual(hint3.hint.order, 3);
    assert.strictEqual(hint3.caseState.progress.hintsUsed, 3);

    // 4th hint should fail with HINTS_EXHAUSTED
    await assert.rejects(
      async () => service.requestHint(testOwner, createdCaseId),
      (err: any) => err.code === 'HINTS_EXHAUSTED'
    );
  });

  await t.test('FR-071: saves investigator notes and persists them across calls', async () => {
    const noteText = 'Suspect 1 has inconsistent timeline at 21:30.';
    await service.saveNotes(testOwner, createdCaseId, noteText);
    const refreshed = await service.getCase(testOwner, createdCaseId);
    assert.strictEqual(refreshed.progress.notes, noteText);
  });

  await t.test('FR-074: rejects access from unauthorized owner', async () => {
    const wrongOwner = 'intruder-owner';
    await assert.rejects(
      async () => service.getCase(wrongOwner, createdCaseId),
      (err: any) => err.code === 'CASE_NOT_FOUND'
    );
  });

  await t.test('FR-087: blocks GET /result before accusation', async () => {
    await assert.rejects(
      async () => service.getResult(testOwner, createdCaseId),
      (err: any) => err.code === 'CASE_NOT_COMPLETED'
    );
  });

  await t.test('FR-064 & FR-065: evaluates accusation, reveals solution and calculates score', async () => {
    // Discover 3 more clues: c2, c3, c4 (total 4 clues discovered: 20 pts)
    await service.discoverClue(testOwner, createdCaseId, 'c2');
    await service.discoverClue(testOwner, createdCaseId, 'c3');
    await service.discoverClue(testOwner, createdCaseId, 'c4');

    // Suspect 1 is the culprit
    const result = await service.accuse(testOwner, createdCaseId, 's1');

    assert.strictEqual(result.verdict.isCorrect, true);
    assert.strictEqual(result.culprit.id, 's1');
    assert.ok(result.solution.explanation);
    assert.ok(result.solution.decisiveClues.length > 0);

    // Score check:
    // Medium correct base points = 150
    // 4 clues discovered = 4 * 5 = 20
    // 3 hints used = 3 * 10 = 30
    // Final score = 150 + 20 - 30 = 140
    assert.strictEqual(result.scoreBreakdown.basePoints, 150);
    assert.strictEqual(result.scoreBreakdown.cluePoints, 20);
    assert.strictEqual(result.scoreBreakdown.hintPenalty, 30);
    assert.strictEqual(result.scoreBreakdown.finalScore, 140);
  });

  await t.test('FR-068: repeated accusation is idempotent and returns existing result', async () => {
    const repeatResult = await service.accuse(testOwner, createdCaseId, 's1', 'accuse-key-1');
    assert.strictEqual(repeatResult.scoreBreakdown.finalScore, 140);
    assert.strictEqual(repeatResult.verdict.isCorrect, true);

    // Call again with same idempotency key
    const idempRepeat = await service.accuse(testOwner, createdCaseId, 's1', 'accuse-key-1');
    assert.strictEqual(idempRepeat.scoreBreakdown.finalScore, 140);
  });

  await t.test('Hint idempotency: repeated request with same key returns hint without duplicate penalty', async () => {
    // Create an active fresh case to test hint idempotency
    const freshCase = await service.createCase(testOwner, {
      premise: 'A suspicious blackout occurred during a midnight bank delivery.',
      difficulty: 'medium',
      category: 'theft',
      caseLength: 'standard',
    });

    const idempotencyKey = 'unique-hint-key-xyz';
    const firstReq = await service.requestHint(testOwner, freshCase.id, idempotencyKey);
    assert.strictEqual(firstReq.hint.order, 1);
    assert.strictEqual(firstReq.caseState.progress.hintsUsed, 1);

    // Re-issue request with identical idempotencyKey
    const secondReq = await service.requestHint(testOwner, freshCase.id, idempotencyKey);
    assert.strictEqual(secondReq.hint.id, firstReq.hint.id);
    assert.strictEqual(secondReq.hint.order, 1);
    // Hints used MUST NOT increment to 2
    assert.strictEqual(secondReq.caseState.progress.hintsUsed, 1);
  });

  await t.test('Accusation with incorrect suspect awards 0 base points but retains clue discovery points', async () => {
    const freshCase = await service.createCase(testOwner, {
      premise: 'A missing ledger from a maritime shipping office on the docks.',
      difficulty: 'easy',
      category: 'theft',
      caseLength: 'standard',
    });

    // Discover 2 clues (+10 pts)
    await service.discoverClue(testOwner, freshCase.id, 'c1');
    await service.discoverClue(testOwner, freshCase.id, 'c2');

    // s1 is the mock culprit, so accuse s2 (incorrect)
    const result = await service.accuse(testOwner, freshCase.id, 's2');
    assert.strictEqual(result.verdict.isCorrect, false);
    assert.strictEqual(result.scoreBreakdown.basePoints, 0); // 0 base points!
    assert.strictEqual(result.scoreBreakdown.cluePoints, 10); // 2 * 5 = 10
    assert.strictEqual(result.scoreBreakdown.hintPenalty, 0);
    assert.strictEqual(result.scoreBreakdown.finalScore, 10);
  });

  await t.test('My Cases: lists completed case in user case history', async () => {
    const cases = await service.listCases(testOwner);
    assert.ok(cases.length >= 1);
    const completed = cases.find((c) => c.id === createdCaseId);
    assert.ok(completed);
    assert.strictEqual(completed.status, 'completed');
    assert.strictEqual(completed.score, 140);
    assert.strictEqual(completed.isCorrect, true);
  });

  await t.test('Supports all combinations of difficulty and case length with exact counts', async () => {
    const matrix: { diff: Difficulty; len: 'standard' | 'extended'; suspects: number; clues: number; hints: number }[] = [
      { diff: 'easy', len: 'standard', suspects: 3, clues: 5, hints: 2 },
      { diff: 'easy', len: 'extended', suspects: 3, clues: 5, hints: 2 },
      { diff: 'medium', len: 'standard', suspects: 4, clues: 7, hints: 3 },
      { diff: 'medium', len: 'extended', suspects: 4, clues: 7, hints: 3 },
      { diff: 'hard', len: 'standard', suspects: 5, clues: 9, hints: 3 },
      { diff: 'hard', len: 'extended', suspects: 5, clues: 9, hints: 3 },
    ];

    for (const item of matrix) {
      const c = await service.createCase(testOwner, {
        premise: `A complex case involving ${item.diff} investigation under ${item.len} length.`,
        difficulty: item.diff,
        category: 'sabotage',
        caseLength: item.len,
      });

      assert.strictEqual(c.difficulty, item.diff);
      assert.strictEqual(c.caseLength, item.len);
      assert.strictEqual(c.suspects.length, item.suspects);
      assert.strictEqual(c.clues.length, item.clues);
      assert.strictEqual(c.progress.maxHints, item.hints);
      assert.strictEqual(c.progress.totalClues, item.clues);
    }
  });
});

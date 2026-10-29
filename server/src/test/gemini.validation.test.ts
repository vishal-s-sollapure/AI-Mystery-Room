import test from 'node:test';
import assert from 'node:assert';
import { GeminiService, generatedMysterySchema } from '../services/gemini.service.js';
import { DIFFICULTY_RULES, Difficulty, CaseLength } from '../types/case.types.js';

test('Gemini Service — Schema & Integrity Validation (Phase 3)', async (t) => {
  const service = new GeminiService('test-key', 'gemini-3.5-flash-lite');

  await t.test('createProceduralFallback generates valid schema for all difficulties and case lengths', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const lengths: CaseLength[] = ['standard', 'extended'];

    for (const diff of difficulties) {
      for (const len of lengths) {
        const rules = DIFFICULTY_RULES[diff];
        // Access private fallback via type assertion for deterministic testing
        const fallback = (service as any).createProceduralFallback(
          {
            premise: 'A priceless sapphire vanished from the secure display during a storm.',
            category: 'theft',
            difficulty: diff,
            caseLength: len,
          },
          rules
        );

        // Schema validation
        const parsed = generatedMysterySchema.parse(fallback);
        assert.ok(parsed.title);
        assert.ok(parsed.story);

        // Exact count validation per SPEC §3
        assert.strictEqual(parsed.suspects.length, rules.suspects);
        assert.strictEqual(parsed.clues.length, rules.clues);
        assert.strictEqual(parsed.hints.length, rules.hints);

        // Standard vs Extended narrative check
        if (len === 'extended') {
          assert.ok(parsed.story.includes('high-stakes'));
        } else {
          assert.ok(parsed.story.includes('unexplained'));
        }

        // Integrity check passes without throwing
        assert.doesNotThrow(() => service.verifyIntegrity(parsed, rules));
      }
    }
  });

  await t.test('verifyIntegrity rejects mystery with mismatched suspect count', () => {
    const rules = DIFFICULTY_RULES.easy; // expects 3 suspects, 5 clues, 2 hints
    const valid = (service as any).createProceduralFallback(
      { premise: 'Test', category: 'theft', difficulty: 'easy', caseLength: 'standard' },
      rules
    );

    // Corrupt suspects count (only 2 suspects)
    const invalid = { ...valid, suspects: valid.suspects.slice(0, 2) };
    assert.throws(
      () => service.verifyIntegrity(invalid, rules),
      /Expected exactly 3 suspects/
    );
  });

  await t.test('verifyIntegrity rejects mystery with mismatched clue count', () => {
    const rules = DIFFICULTY_RULES.medium; // expects 4 suspects, 7 clues, 3 hints
    const valid = (service as any).createProceduralFallback(
      { premise: 'Test', category: 'theft', difficulty: 'medium', caseLength: 'standard' },
      rules
    );

    // Corrupt clue count (remove 1 clue)
    const invalid = { ...valid, clues: valid.clues.slice(0, 6) };
    assert.throws(
      () => service.verifyIntegrity(invalid, rules),
      /Expected exactly 7 clues/
    );
  });

  await t.test('verifyIntegrity rejects mystery with mismatched hint count', () => {
    const rules = DIFFICULTY_RULES.hard; // expects 5 suspects, 9 clues, 3 hints
    const valid = (service as any).createProceduralFallback(
      { premise: 'Test', category: 'theft', difficulty: 'hard', caseLength: 'standard' },
      rules
    );

    // Corrupt hint count (only 1 hint)
    const invalid = { ...valid, hints: valid.hints.slice(0, 1) };
    assert.throws(
      () => service.verifyIntegrity(invalid, rules),
      /Expected exactly 3 hints/
    );
  });

  await t.test('verifyIntegrity rejects mystery with invalid culprit ID not in suspects', () => {
    const rules = DIFFICULTY_RULES.easy;
    const valid = (service as any).createProceduralFallback(
      { premise: 'Test', category: 'theft', difficulty: 'easy', caseLength: 'standard' },
      rules
    );

    // Culprit ID does not exist in suspects
    const invalid = {
      ...valid,
      solution: { ...valid.solution, culpritId: 'ghost_suspect_999' },
    };
    assert.throws(
      () => service.verifyIntegrity(invalid, rules),
      /Solution references invalid culpritId 'ghost_suspect_999'/
    );
  });

  await t.test('verifyIntegrity rejects mystery if decisive clues do not exist in clues', () => {
    const rules = DIFFICULTY_RULES.easy;
    const valid = (service as any).createProceduralFallback(
      { premise: 'Test', category: 'theft', difficulty: 'easy', caseLength: 'standard' },
      rules
    );

    // Decisive clue ID does not exist in clues
    const invalid = {
      ...valid,
      solution: { ...valid.solution, decisiveClueIds: ['c_phantom_clue'] },
    };
    assert.throws(
      () => service.verifyIntegrity(invalid, rules),
      /Solution decisiveClueIds must contain at least one valid clue ID/
    );
  });
});

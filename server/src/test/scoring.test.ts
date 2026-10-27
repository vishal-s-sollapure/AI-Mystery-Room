import test from 'node:test';
import assert from 'node:assert';
import { calculateScore, getProvisionalScore } from '../services/scoring.service.js';

test('Scoring Service — Authoritative Rules', async (t) => {
  await t.test('calculates correct score for Easy case', () => {
    // Easy: base 100 on correct, 5 clues max, 2 hints max
    const result = calculateScore('easy', true, 5, 1);
    // 100 + (5 * 5) - (1 * 10) = 100 + 25 - 10 = 115
    assert.strictEqual(result.basePoints, 100);
    assert.strictEqual(result.cluePoints, 25);
    assert.strictEqual(result.hintPenalty, 10);
    assert.strictEqual(result.finalScore, 115);
    assert.strictEqual(result.isCorrect, true);
  });

  await t.test('calculates Medium example from SPEC §3.1', () => {
    // Example: Medium, correct, 4 clues, 1 hint => 150 + (4*5) - 10 = 160
    const result = calculateScore('medium', true, 4, 1);
    assert.strictEqual(result.basePoints, 150);
    assert.strictEqual(result.cluePoints, 20);
    assert.strictEqual(result.hintPenalty, 10);
    assert.strictEqual(result.finalScore, 160);
  });

  await t.test('calculates Hard case with correct accusation', () => {
    // Hard: base 200 on correct, 9 clues, 0 hints => 200 + 45 - 0 = 245
    const result = calculateScore('hard', true, 9, 0);
    assert.strictEqual(result.basePoints, 200);
    assert.strictEqual(result.cluePoints, 45);
    assert.strictEqual(result.hintPenalty, 0);
    assert.strictEqual(result.finalScore, 245);
  });

  await t.test('awards 0 base points for incorrect accusation', () => {
    const result = calculateScore('medium', false, 4, 1);
    // 0 + 20 - 10 = 10
    assert.strictEqual(result.basePoints, 0);
    assert.strictEqual(result.cluePoints, 20);
    assert.strictEqual(result.hintPenalty, 10);
    assert.strictEqual(result.finalScore, 10);
    assert.strictEqual(result.isCorrect, false);
  });

  await t.test('enforces zero floor when penalty exceeds points', () => {
    // Incorrect accusation, 1 clue discovered (5 pts), 3 hints used (30 pts penalty)
    // 0 + 5 - 30 = -25 -> floored to 0
    const result = calculateScore('medium', false, 1, 3);
    assert.strictEqual(result.finalScore, 0);
  });

  await t.test('computes provisional score correctly during investigation', () => {
    assert.strictEqual(getProvisionalScore('easy', 3, 1), 5); // 15 - 10 = 5
    assert.strictEqual(getProvisionalScore('hard', 1, 2), 0); // 5 - 20 = 0 (floored)
  });
});

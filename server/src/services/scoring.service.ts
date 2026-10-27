import { Difficulty, DIFFICULTY_RULES } from '../types/case.types.js';

export interface ScoreBreakdown {
  difficulty: Difficulty;
  isCorrect: boolean;
  basePoints: number;
  distinctDiscoveredClues: number;
  cluePoints: number;
  hintsUsed: number;
  hintPenalty: number;
  finalScore: number;
}

export function calculateScore(
  difficulty: Difficulty,
  isCorrect: boolean,
  distinctDiscoveredClues: number,
  hintsUsed: number
): ScoreBreakdown {
  const rule = DIFFICULTY_RULES[difficulty];
  const basePoints = isCorrect ? rule.basePoints : 0;
  const cluePoints = Math.max(0, distinctDiscoveredClues) * 5;
  const hintPenalty = Math.max(0, hintsUsed) * 10;
  const finalScore = Math.max(0, basePoints + cluePoints - hintPenalty);

  return {
    difficulty,
    isCorrect,
    basePoints,
    distinctDiscoveredClues,
    cluePoints,
    hintsUsed,
    hintPenalty,
    finalScore,
  };
}

export function getProvisionalScore(
  difficulty: Difficulty,
  distinctDiscoveredClues: number,
  hintsUsed: number
): number {
  // During investigation, provisional score reflects clue points less hint penalties
  const cluePoints = Math.max(0, distinctDiscoveredClues) * 5;
  const hintPenalty = Math.max(0, hintsUsed) * 10;
  return Math.max(0, cluePoints - hintPenalty);
}

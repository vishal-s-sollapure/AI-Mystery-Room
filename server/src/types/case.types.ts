export type Difficulty = 'easy' | 'medium' | 'hard';
export type CaseLength = 'standard' | 'extended';
export type CaseStatus = 'generating' | 'active' | 'completed' | 'failed';

export type ClueType =
  | 'chat'
  | 'document'
  | 'video'
  | 'statement'
  | 'access_log'
  | 'physical'
  | 'lab_note';

export type HintType = 'nudge' | 'connection' | 'deduction';

export interface Suspect {
  id: string;
  name: string;
  role: string;
  profile: string;
  motiveContext: string;
  alibi: string;
  tone?: string;
}

export interface Clue {
  id: string;
  title: string;
  teaser: string;
  content: string;
  type: ClueType;
  timestamp?: string;
  relatedSuspectIds: string[];
}

export interface Hint {
  id: string;
  order: number;
  text: string;
  type: HintType;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  relatedSuspectIds: string[];
  relatedClueIds: string[];
}

export interface Solution {
  culpritId: string;
  motive: string;
  method: string;
  opportunity: string;
  explanation: string;
  decisiveClueIds: string[];
  misleadingExplanation?: string;
}

export interface Progress {
  discoveredClueIds: string[];
  hintsUsed: number;
  revealedHintIds: string[];
  notes: string;
  accusation?: {
    suspectId: string;
    isCorrect: boolean;
    submittedAt: Date;
  };
  score?: number;
  status: 'investigating' | 'completed';
}

export interface GenerationMetadata {
  provider: 'gemini';
  model: string;
  promptVersion: string;
  schemaVersion: string;
}

export interface DifficultyRule {
  suspects: number;
  clues: number;
  hints: number;
  basePoints: number;
}

export const DIFFICULTY_RULES: Record<Difficulty, DifficultyRule> = {
  easy: { suspects: 3, clues: 5, hints: 2, basePoints: 100 },
  medium: { suspects: 4, clues: 7, hints: 3, basePoints: 150 },
  hard: { suspects: 5, clues: 9, hints: 3, basePoints: 200 },
};

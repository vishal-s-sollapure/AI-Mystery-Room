export type Difficulty = 'easy' | 'medium' | 'hard';
export type CaseLength = 'standard' | 'extended';

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
  type: 'chat' | 'document' | 'video' | 'statement' | 'access_log' | 'physical' | 'lab_note';
  timestamp?: string;
  relatedSuspectIds: string[];
  isDiscovered: boolean;
  content?: string;
}

export interface Hint {
  id: string;
  order: number;
  text: string;
  type: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  relatedSuspectIds: string[];
  relatedClueIds: string[];
}

export interface PublicCase {
  id: string;
  title: string;
  premise: string;
  story: string;
  category: string;
  difficulty: Difficulty;
  caseLength: CaseLength;
  status: 'active' | 'completed' | 'generating' | 'failed';
  setting: string;
  incidentSummary: string;
  suspects: Suspect[];
  clues: Clue[];
  timeline: TimelineEvent[];
  revealedHints: Hint[];
  progress: {
    discoveredClueIds: string[];
    discoveredCount: number;
    totalClues: number;
    hintsUsed: number;
    maxHints: number;
    provisionalScore: number;
    notes: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  premise: string;
  category: string;
  difficulty: Difficulty;
  caseLength: CaseLength;
  status: string;
  score?: number;
  isCorrect?: boolean;
  discoveredCluesCount: number;
  totalClues: number;
  hintsUsed: number;
  createdAt: string;
  completedAt?: string;
}

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

export interface ResultData {
  caseId: string;
  title: string;
  verdict: {
    isCorrect: boolean;
    accusedSuspectId: string;
    accusedSuspectName: string;
    submittedAt: string;
  };
  culprit: Suspect;
  solution: {
    motive: string;
    method: string;
    opportunity: string;
    explanation: string;
    decisiveClues: {
      id: string;
      title: string;
      content: string;
    }[];
    misleadingExplanation?: string;
  };
  scoreBreakdown: ScoreBreakdown;
  completedAt: string;
}

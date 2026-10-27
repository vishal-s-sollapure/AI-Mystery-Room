import { MysteryCaseDocument } from '../models/case.model.js';
import { calculateScore, getProvisionalScore, ScoreBreakdown } from '../services/scoring.service.js';
import { DIFFICULTY_RULES, Suspect, TimelineEvent } from '../types/case.types.js';

export interface PublicClueDto {
  id: string;
  title: string;
  teaser: string;
  type: string;
  timestamp?: string;
  relatedSuspectIds: string[];
  isDiscovered: boolean;
  content?: string; // ONLY populated if isDiscovered is true
}

export interface PublicHintDto {
  id: string;
  order: number;
  text: string;
  type: string;
}

export interface PublicCaseDto {
  id: string;
  title: string;
  premise: string;
  story: string;
  category: string;
  difficulty: string;
  caseLength: string;
  status: string;
  setting: string;
  incidentSummary: string;
  suspects: Suspect[];
  clues: PublicClueDto[];
  timeline: TimelineEvent[];
  revealedHints: PublicHintDto[];
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseSummaryDto {
  id: string;
  title: string;
  premise: string;
  category: string;
  difficulty: string;
  caseLength: string;
  status: string;
  score?: number;
  isCorrect?: boolean;
  discoveredCluesCount: number;
  totalClues: number;
  hintsUsed: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ResultDto {
  caseId: string;
  title: string;
  verdict: {
    isCorrect: boolean;
    accusedSuspectId: string;
    accusedSuspectName: string;
    submittedAt: Date;
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
  completedAt: Date;
}

export function toPublicCaseDto(doc: MysteryCaseDocument): PublicCaseDto {
  const rule = DIFFICULTY_RULES[doc.difficulty];
  const discoveredSet = new Set(doc.progress.discoveredClueIds || []);
  const revealedIds = new Set(doc.progress.revealedHintIds || []);

  const sanitizedClues: PublicClueDto[] = doc.clues.map((clue) => {
    const isDiscovered = discoveredSet.has(clue.id);
    return {
      id: clue.id,
      title: clue.title,
      teaser: clue.teaser,
      type: clue.type,
      timestamp: clue.timestamp,
      relatedSuspectIds: clue.relatedSuspectIds,
      isDiscovered,
      content: isDiscovered ? clue.content : undefined,
    };
  });

  // Only expose hints that have been explicitly unlocked
  const revealedHints: PublicHintDto[] = doc.hints
    .filter((h) => revealedIds.has(h.id))
    .map((h) => ({
      id: h.id,
      order: h.order,
      text: h.text,
      type: h.type,
    }))
    .sort((a, b) => a.order - b.order);

  const provisionalScore = getProvisionalScore(
    doc.difficulty,
    discoveredSet.size,
    doc.progress.hintsUsed
  );

  return {
    id: doc._id.toString(),
    title: doc.title,
    premise: doc.premise,
    story: doc.story,
    category: doc.category,
    difficulty: doc.difficulty,
    caseLength: doc.caseLength,
    status: doc.status,
    setting: doc.setting,
    incidentSummary: doc.incidentSummary,
    suspects: doc.suspects.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      profile: s.profile,
      motiveContext: s.motiveContext,
      alibi: s.alibi,
      tone: s.tone,
    })),
    clues: sanitizedClues,
    timeline: doc.timeline,
    revealedHints,
    progress: {
      discoveredClueIds: Array.from(discoveredSet),
      discoveredCount: discoveredSet.size,
      totalClues: doc.clues.length,
      hintsUsed: doc.progress.hintsUsed,
      maxHints: rule.hints,
      provisionalScore,
      notes: doc.progress.notes || '',
      status: doc.progress.status,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toCaseSummaryDto(doc: MysteryCaseDocument): CaseSummaryDto {
  return {
    id: doc._id.toString(),
    title: doc.title,
    premise: doc.premise,
    category: doc.category,
    difficulty: doc.difficulty,
    caseLength: doc.caseLength,
    status: doc.status,
    score: doc.progress.score,
    isCorrect: doc.progress.accusation?.isCorrect,
    discoveredCluesCount: (doc.progress.discoveredClueIds || []).length,
    totalClues: doc.clues.length,
    hintsUsed: doc.progress.hintsUsed || 0,
    createdAt: doc.createdAt,
    completedAt: doc.completedAt,
  };
}

export function toResultDto(doc: MysteryCaseDocument): ResultDto {
  if (doc.status !== 'completed' || !doc.progress.accusation) {
    throw new Error('Case is not completed yet.');
  }

  const accusation = doc.progress.accusation;
  const accused = doc.suspects.find((s) => s.id === accusation.suspectId);
  const culprit = doc.suspects.find((s) => s.id === doc.solution.culpritId);

  if (!culprit) {
    throw new Error('Culprit suspect not found in case.');
  }

  const decisiveClues = doc.clues
    .filter((c) => doc.solution.decisiveClueIds.includes(c.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      content: c.content,
    }));

  const scoreBreakdown = calculateScore(
    doc.difficulty,
    accusation.isCorrect,
    (doc.progress.discoveredClueIds || []).length,
    doc.progress.hintsUsed || 0
  );

  return {
    caseId: doc._id.toString(),
    title: doc.title,
    verdict: {
      isCorrect: accusation.isCorrect,
      accusedSuspectId: accusation.suspectId,
      accusedSuspectName: accused?.name || 'Unknown Suspect',
      submittedAt: accusation.submittedAt,
    },
    culprit: {
      id: culprit.id,
      name: culprit.name,
      role: culprit.role,
      profile: culprit.profile,
      motiveContext: culprit.motiveContext,
      alibi: culprit.alibi,
      tone: culprit.tone,
    },
    solution: {
      motive: doc.solution.motive,
      method: doc.solution.method,
      opportunity: doc.solution.opportunity,
      explanation: doc.solution.explanation,
      decisiveClues,
      misleadingExplanation: doc.solution.misleadingExplanation,
    },
    scoreBreakdown,
    completedAt: doc.completedAt || new Date(),
  };
}

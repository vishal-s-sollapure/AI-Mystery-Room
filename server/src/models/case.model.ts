import { Schema, model, Document } from 'mongoose';
import {
  CaseLength,
  CaseStatus,
  Clue,
  Difficulty,
  Hint,
  Progress,
  Solution,
  Suspect,
  TimelineEvent,
  GenerationMetadata,
} from '../types/case.types.js';

const suspectSchema = new Schema<Suspect>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    profile: { type: String, required: true },
    motiveContext: { type: String, required: true },
    alibi: { type: String, required: true },
    tone: { type: String, default: 'neutral' },
  },
  { _id: false }
);

const clueSchema = new Schema<Clue>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    teaser: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['chat', 'document', 'video', 'statement', 'access_log', 'physical', 'lab_note'],
      required: true,
    },
    timestamp: { type: String },
    relatedSuspectIds: [{ type: String }],
  },
  { _id: false }
);

const hintSchema = new Schema<Hint>(
  {
    id: { type: String, required: true },
    order: { type: Number, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['nudge', 'connection', 'deduction'], required: true },
  },
  { _id: false }
);

const timelineSchema = new Schema<TimelineEvent>(
  {
    id: { type: String, required: true },
    timestamp: { type: String, required: true },
    description: { type: String, required: true },
    relatedSuspectIds: [{ type: String }],
    relatedClueIds: [{ type: String }],
  },
  { _id: false }
);

const solutionSchema = new Schema<Solution>(
  {
    culpritId: { type: String, required: true },
    motive: { type: String, required: true },
    method: { type: String, required: true },
    opportunity: { type: String, required: true },
    explanation: { type: String, required: true },
    decisiveClueIds: [{ type: String, required: true }],
    misleadingExplanation: { type: String },
  },
  { _id: false }
);

const progressSchema = new Schema(
  {
    discoveredClueIds: [{ type: String }],
    hintsUsed: { type: Number, default: 0 },
    revealedHintIds: [{ type: String }],
    notes: { type: String, default: '' },
    lastHintIdempotencyKey: { type: String },
    lastAccuseIdempotencyKey: { type: String },
    lastHintReturned: {
      id: { type: String },
      order: { type: Number },
      text: { type: String },
      type: { type: String },
    },
    accusation: {
      suspectId: { type: String },
      isCorrect: { type: Boolean },
      submittedAt: { type: Date },
    },
    score: { type: Number },
    status: {
      type: String,
      enum: ['investigating', 'completed'],
      default: 'investigating',
    },
  },
  { _id: false }
);

export interface MysteryCaseDocument extends Document {
  ownerId: string;
  title: string;
  premise: string;
  story: string;
  category: string;
  difficulty: Difficulty;
  caseLength: CaseLength;
  status: CaseStatus;
  setting: string;
  incidentSummary: string;
  suspects: Suspect[];
  clues: Clue[];
  hints: Hint[];
  timeline: TimelineEvent[];
  solution: Solution;
  progress: Progress;
  generationMetadata: GenerationMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const caseSchema = new Schema<MysteryCaseDocument>(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    premise: { type: String, required: true },
    story: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    caseLength: { type: String, enum: ['standard', 'extended'], default: 'standard' },
    status: {
      type: String,
      enum: ['generating', 'active', 'completed', 'failed'],
      required: true,
      index: true,
    },
    setting: { type: String, required: true },
    incidentSummary: { type: String, required: true },
    suspects: [suspectSchema],
    clues: [clueSchema],
    hints: [hintSchema],
    timeline: [timelineSchema],
    solution: { type: solutionSchema, required: true },
    progress: {
      type: progressSchema,
      default: () => ({
        discoveredClueIds: [],
        hintsUsed: 0,
        revealedHintIds: [],
        notes: '',
        status: 'investigating',
      }),
    },
    generationMetadata: {
      provider: { type: String, default: 'gemini' },
      model: { type: String, required: true },
      promptVersion: { type: String, default: '1.1.0' },
      schemaVersion: { type: String, default: '1.1.0' },
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

caseSchema.index({ ownerId: 1, createdAt: -1 });

export const MysteryCase = model<MysteryCaseDocument>('MysteryCase', caseSchema);

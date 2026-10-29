import mongoose from 'mongoose';
import { MysteryCase, MysteryCaseDocument } from '../models/case.model.js';
import { CreateCaseInput } from '../schemas/api.schema.js';
import {
  CaseSummaryDto,
  PublicCaseDto,
  PublicClueDto,
  PublicHintDto,
  ResultDto,
  toCaseSummaryDto,
  toPublicCaseDto,
  toResultDto,
} from '../schemas/dto.schema.js';
import { GeminiService } from './gemini.service.js';
import { calculateScore, getProvisionalScore } from './scoring.service.js';
import { DIFFICULTY_RULES } from '../types/case.types.js';
import { AppError } from '../utils/response.js';
import { env } from '../config/env.js';

export class MysteryService {
  constructor(private geminiService: GeminiService) {}

  async createCase(
    ownerId: string,
    input: CreateCaseInput
  ): Promise<PublicCaseDto> {
    // Generate structured mystery from Gemini
    const generated = await this.geminiService.generate({
      premise: input.premise,
      category: input.category,
      difficulty: input.difficulty,
      caseLength: input.caseLength,
    });

    const doc = await MysteryCase.create({
      ownerId,
      title: generated.title,
      premise: input.premise,
      story: generated.story,
      category: input.category,
      difficulty: input.difficulty,
      caseLength: input.caseLength,
      status: 'active',
      setting: generated.setting,
      incidentSummary: generated.incidentSummary,
      suspects: generated.suspects,
      clues: generated.clues,
      hints: generated.hints,
      timeline: generated.timeline,
      solution: generated.solution,
      progress: {
        discoveredClueIds: [],
        hintsUsed: 0,
        revealedHintIds: [],
        notes: '',
        status: 'investigating',
      },
      generationMetadata: {
        provider: 'gemini',
        model: env.GEMINI_MODEL,
        promptVersion: '1.1.0',
        schemaVersion: '1.1.0',
      },
    });

    return toPublicCaseDto(doc);
  }

  async getCase(ownerId: string, caseId: string): Promise<PublicCaseDto> {
    const doc = await this.findOwnedCase(ownerId, caseId);
    return toPublicCaseDto(doc);
  }

  async listCases(ownerId: string): Promise<CaseSummaryDto[]> {
    const docs = await MysteryCase.find({ ownerId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(toCaseSummaryDto);
  }

  async discoverClue(
    ownerId: string,
    caseId: string,
    clueId: string
  ): Promise<{ clue: PublicClueDto; caseState: PublicCaseDto }> {
    const doc = await this.findOwnedCase(ownerId, caseId);

    if (doc.status === 'completed') {
      throw new AppError(
        'CASE_ALREADY_COMPLETED',
        'Cannot discover clues on a completed case',
        400
      );
    }

    const targetClue = doc.clues.find((c) => c.id === clueId);
    if (!targetClue) {
      throw new AppError('CLUE_NOT_FOUND', 'Requested clue does not exist in this case', 404);
    }

    const alreadyDiscovered = doc.progress.discoveredClueIds.includes(clueId);
    if (!alreadyDiscovered) {
      doc.progress.discoveredClueIds.push(clueId);
      await doc.save();
    }

    const caseState = toPublicCaseDto(doc);
    const updatedClue = caseState.clues.find((c) => c.id === clueId)!;

    return {
      clue: updatedClue,
      caseState,
    };
  }

  async requestHint(
    ownerId: string,
    caseId: string,
    idempotencyKey?: string
  ): Promise<{ hint: PublicHintDto; caseState: PublicCaseDto }> {
    const doc = await this.findOwnedCase(ownerId, caseId);

    if (doc.status === 'completed') {
      throw new AppError('CASE_ALREADY_COMPLETED', 'Case has already been completed', 400);
    }

    // Idempotency check: if the client retries with the same key, return the same hint without charging twice
    if (
      idempotencyKey &&
      doc.progress.lastHintIdempotencyKey === idempotencyKey &&
      doc.progress.lastHintReturned
    ) {
      return {
        hint: doc.progress.lastHintReturned,
        caseState: toPublicCaseDto(doc),
      };
    }

    const rule = DIFFICULTY_RULES[doc.difficulty];
    if (doc.progress.hintsUsed >= rule.hints) {
      throw new AppError(
        'HINTS_EXHAUSTED',
        `No more hints available. Maximum of ${rule.hints} hints reached.`,
        409
      );
    }

    const nextOrder = doc.progress.hintsUsed + 1;
    const nextHint = doc.hints.find((h) => h.order === nextOrder);

    if (!nextHint) {
      throw new AppError('HINTS_EXHAUSTED', 'No further hints available in case.', 409);
    }

    const hintDto: PublicHintDto = {
      id: nextHint.id,
      order: nextHint.order,
      text: nextHint.text,
      type: nextHint.type,
    };

    if (!doc.progress.revealedHintIds.includes(nextHint.id)) {
      doc.progress.revealedHintIds.push(nextHint.id);
      doc.progress.hintsUsed += 1;
    }

    if (idempotencyKey) {
      doc.progress.lastHintIdempotencyKey = idempotencyKey;
      doc.progress.lastHintReturned = hintDto;
    }

    await doc.save();

    const caseState = toPublicCaseDto(doc);

    return {
      hint: hintDto,
      caseState,
    };
  }

  async saveNotes(
    ownerId: string,
    caseId: string,
    notes: string
  ): Promise<{ notes: string }> {
    const doc = await this.findOwnedCase(ownerId, caseId);
    doc.progress.notes = notes;
    await doc.save();
    return { notes: doc.progress.notes };
  }

  async accuse(
    ownerId: string,
    caseId: string,
    suspectId: string,
    idempotencyKey?: string
  ): Promise<ResultDto> {
    const doc = await this.findOwnedCase(ownerId, caseId);

    // If case already completed, return existing result (idempotency per FR-068)
    if (doc.status === 'completed' && doc.progress.accusation) {
      return toResultDto(doc);
    }

    if (
      idempotencyKey &&
      doc.progress.lastAccuseIdempotencyKey === idempotencyKey &&
      doc.progress.accusation
    ) {
      return toResultDto(doc);
    }

    const suspect = doc.suspects.find((s) => s.id === suspectId);
    if (!suspect) {
      throw new AppError(
        'INVALID_SUSPECT',
        'Selected suspect does not belong to this case',
        400
      );
    }

    const isCorrect = doc.solution.culpritId === suspectId;
    const scoreResult = calculateScore(
      doc.difficulty,
      isCorrect,
      doc.progress.discoveredClueIds.length,
      doc.progress.hintsUsed
    );

    doc.progress.accusation = {
      suspectId,
      isCorrect,
      submittedAt: new Date(),
    };
    if (idempotencyKey) {
      doc.progress.lastAccuseIdempotencyKey = idempotencyKey;
    }
    doc.progress.score = scoreResult.finalScore;
    doc.progress.status = 'completed';
    doc.status = 'completed';
    doc.completedAt = new Date();

    await doc.save();
    return toResultDto(doc);
  }

  async getResult(ownerId: string, caseId: string): Promise<ResultDto> {
    const doc = await this.findOwnedCase(ownerId, caseId);

    if (doc.status !== 'completed') {
      throw new AppError(
        'CASE_NOT_COMPLETED',
        'Results are not available until an accusation is submitted',
        409
      );
    }

    return toResultDto(doc);
  }

  private async findOwnedCase(
    ownerId: string,
    caseId: string
  ): Promise<MysteryCaseDocument> {
    if (!mongoose.isValidObjectId(caseId)) {
      throw new AppError('INVALID_ID', 'Invalid case ID format', 400);
    }

    const doc = await MysteryCase.findOne({ _id: caseId, ownerId }).exec();
    if (!doc) {
      throw new AppError('CASE_NOT_FOUND', 'Case not found or access denied', 404);
    }

    return doc;
  }
}

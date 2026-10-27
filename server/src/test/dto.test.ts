import test from 'node:test';
import assert from 'node:assert';
import { toPublicCaseDto, toResultDto } from '../schemas/dto.schema.js';
import { MysteryCaseDocument } from '../models/case.model.js';

function createMockCase(overrides: Partial<any> = {}): MysteryCaseDocument {
  const base = {
    _id: '671ee1234567890123456789',
    ownerId: 'guest-1234',
    title: 'The Silent Gala',
    premise: 'A diamond disappears during a museum event.',
    story: 'During the annual gala, the Lights went out and the diamond vanished.',
    category: 'theft',
    difficulty: 'medium',
    caseLength: 'standard',
    status: 'active',
    setting: 'Grand Met Museum',
    incidentSummary: 'Diamond stolen between 21:40 and 21:45.',
    suspects: [
      { id: 's1', name: 'Alice', role: 'Curator', profile: 'Obsessed with gems.', motiveContext: 'Financial debt.', alibi: 'At the bar.' },
      { id: 's2', name: 'Bob', role: 'Guard', profile: 'Veteran security.', motiveContext: 'Underpaid.', alibi: 'Patrolling bay.' },
      { id: 's3', name: 'Charlie', role: 'Guest', profile: 'Collector.', motiveContext: 'Coveted diamond.', alibi: 'With host.' },
      { id: 's4', name: 'Diana', role: 'Caterer', profile: 'Staff lead.', motiveContext: 'Recent firing threat.', alibi: 'In kitchen.' },
    ],
    clues: [
      { id: 'c1', title: 'Badge Log', teaser: 'Card swipe at archive.', content: 'Bob swiped badge at 21:42.', type: 'access_log', relatedSuspectIds: ['s2'] },
      { id: 'c2', title: 'Broken Glass', teaser: 'Case shattered.', content: 'Glass cutter marks found.', type: 'physical', relatedSuspectIds: ['s1'] },
      { id: 'c3', title: 'Kitchen Receipt', teaser: 'Order slip.', content: 'Diana was cooking at 21:40.', type: 'document', relatedSuspectIds: ['s4'] },
      { id: 'c4', title: 'Guest Photo', teaser: 'Party snapshot.', content: 'Charlie visible in ballroom at 21:43.', type: 'statement', relatedSuspectIds: ['s3'] },
      { id: 'c5', title: 'Security Footage', teaser: 'Hallway clip.', content: 'Figure in guard uniform seen near vault.', type: 'video', relatedSuspectIds: ['s2'] },
      { id: 'c6', title: 'Pocket Knife', teaser: 'Found near exit.', content: 'Contains grease matching utility room.', type: 'physical', relatedSuspectIds: ['s2'] },
      { id: 'c7', title: 'Deleted Text', teaser: 'Message thread.', content: 'Meet me at the back gate.', type: 'chat', relatedSuspectIds: ['s1', 's2'] },
    ],
    hints: [
      { id: 'h1', order: 1, text: 'Look closely at the card swipe times.', type: 'nudge' },
      { id: 'h2', order: 2, text: 'Compare the guard patrol route with the vault logs.', type: 'connection' },
      { id: 'h3', order: 3, text: 'The uniform in the footage matches one suspect.', type: 'deduction' },
    ],
    timeline: [
      { id: 't1', timestamp: '21:30', description: 'Gala commences.', relatedSuspectIds: [], relatedClueIds: [] },
      { id: 't2', timestamp: '21:42', description: 'Alarm sounds.', relatedSuspectIds: ['s2'], relatedClueIds: ['c1'] },
    ],
    solution: {
      culpritId: 's2',
      motive: 'Bob needed cash to pay off loans.',
      method: 'Used guard override key to access vault.',
      opportunity: 'Was stationed near the archive.',
      explanation: 'Bob staged the blackout and used his badge at 21:42.',
      decisiveClueIds: ['c1', 'c5'],
      misleadingExplanation: 'Alice seemed suspicious, but had no vault access.',
    },
    progress: {
      discoveredClueIds: ['c1'],
      hintsUsed: 1,
      revealedHintIds: ['h1'],
      notes: 'Investigating Bob.',
      status: 'investigating',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...base, ...overrides } as unknown as MysteryCaseDocument;
}

test('DTO Serialization & Solution Protection', async (t) => {
  await t.test('toPublicCaseDto strictly hides private solution and culprit', () => {
    const mock = createMockCase();
    const dto = toPublicCaseDto(mock);

    // Assert solution fields are NOT in the DTO
    assert.strictEqual((dto as any).solution, undefined);
    assert.strictEqual((dto as any).culpritId, undefined);

    // Assert suspects do not contain any culprit indicator
    for (const suspect of dto.suspects) {
      assert.strictEqual((suspect as any).isCulprit, undefined);
    }
  });

  await t.test('toPublicCaseDto redacts undiscovered clue content while exposing teaser', () => {
    const mock = createMockCase({
      progress: {
        discoveredClueIds: ['c1'], // Only c1 discovered
        hintsUsed: 0,
        revealedHintIds: [],
        notes: '',
        status: 'investigating',
      },
    });
    const dto = toPublicCaseDto(mock);

    // c1 is discovered
    const clue1 = dto.clues.find((c) => c.id === 'c1');
    assert.strictEqual(clue1?.isDiscovered, true);
    assert.strictEqual(clue1?.content, 'Bob swiped badge at 21:42.');

    // c2 is NOT discovered
    const clue2 = dto.clues.find((c) => c.id === 'c2');
    assert.strictEqual(clue2?.isDiscovered, false);
    assert.strictEqual(clue2?.content, undefined);
    assert.strictEqual(clue2?.teaser, 'Case shattered.');
  });

  await t.test('toPublicCaseDto only exposes revealed hints', () => {
    const mock = createMockCase({
      progress: {
        discoveredClueIds: [],
        hintsUsed: 1,
        revealedHintIds: ['h1'],
        notes: '',
        status: 'investigating',
      },
    });
    const dto = toPublicCaseDto(mock);
    assert.strictEqual(dto.revealedHints.length, 1);
    assert.strictEqual(dto.revealedHints[0].id, 'h1');
  });

  await t.test('toResultDto throws if case is not completed', () => {
    const mock = createMockCase({ status: 'active' });
    assert.throws(() => toResultDto(mock), /Case is not completed yet/);
  });

  await t.test('toResultDto exposes solution and score breakdown when completed', () => {
    const mock = createMockCase({
      status: 'completed',
      completedAt: new Date(),
      progress: {
        discoveredClueIds: ['c1', 'c5'],
        hintsUsed: 1,
        revealedHintIds: ['h1'],
        notes: '',
        status: 'completed',
        accusation: {
          suspectId: 's2',
          isCorrect: true,
          submittedAt: new Date(),
        },
      },
    });

    const result = toResultDto(mock);
    assert.strictEqual(result.verdict.isCorrect, true);
    assert.strictEqual(result.culprit.id, 's2');
    assert.strictEqual(result.solution.motive, 'Bob needed cash to pay off loans.');
    assert.strictEqual(result.solution.decisiveClues.length, 2);
    // Score: Medium, correct (150) + 2 clues (10) - 1 hint (10) = 150
    assert.strictEqual(result.scoreBreakdown.finalScore, 150);
  });
});

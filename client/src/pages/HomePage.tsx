import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Fingerprint,
  FolderOpen,
  HelpCircle,
  LockKeyhole,
} from 'lucide-react';
import { api } from '../services/api';
import { CaseLength, Difficulty, PublicCase } from '../types/case';

const difficultyPreviews: Record<
  Difficulty,
  { suspects: number; clues: number; hints: number; pts: number }
> = {
  easy: { suspects: 3, clues: 5, hints: 2, pts: 100 },
  medium: { suspects: 4, clues: 7, hints: 3, pts: 150 },
  hard: { suspects: 5, clues: 9, hints: 3, pts: 200 },
};

const categories = [
  { id: 'theft', label: 'Art / Heist' },
  { id: 'disappearance', label: 'Disappearance' },
  { id: 'murder_mystery', label: 'Murder Mystery' },
  { id: 'sabotage', label: 'Sabotage' },
  { id: 'blackmail', label: 'Blackmail' },
  { id: 'general', label: 'General Detective' },
];

const samplePrompts = [
  'A priceless relic disappears during a private museum gala.',
  'A vanished composer leaves behind a coded score and a locked parlor.',
  'Sabotage at sea halts a luxury research vessel with conflicting logs.',
  'The locked observatory clocktower tolls while the astronomer vanishes.',
];

export function HomePage({
  onCaseCreated,
  onOpenHowToPlay,
  onOpenMyCases,
  onOpenSignIn,
}: {
  onCaseCreated: (caseData: PublicCase) => void;
  onOpenHowToPlay: () => void;
  onOpenMyCases: () => void;
  onOpenSignIn: () => void;
}) {
  const [premise, setPremise] = useState(samplePrompts[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [caseLength, setCaseLength] = useState<CaseLength>('standard');
  const [category, setCategory] = useState<string>('theft');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Consulting AI archives...');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const preview = difficultyPreviews[difficulty];

  const handleCreate = async () => {
    if (premise.trim().length < 20) {
      setError('Please provide a mystery premise with at least 20 characters.');
      return;
    }
    if (premise.trim().length > 1500) {
      setError('Premise must not exceed 1500 characters.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setElapsedSeconds(0);
    setLoadingStep('Consulting AI archives...');

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev.includes('Consulting')) return 'Profiling suspects and examining alibis...';
        if (prev.includes('Profiling')) return 'Cataloging forensic clues and timeline records...';
        if (prev.includes('Cataloging')) return 'Cross-referencing decisive evidence and motive...';
        return 'Securing case dossier and opening room...';
      });
    }, 2500);

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const created = await api.createCase({
        premise: premise.trim(),
        difficulty,
        caseLength,
        category,
      });
      clearInterval(stepInterval);
      clearInterval(timerInterval);
      onCaseCreated(created);
    } catch (err: any) {
      clearInterval(stepInterval);
      clearInterval(timerInterval);
      setIsGenerating(false);
      setError(err.message || 'Failed to generate mystery case. Please try again.');
    }
  };

  return (
    <main className="home">
      <nav>
        <div className="brand">
          <Fingerprint /> AI MYSTERY ROOM
        </div>
        <div className="navlinks">
          <a href="#how">How it works</a>
          <button
            type="button"
            className="ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={onOpenHowToPlay}
          >
            <HelpCircle size={14} /> Field Manual
          </button>
          <button
            type="button"
            className="ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={onOpenMyCases}
          >
            <FolderOpen size={14} /> My Cases
          </button>
          <button
            type="button"
            className="ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={onOpenSignIn}
          >
            <Fingerprint size={14} /> Sign In
          </button>
        </div>
      </nav>

      <section className="hero">
        <p className="eyebrow">AN INVESTIGATION IS WAITING</p>
        <h1>
          Every clue tells a story.
          <br />
          <em>Can you find the truth?</em>
        </h1>
        <p className="lede">
          Turn any premise into a rich, cinematic mystery. Follow the evidence, challenge
          every alibi, and reveal what really happened.
        </p>

        <div className="case-file">
          <div className="file-head">
            <span>
              <LockKeyhole size={16} /> NEW CASE FILE
            </span>
            <span>CLASSIFIED DOSSIER</span>
          </div>

          <label htmlFor="premise-input">
            WHAT HAPPENED? ({premise.length}/1500 chars)
          </label>
          <textarea
            id="premise-input"
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            maxLength={1500}
            placeholder="Describe the incident, theft, disappearance, or unexplained event..."
            disabled={isGenerating}
          />

          {error && (
            <div
              style={{
                background: '#4a201c',
                border: '1px solid #7d332d',
                color: '#ffd0ca',
                padding: '8px 12px',
                margin: '10px 0',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <label>MYSTERY CATEGORY</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`filter-btn ${category === c.id ? 'active' : ''}`}
                  onClick={() => setCategory(c.id)}
                  disabled={isGenerating}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="controls">
            <div>
              <label>DIFFICULTY</label>
              <div className="segmented">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={difficulty === d ? 'active' : ''}
                    onClick={() => setDifficulty(d)}
                    disabled={isGenerating}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              <div
                style={{
                  font: '10px "DM Mono", monospace',
                  color: '#b0a494',
                  marginTop: 6,
                }}
              >
                {preview.suspects} suspects · {preview.clues} clues · {preview.hints} hints ·{' '}
                <span style={{ color: '#dcb070' }}>{preview.pts} pts</span>
              </div>
            </div>

            <div>
              <label>CASE LENGTH</label>
              <div className="segmented">
                {(['standard', 'extended'] as CaseLength[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={caseLength === l ? 'active' : ''}
                    onClick={() => setCaseLength(l)}
                    disabled={isGenerating}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
              <div
                style={{
                  font: '10px "DM Mono", monospace',
                  color: '#988e80',
                  marginTop: 6,
                }}
              >
                {caseLength === 'standard' ? 'Compact forensic brief' : 'In-depth testimonies & logs'}
              </div>
            </div>

            <button
              type="button"
              className="generate"
              onClick={handleCreate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                'Opening Case...'
              ) : (
                <>
                  Open Case <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>

          <div className="examples">
            <span>TRY A PROMPT:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPremise(p)}
                disabled={isGenerating}
              >
                {p.slice(0, 32)}…
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="steps">
        <div>
          <span>01</span>
          <h3>Create</h3>
          <p>Provide a premise or scenario. The backend asks Gemini to craft a logically sound mystery.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Investigate</h3>
          <p>Inspect physical evidence, decode transcripts, challenge alibis, and track chronology.</p>
        </div>
        <div>
          <span>03</span>
          <h3>Accuse</h3>
          <p>Commit to one final suspect. Receive the authoritative verdict, culprit reveal, and score.</p>
        </div>
      </section>

      <footer>ALL INVESTIGATIONS ARE FICTIONAL · POWERED BY GEMINI · AI-GENERATED EVIDENCE</footer>

      {isGenerating && (
        <div className="loading-overlay">
          <div className="loader-content" style={{ maxWidth: 460, textAlign: 'center' }}>
            <div className="spinner" />
            <p className="eyebrow" style={{ color: '#c39453', margin: '0 0 8px' }}>
              CASE DOSSIER IN GENERATION
            </p>
            <h3 style={{ font: '500 24px Fraunces, serif', color: '#f5ebdd', margin: '0 0 12px' }}>
              {loadingStep}
            </h3>
            
            <div style={{
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              overflow: 'hidden',
              margin: '12px 0 8px',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(95, Math.max(10, (elapsedSeconds / 10) * 100))}%`,
                background: 'linear-gradient(90deg, #c39453, #e8be78)',
                borderRadius: 2,
                transition: 'width 0.4s ease-out'
              }} />
            </div>

            <p style={{ color: '#9d9487', fontSize: 12, margin: '6px 0 0' }}>
              Validating forensic clues and timeline records ({elapsedSeconds}s · ~8–12s typical)
            </p>

            <button
              type="button"
              className="ghost"
              style={{ marginTop: 18, fontSize: 11 }}
              onClick={() => setIsGenerating(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

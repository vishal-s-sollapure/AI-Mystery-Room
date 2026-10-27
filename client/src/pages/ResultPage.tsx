import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  FileText,
  Fingerprint,
  FolderOpen,
  HelpCircle,
  ShieldAlert,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { ResultData } from '../types/case';
import { MyCasesModal } from '../components/MyCasesModal';
import { HowToPlayModal } from '../components/HowToPlayModal';

export function ResultPage({
  caseId,
  onPlayAgain,
}: {
  caseId: string;
  onPlayAgain: () => void;
}) {
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMyCases, setShowMyCases] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    api
      .getResult(caseId)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to retrieve case results.');
        setLoading(false);
      });
  }, [caseId]);

  if (loading) {
    return (
      <main className="result">
        <div style={{ textAlign: 'center', color: '#c39453' }}>
          <div className="spinner" />
          <p style={{ font: '12px "DM Mono", monospace' }}>UNSEALING VERDICT DOSSIER...</p>
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="result">
        <div className="result-card">
          <p className="eyebrow" style={{ color: '#d97a73' }}>
            ERROR
          </p>
          <h1>Could not load case report</h1>
          <p className="lede">{error}</p>
          <button className="generate" onClick={onPlayAgain}>
            Return Home <ArrowRight size={17} />
          </button>
        </div>
      </main>
    );
  }

  const { verdict, culprit, solution, scoreBreakdown } = result;
  const isCorrect = verdict.isCorrect;

  return (
    <main className="result">
      {/* Top Navbar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#11100fe6',
          backdropFilter: 'blur(8px)',
          zIndex: 5,
        }}
      >
        <div className="brand" onClick={onPlayAgain} style={{ cursor: 'pointer' }}>
          <Fingerprint /> AI MYSTERY ROOM
        </div>
        <div className="navlinks">
          <button
            type="button"
            className="ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowHowToPlay(true)}
          >
            <HelpCircle size={14} /> Field Manual
          </button>
          <button
            type="button"
            className="ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowMyCases(true)}
          >
            <FolderOpen size={14} /> My Cases
          </button>
        </div>
      </nav>

      <div className="result-card" style={{ marginTop: 80 }}>
        {/* Seal icon */}
        <div className={`seal ${isCorrect ? 'success' : 'failure'}`}>
          {isCorrect ? <Check size={38} /> : <X size={38} />}
        </div>

        <p className="eyebrow">CASE RESOLVED · {result.title.toUpperCase()}</p>
        <h1>{isCorrect ? 'You found the truth.' : 'The truth was missed.'}</h1>
        <p className="lede">
          {isCorrect
            ? `Your deduction was precise. You correctly identified ${culprit.name} as the culprit.`
            : `You accused ${verdict.accusedSuspectName}, but the true perpetrator was ${culprit.name} (${culprit.role}).`}
        </p>

        {/* Culprit & Solution narrative box */}
        <div className="solution">
          <h3>The Anatomy of the Crime</h3>
          <p>
            <b>Culprit:</b> {culprit.name} ({culprit.role})
          </p>
          <p>
            <b>Motive:</b> {solution.motive}
          </p>
          <p>
            <b>Method:</b> {solution.method}
          </p>
          <p>
            <b>Opportunity:</b> {solution.opportunity}
          </p>
          <div style={{ margin: '14px 0', borderTop: '1px solid #ffffff12', paddingTop: 10 }}>
            <b style={{ color: '#e8ba74', display: 'block', marginBottom: 4 }}>Full Reconstruction:</b>
            <span style={{ fontSize: 13, color: '#cdc3b5', lineHeight: 1.6 }}>{solution.explanation}</span>
          </div>

          {/* Decisive Evidence */}
          {solution.decisiveClues && solution.decisiveClues.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <b style={{ color: '#e8ba74', display: 'block', marginBottom: 6 }}>
                Decisive Proof:
              </b>
              {solution.decisiveClues.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: '#151311',
                    borderLeft: '2px solid #c39453',
                    padding: '8px 12px',
                    margin: '6px 0',
                    fontSize: 12,
                  }}
                >
                  <b style={{ color: '#d5cbbd' }}>{c.title} —</b> {c.content}
                </div>
              ))}
            </div>
          )}

          {/* Misleading clues explanation */}
          {solution.misleadingExplanation && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#a89d8f' }}>
              <b style={{ color: '#d9a868' }}>Deceptive Red Herrings:</b> {solution.misleadingExplanation}
            </div>
          )}
        </div>

        {/* Score Breakdown Table per SPEC §3.2 */}
        <div className="score-breakdown">
          <div style={{ font: '500 11px "DM Mono", monospace', color: '#c39453', letterSpacing: 1, marginBottom: 10, textAlign: 'left' }}>
            OFFICIAL SCORING BREAKDOWN
          </div>
          <div className="score-row">
            <span>Difficulty Base Accusation ({scoreBreakdown.difficulty.toUpperCase()})</span>
            <span className={scoreBreakdown.basePoints > 0 ? 'pos' : 'neg'}>
              {scoreBreakdown.basePoints > 0 ? `+${scoreBreakdown.basePoints}` : '0 (Incorrect)'}
            </span>
          </div>
          <div className="score-row">
            <span>Distinct Clues Discovered ({scoreBreakdown.distinctDiscoveredClues} × 5 pts)</span>
            <span className="pos">+{scoreBreakdown.cluePoints}</span>
          </div>
          <div className="score-row">
            <span>Tactical Hints Deductions ({scoreBreakdown.hintsUsed} × 10 pts)</span>
            <span className="neg">-{scoreBreakdown.hintPenalty}</span>
          </div>
          <div className="score-row total">
            <span>FINAL DETECTIVE SCORE</span>
            <span style={{ color: '#e8ba74' }}>{scoreBreakdown.finalScore} PTS</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button type="button" className="generate" onClick={onPlayAgain}>
            Create Another Case <ArrowRight size={17} />
          </button>
          <button
            type="button"
            className="ghost"
            style={{ fontSize: 13, padding: '12px 18px' }}
            onClick={() => setShowMyCases(true)}
          >
            Open My Cases Dossier
          </button>
        </div>
      </div>

      {showMyCases && (
        <MyCasesModal
          onClose={() => setShowMyCases(false)}
          onSelectCase={(id, status) => {
            setShowMyCases(false);
            if (status === 'completed') {
              // Reload results for that completed case
              setLoading(true);
              api.getResult(id).then((fresh) => {
                setResult(fresh);
                setLoading(false);
              });
            } else {
              // Return to active investigation
              window.location.hash = `#case/${id}`;
            }
          }}
        />
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </main>
  );
}

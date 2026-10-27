import React from 'react';
import { BookOpen, CheckCircle, HelpCircle, ShieldAlert, X } from 'lucide-react';

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <p className="eyebrow">FIELD MANUAL</p>
        <h2>How To Investigate</h2>

        <div style={{ color: '#c4bcb0', fontSize: 13, lineHeight: 1.6, maxHeight: 440, overflowY: 'auto' }}>
          <p>
            Welcome, Detective. You are tasked with solving AI-generated fictional mysteries by
            examining physical clues, interviewing witness records, and deducing the culprit.
          </p>

          <div style={{ background: '#171513', border: '1px solid #3c342d', padding: 12, margin: '12px 0' }}>
            <b style={{ color: '#e8ba74', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ShieldAlert size={15} /> 1. Discovering Evidence
            </b>
            Evidence items begin sealed with a short teaser. Clicking <b>Inspect Evidence</b> marks
            it discovered on the server, unveils the full forensic text, and awards <b>+5 points</b> per distinct clue.
          </div>

          <div style={{ background: '#171513', border: '1px solid #3c342d', padding: 12, margin: '12px 0' }}>
            <b style={{ color: '#e8ba74', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <HelpCircle size={15} /> 2. Tactical Hints
            </b>
            If you hit a dead end, request a hint. Hints progress in order: <i>Nudge</i>, <i>Connection</i>, and <i>Deduction</i>. Each hint deducts <b>10 points</b> from your final score.
          </div>

          <div style={{ background: '#171513', border: '1px solid #3c342d', padding: 12, margin: '12px 0' }}>
            <b style={{ color: '#e8ba74', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <CheckCircle size={15} /> 3. Authoritative Scoring
            </b>
            <div style={{ font: '11px "DM Mono", monospace', color: '#b58547', margin: '4px 0' }}>
              Final Score = max(0, BasePoints + (Clues × 5) - (Hints × 10))
            </div>
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              <li><b>Easy:</b> 100 Base pts (3 suspects, 5 clues, 2 hints)</li>
              <li><b>Medium:</b> 150 Base pts (4 suspects, 7 clues, 3 hints)</li>
              <li><b>Hard:</b> 200 Base pts (5 suspects, 9 clues, 3 hints)</li>
              <li>An incorrect accusation yields <b>0 Base points</b>.</li>
            </ul>
          </div>

          <p style={{ fontStyle: 'italic', color: '#9c9284', fontSize: 11, marginTop: 14 }}>
            Remember: You have only one final accusation per case. Once submitted, the verdict is final.
          </p>
        </div>
      </div>
    </div>
  );
}

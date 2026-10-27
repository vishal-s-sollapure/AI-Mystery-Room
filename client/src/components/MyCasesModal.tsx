import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Clock3, FolderOpen, X } from 'lucide-react';
import { api } from '../services/api';
import { CaseSummary } from '../types/case';

export function MyCasesModal({
  onClose,
  onSelectCase,
}: {
  onClose: () => void;
  onSelectCase: (caseId: string, status: string) => void;
}) {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listMyCases()
      .then((data) => {
        setCases(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load case files');
        setLoading(false);
      });
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal my-cases-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>
        <p className="eyebrow">ARCHIVE DOSSIER</p>
        <h2>Your Investigation Files</h2>
        <p>Review active investigations or revisit concluded verdicts.</p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#aa9e8e' }}>
            <div className="spinner" />
            <span style={{ font: '11px "DM Mono", monospace' }}>RETRIEVING FILES FROM ARCHIVE...</span>
          </div>
        )}

        {error && (
          <div style={{ padding: 14, background: '#451f1c', color: '#ffb4a8', margin: '14px 0', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: '#958d81' }}>
            <FolderOpen size={36} style={{ color: '#5a4f44', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No case files recorded under this dossier yet.</p>
            <small style={{ color: '#746b60' }}>Start your first mystery on the home page.</small>
          </div>
        )}

        {!loading && cases.length > 0 && (
          <div className="case-card-grid">
            {cases.map((c) => {
              const isCompleted = c.status === 'completed';
              return (
                <button
                  key={c.id}
                  className="case-summary-card"
                  onClick={() => onSelectCase(c.id, c.status)}
                >
                  <div className="case-card-info">
                    <b>{c.title}</b>
                    <p>{c.premise}</p>
                    <div className="case-card-badges">
                      <span className="badge-pill">{c.difficulty.toUpperCase()}</span>
                      <span className="badge-pill">{c.category.toUpperCase()}</span>
                      {isCompleted ? (
                        <span className={`badge-pill ${c.isCorrect ? 'win' : 'loss'}`}>
                          {c.isCorrect ? 'VERDICT: SOLVED' : 'VERDICT: UNSOLVED'} ({c.score} PTS)
                        </span>
                      ) : (
                        <span className="badge-pill" style={{ color: '#e8ba74', borderColor: '#805d31' }}>
                          IN PROGRESS ({c.discoveredCluesCount}/{c.totalClues} CLUES)
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c39453', fontSize: 12, flexShrink: 0, marginLeft: 14 }}>
                    <span>{isCompleted ? 'View Report' : 'Resume'}</span>
                    <ArrowRight size={15} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ArrowRight, Check, ShieldAlert, X } from 'lucide-react';
import { Suspect } from '../types/case';

export function AccuseModal({
  suspects,
  caseTitle,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  suspects: Suspect[];
  caseTitle: string;
  onClose: () => void;
  onSubmit: (suspectId: string) => void;
  isSubmitting: boolean;
}) {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);

  const selectedSuspect = suspects.find((s) => s.id === selectedSuspectId);

  const handleSelectSuspect = (id: string) => {
    setSelectedSuspectId(id);
    setConfirmed(false); // Reset confirmation when changing suspect
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="close"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
        <p className="eyebrow">FINAL ACCUSATION</p>
        <h2>Who is responsible?</h2>
        <p>
          You have one final accusation for <b>{caseTitle}</b>. Review the evidence carefully before committing. Once submitted, your accusation is permanent and authoritative.
        </p>

        <div className="accuse-list">
          {suspects.map((s) => {
            const isChosen = selectedSuspectId === s.id;
            const initials = s.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2);
            return (
              <button
                key={s.id}
                type="button"
                className={isChosen ? 'chosen' : ''}
                onClick={() => handleSelectSuspect(s.id)}
                disabled={isSubmitting}
              >
                <span className={`portrait ${s.tone || 'amber'}`}>{initials}</span>
                <span>
                  <b>{s.name}</b>
                  <small>{s.role}</small>
                </span>
                {isChosen && <Check size={18} />}
              </button>
            );
          })}
        </div>

        {selectedSuspect && (
          <div
            style={{
              background: '#191512',
              border: '1px solid #5a382c',
              padding: 12,
              borderRadius: 3,
              margin: '12px 0 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#e8ba74',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              <ShieldAlert size={16} />
              <span>CONFIRM ACCUSATION TARGET</span>
            </div>
            <div style={{ fontSize: 13, color: '#e5ddd0' }}>
              Accusing: <b>{selectedSuspect.name}</b> ({selectedSuspect.role})
            </div>
            <p style={{ fontSize: 11, color: '#a69a8b', margin: '4px 0 10px', lineHeight: 1.4 }}>
              The backend will evaluate your deduction against the hidden evidence. You will immediately receive the official verdict, motive, and score.
            </p>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#d6cbbd',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={isSubmitting}
                style={{ accentColor: '#c39453' }}
              />
              <span>I confirm this accusation is final and cannot be modified.</span>
            </label>
          </div>
        )}

        <button
          disabled={!selectedSuspectId || !confirmed || isSubmitting}
          className="generate final"
          onClick={() => selectedSuspectId && onSubmit(selectedSuspectId)}
        >
          {isSubmitting ? (
            'Evaluating Accusation...'
          ) : (
            <>
              Submit Final Accusation <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

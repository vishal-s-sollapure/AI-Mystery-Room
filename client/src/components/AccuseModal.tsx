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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} disabled={isSubmitting} aria-label="Close modal">
          <X size={18} />
        </button>
        <p className="eyebrow">FINAL ACCUSATION</p>
        <h2>Who is responsible?</h2>
        <p>
          You have one final accusation for <b>{caseTitle}</b>. Review the evidence carefully before committing. Once submitted, your accusation is final.
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
                onClick={() => setSelectedSuspectId(s.id)}
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

        <button
          disabled={!selectedSuspectId || isSubmitting}
          className="generate final"
          onClick={() => onSubmit(selectedSuspectId)}
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

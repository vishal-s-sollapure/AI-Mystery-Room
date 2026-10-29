import React, { useEffect, useState } from 'react';
import { Check, Copy, Fingerprint, ShieldCheck, X } from 'lucide-react';
import { api } from '../services/api';

export function SignInModal({ onClose }: { onClose: () => void }) {
  const [session, setSession] = useState<{
    ownerId: string;
    badgeNumber: string;
    isGuest: boolean;
    status: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSession()
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleCopyId = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.ownerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <button className="close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <p className="eyebrow">FIELD INVESTIGATOR CREDENTIALS</p>
        <h2>Investigator Dossier</h2>
        <p>
          AI Mystery Room provides full guest access with secure, server-issued session persistence.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#c39453' }}>
            <div className="spinner" />
            <span style={{ font: '11px "DM Mono", monospace' }}>RETRIEVING BADGE...</span>
          </div>
        ) : session ? (
          <div
            style={{
              background: '#161412',
              border: '1px solid #4a3e31',
              padding: 16,
              borderRadius: 3,
              margin: '16px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#6e302f',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#f5ebdd',
                }}
              >
                <Fingerprint size={20} />
              </div>
              <div>
                <b style={{ color: '#e8ba74', fontSize: 14 }}>{session.badgeNumber}</b>
                <div style={{ font: '10px "DM Mono", monospace', color: '#8e8476' }}>
                  SESSION STATUS: <span style={{ color: '#8ec982' }}>ACTIVE & PERSISTED</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  font: '10px "DM Mono", monospace',
                  color: '#9e9282',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                SECURE INVESTIGATOR IDENTIFIER:
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0e0d0c',
                  border: '1px solid #2d2620',
                  padding: '6px 10px',
                  borderRadius: 2,
                  gap: 8,
                }}
              >
                <code
                  style={{
                    font: '11px "DM Mono", monospace',
                    color: '#ded3c5',
                    wordBreak: 'break-all',
                    flex: 1,
                  }}
                >
                  {session.ownerId}
                </code>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="ghost"
                  style={{
                    padding: '4px 8px',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {copied ? <Check size={12} style={{ color: '#8ec982' }} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: '#8ec982',
                marginTop: 10,
              }}
            >
              <ShieldCheck size={14} />
              <span>All case progress and notes automatically link to this session.</span>
            </div>
          </div>
        ) : (
          <div style={{ color: '#d97a73', fontSize: 12, padding: 12 }}>
            Unable to retrieve session credentials.
          </div>
        )}

        <div style={{ marginTop: 14, textAlign: 'right' }}>
          <button type="button" className="generate" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
}


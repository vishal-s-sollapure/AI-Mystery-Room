import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  Clock3,
  FileText,
  Fingerprint,
  FolderOpen,
  HelpCircle,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  Save,
  Search,
  ShieldAlert,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Clue, PublicCase, Suspect } from '../types/case';
import { AccuseModal } from '../components/AccuseModal';
import { HowToPlayModal } from '../components/HowToPlayModal';
import { MyCasesModal } from '../components/MyCasesModal';

function getClueIcon(type: string) {
  switch (type) {
    case 'chat':
      return <MessageCircle size={18} />;
    case 'video':
      return <Video size={18} />;
    case 'statement':
      return <UserRound size={18} />;
    case 'access_log':
    case 'document':
    case 'lab_note':
    default:
      return <FileText size={18} />;
  }
}

export function InvestigationPage({
  initialCase,
  onCaseResolved,
  onBackToHome,
}: {
  initialCase: PublicCase;
  onCaseResolved: (caseId: string) => void;
  onBackToHome: () => void;
}) {
  const [caseData, setCaseData] = useState<PublicCase>(initialCase);
  const [selectedClueId, setSelectedClueId] = useState<string>(
    initialCase.clues[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'discovered' | 'sealed'>('all');
  const [activeTab, setActiveTab] = useState<'evidence' | 'suspects' | 'timeline'>('evidence');

  // Modals
  const [showAccuseModal, setShowAccuseModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showMyCases, setShowMyCases] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);

  // Notes state
  const [notes, setNotes] = useState(initialCase.progress.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('Saved to Dossier');
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clue discovery & hint loading states
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [isSubmittingAccusation, setIsSubmittingAccusation] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Selected clue
  const currentClue = useMemo(() => {
    return (
      caseData.clues.find((c) => c.id === selectedClueId) || caseData.clues[0]
    );
  }, [caseData.clues, selectedClueId]);

  // Filtered clues list
  const filteredClues = useMemo(() => {
    return caseData.clues.filter((clue) => {
      const matchesSearch =
        `${clue.title} ${clue.teaser} ${clue.content || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesType =
        typeFilter === 'all' ? true : clue.type.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'discovered'
            ? clue.isDiscovered
            : !clue.isDiscovered;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [caseData.clues, searchQuery, typeFilter, statusFilter]);

  // Auto-save notes debounce
  const handleNotesChange = (val: string) => {
    if (val.length > 10000) return;
    setNotes(val);
    setIsSavingNotes(true);
    setSaveStatus('Saving changes...');
    if (notesSaveTimeoutRef.current) {
      clearTimeout(notesSaveTimeoutRef.current);
    }
    notesSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.saveNotes(caseData.id, val);
        setIsSavingNotes(false);
        setSaveStatus('Saved to Dossier');
      } catch (err) {
        setIsSavingNotes(false);
        setSaveStatus('Save Failed');
        showToast('Failed to save notes.');
      }
    }, 1200);
  };

  const handleManualSaveNotes = async () => {
    setIsSavingNotes(true);
    setSaveStatus('Saving changes...');
    try {
      await api.saveNotes(caseData.id, notes);
      setIsSavingNotes(false);
      setSaveStatus('Saved to Dossier');
      showToast('Investigator notes saved.');
    } catch (err) {
      setIsSavingNotes(false);
      setSaveStatus('Save Failed');
      showToast('Failed to save notes.');
    }
  };

  // Discover clue handler
  const handleDiscoverClue = async (clueId: string) => {
    if (isDiscovering) return;
    setIsDiscovering(true);
    try {
      const response = await api.discoverClue(caseData.id, clueId);
      setCaseData(response.caseState);
      showToast('Forensic clue analyzed! (+5 points)');
    } catch (err: any) {
      showToast(err.message || 'Could not discover clue.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Request hint handler with idempotency
  const handleRequestHint = async () => {
    if (isRequestingHint) return;
    setIsRequestingHint(true);
    const idempotencyKey = `hint-${caseData.id}-${caseData.progress.hintsUsed + 1}`;
    try {
      const response = await api.requestHint(caseData.id, idempotencyKey);
      setCaseData(response.caseState);
      showToast(`Hint unlocked: ${response.hint.type.toUpperCase()} (-10 points)`);
    } catch (err: any) {
      showToast(err.message || 'Hints unavailable.');
    } finally {
      setIsRequestingHint(false);
    }
  };

  // Submit accusation handler with idempotency
  const handleSubmitAccusation = async (suspectId: string) => {
    setIsSubmittingAccusation(true);
    const idempotencyKey = `accuse-${caseData.id}-${suspectId}`;
    try {
      await api.submitAccusation(caseData.id, suspectId, idempotencyKey);
      setShowAccuseModal(false);
      onCaseResolved(caseData.id);
    } catch (err: any) {
      setIsSubmittingAccusation(false);
      showToast(err.message || 'Accusation failed. Please try again.');
    }
  };

  const hintsRemaining = Math.max(
    0,
    caseData.progress.maxHints - caseData.progress.hintsUsed
  );

  // Connected elements for the selected suspect profile
  const connectedClues = useMemo(() => {
    if (!selectedSuspect) return [];
    return caseData.clues.filter((c) => c.relatedSuspectIds.includes(selectedSuspect.id));
  }, [caseData.clues, selectedSuspect]);

  const connectedTimelineEvents = useMemo(() => {
    if (!selectedSuspect) return [];
    return caseData.timeline.filter((e) => e.relatedSuspectIds.includes(selectedSuspect.id));
  }, [caseData.timeline, selectedSuspect]);

  // Jump from suspect profile directly to an evidence card
  const handleSelectConnectedClue = (clueId: string) => {
    setSelectedSuspect(null);
    setSelectedClueId(clueId);
    setActiveTab('evidence');
  };

  return (
    <main className="app">
      {/* Top Header */}
      <header>
        <div
          className="brand"
          style={{ cursor: 'pointer' }}
          onClick={onBackToHome}
          title="Return to Main Menu"
        >
          <Fingerprint /> AI MYSTERY ROOM
        </div>
        <div className="case-name">
          <span>CASE DOSSIER #{caseData.id.slice(-4).toUpperCase()}</span>
          <strong>{caseData.title}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifySelf: 'end' }}>
          <button
            type="button"
            className="ghost"
            style={{ fontSize: 11, padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => setShowHowToPlay(true)}
          >
            <HelpCircle size={13} /> Rules
          </button>
          <button
            type="button"
            className="ghost"
            style={{ fontSize: 11, padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => setShowMyCases(true)}
          >
            <FolderOpen size={13} /> Dossiers
          </button>
          <div className="case-status">
            <span className="dot" /> ACTIVE INVESTIGATION
          </div>
        </div>
      </header>

      {/* Mobile Title & Switcher */}
      <div className="mobile-title">
        <span>CASE DOSSIER #{caseData.id.slice(-4).toUpperCase()}</span>
        <h2>{caseData.title}</h2>
      </div>

      <nav className="view-tabs">
        <button
          className={`tab-btn ${activeTab === 'suspects' ? 'active' : ''}`}
          onClick={() => setActiveTab('suspects')}
        >
          Suspects ({caseData.suspects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          Evidence ({caseData.progress.discoveredCount}/{caseData.progress.totalClues})
        </button>
        <button
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline & Notes
        </button>
      </nav>

      {/* Main 3-Column Detective Desk */}
      <div className="board">
        {/* Left Sidebar: Suspect Directory & Progress */}
        <aside
          className="sidebar"
          style={{ display: activeTab === 'suspects' || window.innerWidth > 850 ? 'block' : 'none' }}
        >
          <p className="section-label">SUSPECT DIRECTORY</p>
          {caseData.suspects.map((s) => {
            const initials = s.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2);
            return (
              <button
                key={s.id}
                type="button"
                className="suspect"
                onClick={() => setSelectedSuspect(s)}
                title="Inspect Suspect Profile"
              >
                <div className={`portrait ${s.tone || 'amber'}`}>{initials}</div>
                <span>
                  <b>{s.name}</b>
                  <small>{s.role}</small>
                </span>
                <span style={{ fontSize: 10, color: '#c39453' }}>Profile</span>
              </button>
            );
          })}

          <div className="progress">
            <div>
              <span>CLUES DISCOVERED</span>
              <b>
                {caseData.progress.discoveredCount}/{caseData.progress.totalClues}
              </b>
            </div>
            <i>
              <em
                style={{
                  width: `${(caseData.progress.discoveredCount / caseData.progress.totalClues) * 100
                    }%`,
                }}
              />
            </i>
            <small>
              Score: <span className="score-chip">{caseData.progress.provisionalScore} PTS</span> (Provisional)
            </small>
          </div>

          {/* Hint Section */}
          <div className="hint-tray">
            <div className="hint-header">
              <span>TACTICAL HINTS ({hintsRemaining} REMAINING)</span>
            </div>
            <button
              type="button"
              className="hint-trigger"
              onClick={handleRequestHint}
              disabled={hintsRemaining === 0 || isRequestingHint}
            >
              <Lightbulb size={13} />
              {isRequestingHint
                ? 'Deciphering...'
                : hintsRemaining > 0
                  ? 'Request Hint (-10 pts)'
                  : 'Hints Exhausted'}
            </button>

            {caseData.revealedHints && caseData.revealedHints.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {caseData.revealedHints.map((h) => (
                  <div key={h.id} className="hint-item">
                    <span className="hint-tag">#{h.order} {h.type}:</span>
                    {h.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center Panel: Evidence Archive & Clue Viewer */}
        <section
          className="evidence"
          style={{ display: activeTab === 'evidence' || window.innerWidth > 850 ? 'block' : 'none' }}
        >
          <div className="panel-title">
            <div>
              <p className="section-label">EVIDENCE ARCHIVE</p>
              <h2>Collected Forensics</h2>
            </div>
            <label className="search">
              <Search size={15} />
              <input
                placeholder="Search clues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>

          {/* Type and Status filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '14px 0 16px' }}>
            <div className="filter-bar" style={{ margin: 0 }}>
              <span style={{ font: '10px "DM Mono", monospace', color: '#887d70', alignSelf: 'center', marginRight: 4 }}>
                STATUS:
              </span>
              {(['all', 'discovered', 'sealed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'ALL EVIDENCE' : s === 'discovered' ? 'ANALYZED' : 'SEALED'}
                </button>
              ))}
            </div>

            <div className="filter-bar" style={{ margin: 0 }}>
              <span style={{ font: '10px "DM Mono", monospace', color: '#887d70', alignSelf: 'center', marginRight: 4 }}>
                TYPE:
              </span>
              {['all', 'document', 'chat', 'statement', 'access_log', 'physical', 'video', 'lab_note'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`filter-btn ${typeFilter === t ? 'active' : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence List Grid */}
          <div className="evidence-list">
            {filteredClues.map((clue) => {
              const isSelected = clue.id === selectedClueId;
              return (
                <button
                  key={clue.id}
                  type="button"
                  className={`evidence-item ${isSelected ? 'selected' : ''} ${!clue.isDiscovered ? 'undiscovered-card' : ''
                    }`}
                  onClick={() => setSelectedClueId(clue.id)}
                >
                  <span className="evidence-icon">{getClueIcon(clue.type)}</span>
                  <span style={{ minWidth: 0 }}>
                    <b>{clue.title}</b>
                    <small>{clue.teaser}</small>
                  </span>
                  {clue.timestamp && <time>{clue.timestamp}</time>}
                  {clue.isDiscovered ? (
                    <span title="Analyzed Clue" style={{ display: 'inline-flex' }}>
                      <Check size={16} style={{ color: '#8ec982' }} />
                    </span>
                  ) : (
                    <span style={{ font: '9px "DM Mono", monospace', color: '#c39453', border: '1px dashed #7a5a3a', padding: '1px 4px' }}>
                      SEALED
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detailed Clue Viewer */}
          {currentClue && (
            <article className="viewer">
              <div className="viewer-head">
                <span className="badge">{currentClue.type.replace('_', ' ')}</span>
                {currentClue.timestamp && (
                  <time>
                    <Clock3 size={13} /> {currentClue.timestamp}
                  </time>
                )}
              </div>

              <h1>{currentClue.title}</h1>

              {currentClue.isDiscovered ? (
                <>
                  <div className="ai-disclaimer">
                    <Fingerprint size={12} /> FICTIONAL AI-GENERATED EVIDENCE
                  </div>

                  {/* Thematic rendering based on clue type */}
                  {currentClue.type === 'chat' && (
                    <div className="evidence-themed-box">
                      <div style={{ font: '10px "DM Mono", monospace', color: '#c39453', marginBottom: 8 }}>
                        ENCRYPTED MESSAGING TRANSCRIPT // RECOVERED LOGS
                      </div>
                      <div className="evidence-chat-bubble">{currentClue.content}</div>
                    </div>
                  )}

                  {currentClue.type === 'access_log' && (
                    <div className="evidence-terminal">
                      {`[ACCESS CONTROL UNIT v3.2 - ENTRY/EXIT ARCHIVE]\nTIMESTAMP: ${currentClue.timestamp || '21:00'
                        }\n` + currentClue.content}
                    </div>
                  )}

                  {currentClue.type === 'video' && (
                    <div className="evidence-cctv-frame">
                      <div className="cctv-header">
                        <span>CCTV CAM-03 SURVEILLANCE STILL // REEL #084</span>
                        <span>REC: {currentClue.timestamp || '21:30'}</span>
                      </div>
                      <div className="cctv-still-view">
                        <Camera size={28} style={{ color: '#7a899c', marginBottom: 8 }} />
                        <div style={{ font: '10px "DM Mono", monospace', color: '#97a6b8', letterSpacing: 1 }}>
                          [STATIC SURVEILLANCE CAPTURE]
                        </div>
                      </div>
                      <p className="evidence-detail" style={{ margin: '8px 0 0' }}>
                        {currentClue.content}
                      </p>
                    </div>
                  )}

                  {currentClue.type !== 'chat' &&
                    currentClue.type !== 'access_log' &&
                    currentClue.type !== 'video' && (
                      <p className="evidence-detail">{currentClue.content}</p>
                    )}

                  <div className="clue">
                    <ShieldAlert size={18} />
                    <span>
                      <b>Investigator Log:</b> Cross-reference this evidence against suspect statements and timeline logs.
                    </span>
                  </div>

                  {currentClue.relatedSuspectIds.length > 0 && (
                    <div style={{ marginTop: 14, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ font: '10px "DM Mono", monospace', color: '#8f8373' }}>
                        RELATED PERSONS OF INTEREST:
                      </span>
                      {currentClue.relatedSuspectIds.map((sid) => {
                        const s = caseData.suspects.find((item) => item.id === sid);
                        return (
                          <button
                            key={sid}
                            type="button"
                            className="badge-pill"
                            style={{ cursor: 'pointer', background: '#241f1b' }}
                            onClick={() => s && setSelectedSuspect(s)}
                          >
                            {s ? s.name : sid}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="teaser-box">
                  <p>
                    <b>Sealed Forensic Item:</b> {currentClue.teaser}
                  </p>
                  <button
                    type="button"
                    className="discover-btn"
                    onClick={() => handleDiscoverClue(currentClue.id)}
                    disabled={isDiscovering}
                  >
                    <LockKeyhole size={14} />
                    {isDiscovering ? 'Analyzing Forensics...' : 'Inspect Evidence (+5 pts)'}
                  </button>
                </div>
              )}
            </article>
          )}
        </section>

        {/* Right Sidebar: Timeline & Notes */}
        <aside
          className="rightbar"
          style={{ display: activeTab === 'timeline' || window.innerWidth > 850 ? 'block' : 'none' }}
        >
          <p className="section-label">CASE TIMELINE</p>
          <div className="timeline">
            {caseData.timeline.map((evt) => (
              <p key={evt.id} className="event">
                <time>{evt.timestamp}</time>
                {evt.description}
              </p>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="section-label notes-label">INVESTIGATOR NOTES</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ font: '10px "DM Mono", monospace', color: '#7a7063' }}>
                {saveStatus} ({notes.length}/10000)
              </span>
              <button
                type="button"
                className="save-note-btn"
                onClick={handleManualSaveNotes}
                disabled={isSavingNotes}
                title="Save notes now"
              >
                <Save size={11} style={{ display: 'inline', marginRight: 3 }} />
                Save
              </button>
            </div>
          </div>
          <textarea
            className="notes"
            placeholder="Record contradictions, alibi flaws, or deduction theories..."
            value={notes}
            maxLength={10000}
            onChange={(e) => handleNotesChange(e.target.value)}
          />

          <button
            type="button"
            className="accuse"
            onClick={() => setShowAccuseModal(true)}
          >
            Make an Accusation <ArrowRight size={16} />
          </button>
        </aside>
      </div>

      {/* Suspect Profile Modal with Connected Clues & Timeline Events */}
      {selectedSuspect && (
        <div className="modal-backdrop" onClick={() => setSelectedSuspect(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88vh', overflowY: 'auto' }}>
            <button className="close" onClick={() => setSelectedSuspect(null)} aria-label="Close modal">
              <X size={18} />
            </button>
            <p className="eyebrow">PERSON OF INTEREST</p>
            <h2>{selectedSuspect.name}</h2>
            <div style={{ font: '11px "DM Mono", monospace', color: '#c39453', marginBottom: 12 }}>
              ROLE: {selectedSuspect.role.toUpperCase()}
            </div>
            <p style={{ color: '#d5ccbe', lineHeight: 1.6 }}>{selectedSuspect.profile}</p>

            <div style={{ background: '#171513', border: '1px solid #3c342d', padding: 12, margin: '12px 0', borderRadius: 2 }}>
              <b style={{ color: '#e8ba74', display: 'block', fontSize: 12, marginBottom: 3 }}>
                MOTIVE CONTEXT:
              </b>
              <span style={{ fontSize: 12, color: '#b8ad9e' }}>{selectedSuspect.motiveContext}</span>
            </div>

            <div style={{ background: '#171513', border: '1px solid #3c342d', padding: 12, margin: '12px 0', borderRadius: 2 }}>
              <b style={{ color: '#e8ba74', display: 'block', fontSize: 12, marginBottom: 3 }}>
                STATED ALIBI & STATEMENTS:
              </b>
              <span style={{ fontSize: 12, color: '#b8ad9e' }}>{selectedSuspect.alibi}</span>
            </div>

            {/* Connected Evidence per Prompt §6 */}
            <div style={{ marginTop: 14 }}>
              <b style={{ color: '#c39453', display: 'block', font: '500 11px "DM Mono", monospace', marginBottom: 6 }}>
                CONNECTED EVIDENCE FILES ({connectedClues.length}):
              </b>
              {connectedClues.length === 0 ? (
                <div style={{ fontSize: 12, color: '#746c60', fontStyle: 'italic' }}>
                  No forensic items currently link directly to this suspect.
                </div>
              ) : (
                connectedClues.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="connected-clue-card"
                    onClick={() => handleSelectConnectedClue(c.id)}
                  >
                    <span>
                      <b>{c.title}</b> ({c.type.replace('_', ' ')})
                    </span>
                    <span style={{ color: c.isDiscovered ? '#8ec982' : '#c39453' }}>
                      {c.isDiscovered ? 'ANALYZED' : 'SEALED'} →
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Related Timeline Events per Prompt §6 */}
            {connectedTimelineEvents.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <b style={{ color: '#c39453', display: 'block', font: '500 11px "DM Mono", monospace', marginBottom: 6 }}>
                  RELATED TIMELINE ENTRIES:
                </b>
                {connectedTimelineEvents.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      background: '#151311',
                      borderLeft: '2px solid #a8724d',
                      padding: '6px 10px',
                      margin: '5px 0',
                      fontSize: 11,
                      color: '#c4bcb0',
                    }}
                  >
                    <span style={{ color: '#c39453', fontFamily: '"DM Mono", monospace', marginRight: 6 }}>
                      {evt.timestamp}:
                    </span>
                    {evt.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accusation Modal with 2-step confirmation */}
      {showAccuseModal && (
        <AccuseModal
          suspects={caseData.suspects}
          caseTitle={caseData.title}
          onClose={() => setShowAccuseModal(false)}
          onSubmit={handleSubmitAccusation}
          isSubmitting={isSubmittingAccusation}
        />
      )}

      {/* How To Play Modal */}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {/* My Cases Modal */}
      {showMyCases && (
        <MyCasesModal
          onClose={() => setShowMyCases(false)}
          onSelectCase={(id, status) => {
            setShowMyCases(false);
            if (status === 'completed') {
              onCaseResolved(id);
            } else {
              api.getCase(id).then((fresh) => {
                setCaseData(fresh);
                setSelectedClueId(fresh.clues[0]?.id || '');
              });
            }
          }}
        />
      )}

      {/* Toast popup */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import { PublicCase } from './types/case';
import { HomePage } from './pages/HomePage';
import { InvestigationPage } from './pages/InvestigationPage';
import { ResultPage } from './pages/ResultPage';
import { HowToPlayModal } from './components/HowToPlayModal';
import { MyCasesModal } from './components/MyCasesModal';
import './styles.css';

export function App() {
  const [view, setView] = useState<'home' | 'case' | 'result'>('home');
  const [currentCase, setCurrentCase] = useState<PublicCase | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string>('');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showMyCases, setShowMyCases] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Sync with browser hash routing for direct links & refresh support
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#case/')) {
        const id = hash.replace('#case/', '');
        if (id) {
          setInitialLoading(true);
          try {
            const data = await api.getCase(id);
            setCurrentCase(data);
            setActiveCaseId(id);
            setView('case');
          } catch (err) {
            console.error('Failed to restore case from URL hash:', err);
            setView('home');
          } finally {
            setInitialLoading(false);
          }
        }
      } else if (hash.startsWith('#result/')) {
        const id = hash.replace('#result/', '');
        if (id) {
          setActiveCaseId(id);
          setView('result');
        }
      } else {
        setView('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCaseCreated = (caseData: PublicCase) => {
    setCurrentCase(caseData);
    setActiveCaseId(caseData.id);
    window.location.hash = `#case/${caseData.id}`;
    setView('case');
  };

  const handleCaseResolved = (caseId: string) => {
    setActiveCaseId(caseId);
    window.location.hash = `#result/${caseId}`;
    setView('result');
  };

  const handlePlayAgain = () => {
    setCurrentCase(null);
    setActiveCaseId('');
    window.location.hash = '';
    setView('home');
  };

  const handleSelectCaseFromModal = async (id: string, status: string) => {
    setShowMyCases(false);
    if (status === 'completed') {
      handleCaseResolved(id);
    } else {
      setInitialLoading(true);
      try {
        const fresh = await api.getCase(id);
        setCurrentCase(fresh);
        setActiveCaseId(id);
        window.location.hash = `#case/${id}`;
        setView('case');
      } catch (err) {
        console.error('Failed to open case:', err);
      } finally {
        setInitialLoading(false);
      }
    }
  };

  if (initialLoading) {
    return (
      <main className="result">
        <div style={{ textAlign: 'center', color: '#c39453' }}>
          <div className="spinner" />
          <p style={{ font: '12px "DM Mono", monospace' }}>FETCHING DOSSIER ARCHIVES...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {view === 'home' && (
        <HomePage
          onCaseCreated={handleCaseCreated}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenMyCases={() => setShowMyCases(true)}
        />
      )}

      {view === 'case' && currentCase && (
        <InvestigationPage
          initialCase={currentCase}
          onCaseResolved={handleCaseResolved}
          onBackToHome={handlePlayAgain}
        />
      )}

      {view === 'result' && activeCaseId && (
        <ResultPage
          caseId={activeCaseId}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {showMyCases && (
        <MyCasesModal
          onClose={() => setShowMyCases(false)}
          onSelectCase={handleSelectCaseFromModal}
        />
      )}
    </>
  );
}

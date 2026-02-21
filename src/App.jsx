import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { TimerProvider, useTimerContext } from './contexts/TimerContext';
import Header from './components/Header';
import MiniPlayer from './components/MiniPlayer';
import SoundPicker from './components/SoundPicker';
import Home from './pages/Home';
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function AppContent() {
  const {
    showSoundPicker,
    onToggleSoundPicker,
    selectedSound,
    onSelectSound,
    customTrack,
    onImportTrack,
    onToggleLoop,
  } = useTimerContext();

  useEffect(() => {
    document.body.style.overflow = showSoundPicker ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSoundPicker]);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clip" element={<Home />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
      <MiniPlayer />
      <SoundPicker
        isOpen={showSoundPicker}
        onClose={onToggleSoundPicker}
        selectedSound={selectedSound}
        onSelectSound={onSelectSound}
        customTrack={customTrack}
        onImportTrack={onImportTrack}
        onToggleLoop={onToggleLoop}
      />
    </>
  );
}

function App() {
  return (
    <TimerProvider>
      <AppContent />
    </TimerProvider>
  );
}

export default App;

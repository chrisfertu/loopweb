import { useEffect, useLayoutEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { TimerProvider, useTimerContext } from './contexts/TimerContext';
import Header from './components/Header';
import MiniPlayer from './components/MiniPlayer';
import SoundPicker from './components/SoundPicker';
import BellPicker from './components/BellPicker';
import Home from './pages/Home';
import Player from './pages/Player';
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const {
    showSoundPicker,
    onToggleSoundPicker,
    selectedSound,
    onSelectSound,
    customTrack,
    onImportTrack,
    onToggleLoop,
    showBellPicker,
    onToggleBellPicker,
    bellEnabled,
    onSetBellEnabled,
    bellInterval,
    onSetBellInterval,
  } = useTimerContext();

  const location = useLocation();
  const isPlayerPage = location.pathname === '/player';

  useEffect(() => {
    document.body.style.overflow = (showSoundPicker || showBellPicker) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSoundPicker, showBellPicker]);

  return (
    <>
      <ScrollToTop />
      {!isPlayerPage && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clip" element={<Home />} />
        <Route path="/player" element={<Player />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
      {!isPlayerPage && <MiniPlayer />}
      <SoundPicker
        isOpen={showSoundPicker}
        onClose={onToggleSoundPicker}
        selectedSound={selectedSound}
        onSelectSound={onSelectSound}
        customTrack={customTrack}
        onImportTrack={onImportTrack}
        onToggleLoop={onToggleLoop}
      />
      <BellPicker
        isOpen={showBellPicker}
        onClose={onToggleBellPicker}
        bellEnabled={bellEnabled}
        onSetBellEnabled={onSetBellEnabled}
        bellInterval={bellInterval}
        onSetBellInterval={onSetBellInterval}
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

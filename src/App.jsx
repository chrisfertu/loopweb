import { Component, Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { TimerProvider, useTimerState } from './contexts/TimerContext';
import { isHomePath, normalizePath } from './hooks/usePath';
import { HOME_TITLE, PLAYER_TITLE } from './content/seo';
import Header from './components/Header';
import Footer from './components/Footer';
import MiniPlayer from './components/MiniPlayer';
import PageLayout from './components/PageLayout';
import Home from './pages/Home';

// Home is in the entry chunk; every other route and both sheets load on
// demand, so the landing page never downloads them.
const Player = lazy(() => import('./pages/Player'));
const Support = lazy(() => import('./pages/Support'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SoundPicker = lazy(() => import('./components/SoundPicker'));
const BellPicker = lazy(() => import('./components/BellPicker'));

// A route whose chunk failed to load (a deploy replaced it, the network
// dropped) offers a reload instead of a blank page. Leaving the route
// clears it.
class ChunkBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.failed && prevProps.path !== this.props.path) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <PageLayout title="This page did not load.">
          <p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          </p>
        </PageLayout>
      );
    }
    return this.props.children;
  }
}

// Jump (never animate) to the top on a route change, so leaving Home from deep
// down does not scroll back through every scene. A URL hash wins. After a
// client-side navigation, focus moves to the new page's h1 (or <main>), so a
// screen reader announces the page instead of losing focus to <body>.
function ScrollToTop({ path, hash }) {
  const first = useRef(true);
  useLayoutEffect(() => {
    const initial = first.current;
    first.current = false;
    if (hash) {
      let target = null;
      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        target = null;
      }
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (initial) return;
    const focusTarget = document.querySelector('main h1') || document.querySelector('main');
    if (focusTarget) {
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    }
    // Only a new path scrolls; a hash change on the same path is the browser's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
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
    onClosePickers,
  } = useTimerState();

  const location = useLocation();
  const path = normalizePath(location.pathname);
  const isPlayerPage = path === '/player';
  const pickerOpen = showSoundPicker || showBellPicker;

  // The sheets load on their first open and then stay mounted, so their exit
  // animations play.
  const [pickersLoaded, setPickersLoaded] = useState(false);
  if (pickerOpen && !pickersLoaded) setPickersLoaded(true);

  // A sheet never survives navigation (Header and MiniPlayer stay clickable
  // above the backdrop).
  useEffect(() => {
    onClosePickers();
  }, [path, onClosePickers]);

  // Tab title for the routes without PageLayout (which sets its own). Each
  // route's HTML starts with that route's title (vite-plugin-seo.js), so a
  // client-side navigation must set these back. Runs after PageLayout's
  // cleanup, which restores whatever title the page had before it.
  useEffect(() => {
    const title = isHomePath(path) ? HOME_TITLE : path === '/player' ? PLAYER_TITLE : null;
    if (title) document.title = title;
  }, [path]);

  // Scroll lock while a sheet is open. The page scrolls on the root element,
  // so the lock goes there; the previous value is restored, not blanked.
  useEffect(() => {
    if (!pickerOpen) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [pickerOpen]);

  return (
    <>
      <ScrollToTop path={path} hash={location.hash} />
      {!isPlayerPage && <Header />}
      <main>
        <ChunkBoundary path={path}>
          <Suspense fallback={<div className="min-h-[100svh]" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/clip/*" element={<Home />} />
              <Route path="/player" element={<Player />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ChunkBoundary>
      </main>
      {!isPlayerPage && <Footer narrow={!isHomePath(path)} />}
      {!isPlayerPage && <MiniPlayer />}
      {pickersLoaded ? (
        <Suspense fallback={null}>
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
        </Suspense>
      ) : null}
    </>
  );
}

// LazyMotion without `strict`: landing components use the light `m` with
// domAnimation (animate, exit, variants); the lazy Player, Support and the
// sheets keep the full `motion` (the sheets need drag).
function App() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <TimerProvider>
          <AppContent />
        </TimerProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

export default App;

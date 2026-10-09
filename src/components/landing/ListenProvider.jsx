// ListenProvider: the landing page's own sound (spec 5.1). Wrap the landing
// page in it once; the sound and bells sections read it through useListen().
//
// Props
// - children
//
// Behaviour
// - Two kinds of sound, one at a time between them: a Listen sound (the
//   binaural beats and the noises, from the audio engine) and a bell (one of
//   the app's recordings). Starting either stops the other.
// - Listen: its own useAudioEngine() instance, separate from the player's
//   (TimerContext), so it never touches a /player session. Starting another
//   sound replaces the first. Fade in 1.5s.
// - Bells: ring(key, { file, label, owner }) plays a recording from its
//   start on one shared <audio> element, made on the first ring. Ringing
//   the same bell again restarts it. A media element, not the engine:
//   play() is called inside the tap, and on iPhone it sounds with the
//   silent switch on. Its volume cannot be set there, so a bell stops with
//   pause(), not with a fade.
// - Stops (Listen fading out) after 60s, when the tab is hidden (quickly),
//   when "Pause motion" is turned on, when a /player session is active and
//   on a route change. On unmount the engine closes its context and the
//   <audio> element lets go of its file. The sections add
//   "when the section leaves the viewport".
// - While a /player session is running or paused nothing starts.
// - Never autoplays; only a tap starts a sound.
// - Announces "Playing 6Hz - Meditation." / "Stopped." in a polite live
//   region. The bells section announces its own bells.
// - Once silent, the audio context is suspended so it costs nothing.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useTimerState } from '../../contexts/TimerContext';
import { subscribeMotion } from '../../lib/motion';
import { ListenContext, soundKey } from './listen';

const FADE_IN_SECONDS = 1.5;
const HIDDEN_FADE_SECONDS = 0.3;
const LIMIT_MS = 60 * 1000;

// "Binaural beats need headphones." shows until the first Listen of the visit.
let hintSeenThisVisit = false;

export default function ListenProvider({ children }) {
  const { play: playEngine, stop: stopEngine, pause: suspendEngine } = useAudioEngine();
  const { timerState } = useTimerState();
  const sessionActive = timerState === 'running' || timerState === 'paused';
  const { pathname } = useLocation();

  const [current, setCurrent] = useState(null); // { key, owner, label }
  const [ringing, setRinging] = useState(null); // { key, owner, label }
  const [message, setMessage] = useState('');
  const [hintSeen, setHintSeen] = useState(hintSeenThisVisit);

  const currentRef = useRef(null);
  const tokenRef = useRef(0);
  const limitRef = useRef(0);
  const sessionRef = useRef(sessionActive);
  const bellRef = useRef(null); // the shared <audio> element
  const rungRef = useRef(null); // { key, owner, label }: the bell it holds

  useEffect(() => {
    sessionRef.current = sessionActive;
  }, [sessionActive]);

  // The element, made on the first ring. `ringing` follows its events, so a
  // bell that rings out, or that the system or a media key pauses or
  // resumes, is known too. An event arrives after the code that caused it:
  // what counts is what the element does by then.
  const bellElement = useCallback(() => {
    if (bellRef.current) return bellRef.current;
    const el = new Audio();
    const follow = () => setRinging(el.paused || el.error ? null : rungRef.current);
    ['play', 'pause', 'ended', 'error'].forEach((type) => el.addEventListener(type, follow));
    bellRef.current = el;
    return el;
  }, []);

  // Stop the bell at once. True if one was ringing.
  const hush = useCallback(() => {
    const el = bellRef.current;
    if (!el || el.paused) return false;
    el.pause();
    setRinging(null);
    return true;
  }, []);

  // Fade the engine out; once it is silent, suspend its context. A start()
  // during the fade wins: the engine then leaves the new sound alone.
  const silence = useCallback(
    (fast) => {
      Promise.resolve(stopEngine())
        .catch(() => {})
        .then(() => {
          if (!currentRef.current) suspendEngine();
        });
      if (fast) {
        // A hidden tab: cut the tail short instead of fading for 3s.
        window.setTimeout(() => {
          if (!currentRef.current) suspendEngine();
        }, HIDDEN_FADE_SECONDS * 1000);
      }
    },
    [stopEngine, suspendEngine],
  );

  // stop() stops whatever plays, a Listen sound or a bell. stop({ key }) or
  // stop({ owner }) only stops that sound or the sound that button started.
  // { fast: true } for a tab that was hidden.
  const stop = useCallback(
    (opts = {}) => {
      const meant = (it) =>
        !!it && (!opts.key || opts.key === it.key) && (!opts.owner || opts.owner === it.owner);
      if (meant(rungRef.current) && hush()) setMessage('Stopped.');
      if (!meant(currentRef.current)) return;
      currentRef.current = null;
      tokenRef.current += 1;
      window.clearTimeout(limitRef.current);
      setCurrent(null);
      setMessage('Stopped.');
      silence(!!opts.fast);
    },
    [silence, hush],
  );

  // Call it inside the tap's click handler: nothing is awaited before play().
  // `file` is the recording's URL, `label` the bell's name. A play() that is
  // refused, or a file that does not load, leaves the bell silent and says
  // nothing.
  const ring = useCallback(
    (key, { file, label, owner } = {}) => {
      if (!key || !file || sessionRef.current) return;
      hush();
      stop();
      const el = bellElement();
      const rung = { key, owner: owner ?? null, label: label || key };
      rungRef.current = rung;
      if (el.getAttribute('src') !== file || el.error) el.src = file;
      else el.currentTime = 0;
      setRinging(rung);
      const playing = el.play();
      if (playing && playing.catch) {
        playing.catch(() => {
          if (rungRef.current === rung) setRinging(null);
        });
      }
    },
    [stop, hush, bellElement],
  );

  const start = useCallback(
    (sound, { label, owner } = {}) => {
      if (!sound || sessionRef.current) return;
      hush();
      const key = soundKey(sound);
      const token = ++tokenRef.current;
      const next = { key, owner: owner ?? null, label: label || key };
      currentRef.current = next;
      setCurrent(next);
      setMessage(`Playing ${next.label}.`);
      if (!hintSeenThisVisit) {
        hintSeenThisVisit = true;
        setHintSeen(true);
      }
      window.clearTimeout(limitRef.current);
      limitRef.current = window.setTimeout(() => stop(), LIMIT_MS);

      Promise.resolve(playEngine(sound, { fadeInSeconds: FADE_IN_SECONDS })).catch(() => {
        if (tokenRef.current === token) stop();
      });
    },
    [playEngine, stop, hush],
  );

  const toggle = useCallback(
    (sound, opts) => {
      const cur = currentRef.current;
      if (cur && cur.key === soundKey(sound)) stop();
      else start(sound, opts);
    },
    [start, stop],
  );

  // Tab hidden: fade quickly.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop({ fast: true });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stop]);

  // "Pause motion" also stops the sound.
  useEffect(() => {
    const unsubscribe = subscribeMotion((paused) => {
      if (paused) stop();
    });
    return () => {
      unsubscribe();
    };
  }, [stop]);

  // A /player session owns the audio.
  useEffect(() => {
    if (sessionActive) stop();
  }, [sessionActive, stop]);

  // Route change and unmount.
  useEffect(() => () => stop(), [pathname, stop]);

  // Unmount: the element lets go of its file.
  useEffect(
    () => () => {
      const el = bellRef.current;
      if (!el) return;
      bellRef.current = null;
      el.pause();
      el.removeAttribute('src');
      el.load();
    },
    [],
  );

  const playingKey = current ? current.key : null;
  const ringingKey = ringing ? ringing.key : null;
  const owner = current ? current.owner : null;
  const isPlaying = useCallback(
    (keyOrSound) => {
      const key = soundKey(keyOrSound);
      return key != null && key === playingKey;
    },
    [playingKey],
  );

  const value = useMemo(
    () => ({
      available: true,
      playingKey,
      owner,
      isPlaying,
      start,
      stop,
      toggle,
      ring,
      ringingKey,
      hintSeen,
      sessionActive,
    }),
    [playingKey, owner, isPlaying, start, stop, toggle, ring, ringingKey, hintSeen, sessionActive],
  );

  return (
    <ListenContext.Provider value={value}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </ListenContext.Provider>
  );
}

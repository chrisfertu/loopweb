import { useRef, useCallback, useEffect, useMemo } from 'react';
import { DEFAULT_BELL } from '../content/media';

// Binaural carrier, as in the iOS app (an octave below 432 Hz). The left ear
// hears CARRIER - beat/2 and the right ear CARRIER + beat/2.
const BINAURAL_BASE_HZ = 216;
const BINAURAL_SINE_GAIN = 0.3; // iOS Gain.binauralSine
const DEFAULT_BEAT_HZ = 6;
const DEFAULT_FADE_IN_SECONDS = 5;
const FADE_OUT_SECONDS = 3;
const MUTE_TIME_CONSTANT = 0.04;
const BUFFER_SIZE = 4096;
const NOISE_TYPES = ['white', 'pink', 'brown', 'dark'];

// Warmth bed under the binaural tones (iOS BinauralBed): two independent pink
// noise streams, low-passed hard near 700 Hz and notched at the carrier, about
// 24 dB under the tones. Rendered once per context into a looping buffer, at
// a low sample rate (the bed has nothing above ~2 kHz) to keep it cheap.
const BED_LOWPASS_HZ = 700;
const BED_NOTCH_Q = 2;
const BED_DB_BELOW_TONES = 24;
const BED_SAMPLE_RATE = 22050;
const BED_SECONDS = 6;
const BED_CROSSFADE_SECONDS = 0.25;
const BED_PREROLL_SECONDS = 0.5;

// The interval bell: the app's default recording at its default volume (0.5).
const BELL_URL = DEFAULT_BELL;
const BELL_GAIN = 0.5;

/** One channel of the bed: pink (Paul Kellet) -> 2x one-pole low-pass -> RBJ notch. */
function renderBedChannel(length, sampleRate) {
  const out = new Float32Array(length);
  const a = 1 - Math.exp((-2 * Math.PI * BED_LOWPASS_HZ) / sampleRate);
  const w0 = (2 * Math.PI * BINAURAL_BASE_HZ) / sampleRate;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * BED_NOTCH_Q);
  const a0 = 1 + alpha;
  const nb0 = 1 / a0;
  const nb1 = (-2 * cosW0) / a0;
  const na1 = (-2 * cosW0) / a0;
  const na2 = (1 - alpha) / a0;

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lp1 = 0, lp2 = 0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const preroll = Math.round(BED_PREROLL_SECONDS * sampleRate);

  for (let i = -preroll; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;

    lp1 += a * (pink - lp1);
    lp2 += a * (lp1 - lp2);

    const y = nb0 * lp2 + nb1 * x1 + nb0 * x2 - na1 * y1 - na2 * y2;
    x2 = x1;
    x1 = lp2;
    y2 = y1;
    y1 = y;

    if (i >= 0) out[i] = y;
  }
  return out;
}

function createBedBuffer(ctx, length, sampleRate) {
  try {
    return ctx.createBuffer(2, length, sampleRate);
  } catch {
    return null;
  }
}

function buildWarmthBed(ctx) {
  let sampleRate = Math.min(BED_SAMPLE_RATE, ctx.sampleRate);
  let buffer = createBedBuffer(ctx, Math.round(BED_SECONDS * sampleRate), sampleRate);
  if (!buffer) {
    sampleRate = ctx.sampleRate;
    buffer = ctx.createBuffer(2, Math.round(BED_SECONDS * sampleRate), sampleRate);
  }
  const { length } = buffer;
  const fade = Math.round(BED_CROSSFADE_SECONDS * sampleRate);
  const targetRms = BINAURAL_SINE_GAIN * Math.pow(10, -BED_DB_BELOW_TONES / 20);

  for (let ch = 0; ch < 2; ch++) {
    const raw = renderBedChannel(length + fade, sampleRate);
    const out = buffer.getChannelData(ch);
    out.set(raw.subarray(0, length));
    // Seamless loop: the overrun past the end fades into the head, so the
    // sample after out[length - 1] (raw[length]) is where playback resumes.
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      out[i] = raw[i] * Math.sqrt(t) + raw[length + i] * Math.sqrt(1 - t);
    }
    let sum = 0;
    for (let i = 0; i < length; i++) sum += out[i] * out[i];
    const rms = Math.sqrt(sum / length) || 1;
    const k = targetRms / rms;
    for (let i = 0; i < length; i++) out[i] *= k;
  }
  return buffer;
}

// ── Noise (iOS SimpleAudioGenerator, current tuning) ─────────
// Plain functions with no Web Audio in them, so a Node script can render the
// same samples and measure them. Every colour starts from uniform white noise
// in [-1, 1], runs through its own filter chain, then its loudness gain. The
// live path adds the breathing LFO and the soft-knee limiter on top.
//
// The coefficients are the app's, which renders at 44.1 kHz. They are per
// sample, so levels are the same at any rate; at 48 kHz every corner sits
// about 9% higher, which does not change the character of the colours.

/** Perceptual (A-weighted) loudness match (iOS Gain.white/pink/brown/dark).
 * White, pink and dark match within about 0.5 dB; brown is a few dB quieter
 * on purpose, because its random walk has a high crest factor. */
export const NOISE_GAIN = { white: 0.187, pink: 0.17, brown: 0.44, dark: 1.02 };

/** Breathing LFO (iOS Breath): one cycle about every 14 s, +/-1.5 dB. */
export const BREATH_RATE_HZ = 0.07;
export const BREATH_DEPTH_DB = 1.5;
const SOFT_LIMIT_KNEE = 0.9;

/** One-pole low-pass: y += a * (x - y). */
function onePoleLowpass(a) {
  let y = 0;
  return (x) => {
    y += a * (x - y);
    return y;
  };
}

/** DC blocker, a gentle high-pass near 30 Hz: y = x - x[n-1] + r * y[n-1]. */
function dcBlocker(r = 0.9957) {
  let x1 = 0;
  let y1 = 0;
  return (x) => {
    const y = x - x1 + r * y1;
    x1 = x;
    y1 = y;
    return y;
  };
}

/** White: a ~9 kHz one-pole low-pass, then the DC blocker (iOS WhiteNoiseFilter). */
function whiteFilter() {
  const lp = onePoleLowpass(0.7226);
  const dc = dcBlocker();
  return (x) => dc(lp(x));
}

/** Pink: Paul Kellet's three-pole filter, then the DC blocker (iOS PinkNoiseFilter). */
function pinkFilter() {
  let b0 = 0, b1 = 0, b2 = 0;
  const dc = dcBlocker();
  return (x) => {
    b0 = 0.99886 * b0 + x * 0.0555179;
    b1 = 0.99332 * b1 + x * 0.0750759;
    b2 = 0.969 * b2 + x * 0.153852;
    return dc(b0 + b1 + b2 + x * 0.3104856);
  };
}

/** Brown: a leaky integrator, the DC blocker, then makeup gain (iOS BrownNoiseFilter). */
function brownFilter() {
  let last = 0;
  const dc = dcBlocker();
  return (x) => {
    last = (last + x * 0.02) * 0.998;
    return dc(last) * 3.5;
  };
}

/** Dark: two one-poles with corners near 210 and 245 Hz, the DC blocker, then
 * makeup gain (iOS DarkNoiseFilter). */
function darkFilter() {
  let b0 = 0, b1 = 0;
  const dc = dcBlocker();
  return (x) => {
    b0 = 0.97 * b0 + x * 0.01;
    b1 = 0.965 * b1 + x * 0.005;
    return dc(b0 + b1) * 3.5;
  };
}

const NOISE_FILTERS = { white: whiteFilter, pink: pinkFilter, brown: brownFilter, dark: darkFilter };

/**
 * One channel of coloured noise: call it once per sample. Each call to this
 * factory has its own filter state, so two channels are independent (stereo).
 * `random` returns [0, 1), like Math.random; pass a seeded one to reproduce.
 */
export function createNoiseChannel(type, random = Math.random) {
  const filter = NOISE_FILTERS[type]();
  const gain = NOISE_GAIN[type];
  return () => filter(random() * 2 - 1) * gain;
}

/**
 * The breathing LFO. Returns a function that gives one gain per buffer and
 * advances the phase by that buffer's length (iOS nextBreathGain).
 */
export function createBreath(sampleRate) {
  const twoPi = 2 * Math.PI;
  let phase = 0;
  return (frameCount) => {
    const gain = Math.pow(10, (BREATH_DEPTH_DB * Math.sin(phase)) / 20);
    phase = (phase + (twoPi * BREATH_RATE_HZ * frameCount) / sampleRate) % twoPi;
    return gain;
  };
}

/** Soft-knee limiter: transparent below 0.9, then rolls toward +/-1 with tanh. */
export function softLimit(x) {
  const a = Math.abs(x);
  if (a <= SOFT_LIMIT_KNEE) return x;
  const over = (a - SOFT_LIMIT_KNEE) / (1 - SOFT_LIMIT_KNEE);
  const limited = SOFT_LIMIT_KNEE + (1 - SOFT_LIMIT_KNEE) * Math.tanh(over);
  return x < 0 ? -limited : limited;
}

/**
 * Fill one stereo buffer of live noise: colour, breath, limiter (the order of
 * iOS generateAudio). `nextBreath` comes from createBreath().
 */
export function renderNoiseBuffer(outL, outR, channelL, channelR, nextBreath) {
  const frameCount = outL.length;
  const breath = nextBreath(frameCount);
  for (let i = 0; i < frameCount; i++) {
    outL[i] = softLimit(channelL() * breath);
    outR[i] = softLimit(channelR() * breath);
  }
}

/** Call a context method that may return a promise (old WebKit returns none) and never throw. */
function quietly(ctx, method) {
  try {
    const p = ctx[method]();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    // Autoplay policy or a closed context: nothing to do.
  }
}

/** Resume a suspended context (the next user gesture retries if blocked). */
function wake(ctx) {
  if (ctx && ctx.state === 'suspended') quietly(ctx, 'resume');
}

/**
 * Web Audio API engine replicating the iOS SimpleAudioGenerator.
 * Supports: silence, binaural beats (2/6/10/16 Hz, with the warmth bed),
 * white/pink/brown/dark noise, and a custom file.
 *
 * Graph: sources -> muteGain -> masterGain (fades) -> destination.
 * Bells go straight to the destination, so they ring while muted.
 *
 * API (stable object across renders):
 *   play(sound, { fadeInSeconds = 5 } = {})
 *   stop()              fade out over 3 s, then release the sources
 *   pause() / resume()  suspend / resume the context (timer pause)
 *   setMuted(bool)      silence the sound without stopping it
 *   playBell()          interval bell (the Meditation Bell recording)
 */
export function useAudioEngine() {
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const muteGainRef = useRef(null);
  const bedBufferRef = useRef(null);
  const sourceNodesRef = useRef([]);
  const processorRef = useRef(null);
  const customAudioRef = useRef(null);
  const customUrlRef = useRef(null);
  const isPlayingRef = useRef(false);
  const mutedRef = useRef(false);
  const pausedRef = useRef(false);
  const playIdRef = useRef(0);
  // The decoded bell (an AudioBuffer), or the promise of it.
  const bellBufferRef = useRef(null);

  // Lazily create the context (first call happens inside a user gesture).
  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      const mute = ctx.createGain();
      mute.gain.value = mutedRef.current ? 0 : 1;
      mute.connect(master);
      ctxRef.current = ctx;
      masterGainRef.current = master;
      muteGainRef.current = mute;
    }
    return ctxRef.current;
  }, []);

  // Stop and release every current source.
  const stopAll = useCallback(() => {
    sourceNodesRef.current.forEach((node) => {
      try { node.stop(); } catch { /* not a scheduled source, or already stopped */ }
      try { node.disconnect(); } catch { /* already disconnected */ }
    });
    sourceNodesRef.current = [];

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try { processorRef.current.disconnect(); } catch { /* already disconnected */ }
      processorRef.current = null;
    }

    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.removeAttribute('src');
      customAudioRef.current = null;
    }
    if (customUrlRef.current) {
      URL.revokeObjectURL(customUrlRef.current);
      customUrlRef.current = null;
    }
  }, []);

  const fadeIn = useCallback((seconds) => {
    const ctx = ctxRef.current;
    const gain = masterGainRef.current?.gain;
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0, now);
    if (seconds > 0) {
      gain.linearRampToValueAtTime(1, now + seconds);
    } else {
      gain.setValueAtTime(1, now);
    }
  }, []);

  const fadeOut = useCallback(() => new Promise((resolve) => {
    const ctx = ctxRef.current;
    const gain = masterGainRef.current?.gain;
    if (!ctx || !gain) {
      resolve();
      return;
    }
    const now = ctx.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);
    setTimeout(resolve, FADE_OUT_SECONDS * 1000 + 100);
  }), []);

  // --- BINAURAL BEATS (+ warmth bed) ---
  const playBinaural = useCallback((beatHz) => {
    const ctx = ctxRef.current;
    const out = muteGainRef.current;

    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.value = BINAURAL_BASE_HZ - beatHz / 2;

    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.value = BINAURAL_BASE_HZ + beatHz / 2;

    // Left on channel 0, right on channel 1.
    const merger = ctx.createChannelMerger(2);
    const toneGain = ctx.createGain();
    toneGain.gain.value = BINAURAL_SINE_GAIN;

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);
    merger.connect(toneGain);
    toneGain.connect(out);

    if (!bedBufferRef.current) {
      bedBufferRef.current = buildWarmthBed(ctx);
    }
    const bed = ctx.createBufferSource();
    bed.buffer = bedBufferRef.current;
    bed.loop = true;
    bed.connect(out);

    oscLeft.start();
    oscRight.start();
    bed.start(0, Math.random() * bed.buffer.duration);

    sourceNodesRef.current.push(oscLeft, oscRight, bed, merger, toneGain);
  }, []);

  // --- NOISE GENERATION ---
  // The app's noise path (see the module-level DSP above), rendered in a
  // ScriptProcessorNode with independent filters for each ear.
  const playNoise = useCallback((noiseType) => {
    const ctx = ctxRef.current;
    const processor = ctx.createScriptProcessor(BUFFER_SIZE, 0, 2);
    const channelL = createNoiseChannel(noiseType);
    const channelR = createNoiseChannel(noiseType);
    const nextBreath = createBreath(ctx.sampleRate);

    processor.onaudioprocess = (e) => {
      renderNoiseBuffer(
        e.outputBuffer.getChannelData(0),
        e.outputBuffer.getChannelData(1),
        channelL,
        channelR,
        nextBreath,
      );
    };

    processor.connect(muteGainRef.current);
    processorRef.current = processor;
  }, []);

  // --- CUSTOM AUDIO FILE ---
  const playCustom = useCallback((file, loop = true) => {
    const ctx = ctxRef.current;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.loop = loop;
    audio.crossOrigin = 'anonymous';

    // Route through Web Audio for fades and mute.
    const source = ctx.createMediaElementSource(audio);
    source.connect(muteGainRef.current);

    audio.play().catch((err) => console.warn('Custom audio play failed:', err));
    customAudioRef.current = audio;
    customUrlRef.current = url;
    sourceNodesRef.current.push(source);
  }, []);

  // --- PUBLIC API ---

  /**
   * Play a sound, replacing whatever is playing.
   * @param {Object} sound - { type: 'silence'|'binaural'|'white'|'pink'|'brown'|'dark'|'custom', frequency?, file?, loop? }
   * @param {Object} [options] - { fadeInSeconds = 5 }
   */
  const play = useCallback(async (sound, options) => {
    const fadeInSeconds = Number.isFinite(options?.fadeInSeconds)
      ? Math.max(0, options.fadeInSeconds)
      : DEFAULT_FADE_IN_SECONDS;

    playIdRef.current += 1;
    stopAll();
    const ctx = ensureContext();
    pausedRef.current = false;
    wake(ctx);
    isPlayingRef.current = true;

    // Silence: the context is ready for a later switch to a sound.
    if (!sound || sound.type === 'silence') return;

    if (sound.type === 'binaural') {
      playBinaural(sound.frequency || DEFAULT_BEAT_HZ);
    } else if (NOISE_TYPES.includes(sound.type)) {
      playNoise(sound.type);
    } else if (sound.type === 'custom' && sound.file) {
      playCustom(sound.file, sound.loop !== false);
    }

    fadeIn(fadeInSeconds);
  }, [stopAll, ensureContext, playBinaural, playNoise, playCustom, fadeIn]);

  /**
   * Stop all audio with a 3 s fade-out. A play() during the fade wins: the
   * pending stop then leaves the new sound alone.
   */
  const stop = useCallback(async () => {
    if (!isPlayingRef.current) return;
    const id = playIdRef.current;
    await fadeOut();
    if (id !== playIdRef.current) return;
    stopAll();
    isPlayingRef.current = false;
  }, [fadeOut, stopAll]);

  /** Pause audio (suspend the context). */
  const pause = useCallback(() => {
    pausedRef.current = true;
    const ctx = ctxRef.current;
    if (ctx && ctx.state === 'running') {
      quietly(ctx, 'suspend');
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }
  }, []);

  /** Resume audio (resume the context). */
  const resume = useCallback(() => {
    pausedRef.current = false;
    wake(ctxRef.current);
    if (customAudioRef.current) {
      customAudioRef.current.play().catch(() => {});
    }
  }, []);

  /** Mute or unmute the sound without stopping it (bells still ring). */
  const setMuted = useCallback((muted) => {
    mutedRef.current = !!muted;
    const ctx = ctxRef.current;
    const gain = muteGainRef.current?.gain;
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.setTargetAtTime(mutedRef.current ? 0 : 1, now, MUTE_TIME_CONSTANT);
  }, []);

  /**
   * Ring the interval bell: the app's default, the Meditation Bell. The
   * recording is fetched and decoded on the first ring (the context exists by
   * then), and rings as soon as it is ready. It bypasses the mute and master
   * gains, so it rings while the sound is muted. It never wakes a context
   * that pause() suspended.
   */
  const playBell = useCallback(() => {
    if (pausedRef.current) return;
    const ctx = ensureContext();
    wake(ctx);
    if (!bellBufferRef.current) {
      bellBufferRef.current = fetch(BELL_URL)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => {
          bellBufferRef.current = null;
          return null;
        });
    }
    Promise.resolve(bellBufferRef.current).then((buffer) => {
      if (!buffer || pausedRef.current || ctxRef.current !== ctx) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = BELL_GAIN;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    });
  }, [ensureContext]);

  // Release the context when the owner unmounts (e.g. the landing page's
  // Listen engine on a route change). The player's engine lives at the root.
  useEffect(() => () => {
    playIdRef.current += 1;
    stopAll();
    const ctx = ctxRef.current;
    ctxRef.current = null;
    masterGainRef.current = null;
    muteGainRef.current = null;
    bedBufferRef.current = null;
    bellBufferRef.current = null;
    isPlayingRef.current = false;
    pausedRef.current = false;
    if (ctx) quietly(ctx, 'close');
  }, [stopAll]);

  return useMemo(
    () => ({ play, stop, pause, resume, setMuted, playBell }),
    [play, stop, pause, resume, setMuted, playBell],
  );
}

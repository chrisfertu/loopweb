import { useRef, useCallback } from 'react';

// Base frequency for binaural beats (octave below 432Hz)
const BINAURAL_BASE_HZ = 216;
const FADE_IN_SECONDS = 5;
const FADE_OUT_SECONDS = 3;
const BUFFER_SIZE = 4096;

/**
 * Web Audio API engine replicating the iOS SimpleAudioGenerator.
 * Supports: silence, binaural beats (2/4/10/20Hz), white/pink/brown/dark noise, custom file.
 */
export function useAudioEngine() {
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const sourceNodesRef = useRef([]);
  const processorRef = useRef(null);
  const customAudioRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Ensure AudioContext exists (lazy init on first user gesture)
  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.gain.value = 0;
      masterGainRef.current.connect(ctxRef.current.destination);
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Stop all currently playing sources
  const stopAll = useCallback(() => {
    // Stop oscillator/source nodes
    sourceNodesRef.current.forEach((node) => {
      try { node.stop(); } catch (_) { /* already stopped */ }
      try { node.disconnect(); } catch (_) { /* already disconnected */ }
    });
    sourceNodesRef.current = [];

    // Stop script processor
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (_) {}
      processorRef.current = null;
    }

    // Stop custom audio element
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
      customAudioRef.current = null;
    }
  }, []);

  // Fade master gain in
  const fadeIn = useCallback(() => {
    const ctx = getContext();
    const gain = masterGainRef.current;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_IN_SECONDS);
  }, [getContext]);

  // Fade master gain out, then call callback
  const fadeOut = useCallback(() => {
    return new Promise((resolve) => {
      const ctx = ctxRef.current;
      if (!ctx || !masterGainRef.current) {
        resolve();
        return;
      }
      const gain = masterGainRef.current;
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);
      setTimeout(resolve, FADE_OUT_SECONDS * 1000 + 100);
    });
  }, []);

  // --- BINAURAL BEATS ---
  const playBinaural = useCallback((beatHz) => {
    const ctx = getContext();
    const leftFreq = BINAURAL_BASE_HZ - beatHz / 2;
    const rightFreq = BINAURAL_BASE_HZ + beatHz / 2;

    // Create oscillators
    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.value = leftFreq;

    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.value = rightFreq;

    // Create stereo merger (left on channel 0, right on channel 1)
    const merger = ctx.createChannelMerger(2);

    // Gain for binaural (0.3 matching iOS)
    const binauralGain = ctx.createGain();
    binauralGain.gain.value = 0.3;

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);
    merger.connect(binauralGain);
    binauralGain.connect(masterGainRef.current);

    oscLeft.start();
    oscRight.start();

    sourceNodesRef.current.push(oscLeft, oscRight);
  }, [getContext]);

  // --- NOISE GENERATION ---
  const playNoise = useCallback((noiseType) => {
    const ctx = getContext();

    // ScriptProcessorNode for real-time noise generation
    const processor = ctx.createScriptProcessor(BUFFER_SIZE, 0, 2);

    // State for filters
    let pinkB0L = 0, pinkB1L = 0, pinkB2L = 0;
    let pinkB0R = 0, pinkB1R = 0, pinkB2R = 0;
    let brownLastL = 0, brownLastR = 0;
    let darkB0L = 0, darkB1L = 0;
    let darkB0R = 0, darkB1R = 0;

    processor.onaudioprocess = (e) => {
      const outL = e.outputBuffer.getChannelData(0);
      const outR = e.outputBuffer.getChannelData(1);

      for (let i = 0; i < BUFFER_SIZE; i++) {
        const whiteL = Math.random() - 0.5;
        const whiteR = Math.random() - 0.5;

        switch (noiseType) {
          case 'white':
            outL[i] = whiteL;
            outR[i] = whiteR;
            break;

          case 'pink':
            // Voss-McCartney filter (iOS coefficients)
            pinkB0L = 0.99886 * pinkB0L + whiteL * 0.0555179;
            pinkB1L = 0.99332 * pinkB1L + whiteL * 0.0750759;
            pinkB2L = 0.96900 * pinkB2L + whiteL * 0.1538520;
            outL[i] = (pinkB0L + pinkB1L + pinkB2L + whiteL * 0.3104856) * 0.3;

            pinkB0R = 0.99886 * pinkB0R + whiteR * 0.0555179;
            pinkB1R = 0.99332 * pinkB1R + whiteR * 0.0750759;
            pinkB2R = 0.96900 * pinkB2R + whiteR * 0.1538520;
            outR[i] = (pinkB0R + pinkB1R + pinkB2R + whiteR * 0.3104856) * 0.3;
            break;

          case 'brown':
            // Integration filter (iOS coefficients)
            brownLastL = (brownLastL + whiteL * 0.02) * 0.998;
            outL[i] = brownLastL * 3.5 * 0.4;

            brownLastR = (brownLastR + whiteR * 0.02) * 0.998;
            outR[i] = brownLastR * 3.5 * 0.4;
            break;

          case 'dark':
            // Heavy low-pass (iOS coefficients)
            darkB0L = 0.9995 * darkB0L + whiteL * 0.01;
            darkB1L = 0.999 * darkB1L + whiteL * 0.005;
            outL[i] = (darkB0L + darkB1L) * 8.0 * 0.5;

            darkB0R = 0.9995 * darkB0R + whiteR * 0.01;
            darkB1R = 0.999 * darkB1R + whiteR * 0.005;
            outR[i] = (darkB0R + darkB1R) * 8.0 * 0.5;
            break;

          default:
            outL[i] = 0;
            outR[i] = 0;
        }
      }
    };

    processor.connect(masterGainRef.current);
    processorRef.current = processor;
  }, [getContext]);

  // --- CUSTOM AUDIO FILE ---
  const playCustom = useCallback((file, loop = true) => {
    const ctx = getContext();
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.loop = loop;
    audio.crossOrigin = 'anonymous';

    // Connect through Web Audio for gain control
    const source = ctx.createMediaElementSource(audio);
    source.connect(masterGainRef.current);

    audio.play().catch((err) => console.warn('Custom audio play failed:', err));
    customAudioRef.current = audio;
    sourceNodesRef.current.push(source);
  }, [getContext]);

  // --- PUBLIC API ---

  /**
   * Play a sound.
   * @param {Object} sound - { type: 'silence'|'binaural'|'white'|'pink'|'brown'|'dark'|'custom', frequency?, file?, loop? }
   */
  const play = useCallback(async (sound) => {
    // Stop anything currently playing
    stopAll();

    if (!sound || sound.type === 'silence') {
      // Still init context + fade in (for switching to sound later)
      getContext();
      isPlayingRef.current = true;
      return;
    }

    isPlayingRef.current = true;

    if (sound.type === 'binaural') {
      playBinaural(sound.frequency || 4);
    } else if (['white', 'pink', 'brown', 'dark'].includes(sound.type)) {
      playNoise(sound.type);
    } else if (sound.type === 'custom' && sound.file) {
      playCustom(sound.file, sound.loop !== false);
    }

    fadeIn();
  }, [stopAll, getContext, playBinaural, playNoise, playCustom, fadeIn]);

  /**
   * Stop all audio with fade-out.
   */
  const stop = useCallback(async () => {
    if (!isPlayingRef.current) return;
    await fadeOut();
    stopAll();
    isPlayingRef.current = false;
  }, [fadeOut, stopAll]);

  /**
   * Pause audio (suspend context).
   */
  const pause = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state === 'running') {
      ctxRef.current.suspend();
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }
  }, []);

  /**
   * Resume audio (resume context).
   */
  const resume = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    if (customAudioRef.current) {
      customAudioRef.current.play().catch(() => {});
    }
  }, []);

  return { play, stop, pause, resume };
}

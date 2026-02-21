import { createContext, useContext, useState, useCallback } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useTimer, formatTime } from '../hooks/useTimer';
import { DEFAULT_SOUND } from '../components/SoundPicker';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [selectedSound, setSelectedSound] = useState(DEFAULT_SOUND);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [customTrack, setCustomTrack] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const timer = useTimer();
  const audio = useAudioEngine();

  const handlePlayPause = useCallback(() => {
    if (timer.timerState === 'idle') {
      timer.start();
      audio.play(selectedSound);
      setIsMuted(false);
    } else if (timer.timerState === 'running') {
      timer.pause();
      audio.pause();
      setIsMuted(false);
    } else if (timer.timerState === 'paused') {
      timer.resume();
      audio.resume();
      setIsMuted(false);
    }
  }, [timer, audio, selectedSound]);

  const handleStop = useCallback(async () => {
    timer.stop();
    await audio.stop();
    setIsMuted(false);
  }, [timer, audio]);

  const handleSelectSound = useCallback((sound) => {
    setSelectedSound(sound);
    if (timer.timerState === 'running') {
      audio.play(sound);
    }
    setShowSoundPicker(false);
  }, [timer.timerState, audio]);

  const handleImportTrack = useCallback((file) => {
    const track = { name: file.name, file, loop: true };
    setCustomTrack(track);
    const sound = { type: 'custom', label: file.name, file, loop: true };
    setSelectedSound(sound);
    if (timer.timerState === 'running') {
      audio.play(sound);
    }
  }, [timer.timerState, audio]);

  const handleToggleLoop = useCallback(() => {
    if (!customTrack) return;
    const newLoop = !customTrack.loop;
    setCustomTrack({ ...customTrack, loop: newLoop });
    if (selectedSound.type === 'custom') {
      const updatedSound = { ...selectedSound, loop: newLoop };
      setSelectedSound(updatedSound);
      if (timer.timerState === 'running') {
        audio.play(updatedSound);
      }
    }
  }, [customTrack, selectedSound, timer.timerState, audio]);

  const handleToggleMute = useCallback(() => {
    if (timer.timerState !== 'running') return;
    if (isMuted) {
      audio.resume();
      setIsMuted(false);
    } else {
      audio.pause();
      setIsMuted(true);
    }
  }, [timer.timerState, audio, isMuted]);

  const toggleSoundPicker = useCallback(() => {
    setShowSoundPicker((v) => !v);
  }, []);

  const value = {
    timerState: timer.timerState,
    elapsedSeconds: timer.elapsedSeconds,
    selectedSound,
    showSoundPicker,
    customTrack,
    isMuted,
    formatTime,
    onPlayPause: handlePlayPause,
    onStop: handleStop,
    onSelectSound: handleSelectSound,
    onImportTrack: handleImportTrack,
    onToggleLoop: handleToggleLoop,
    onToggleMute: handleToggleMute,
    onToggleSoundPicker: toggleSoundPicker,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { trapFocusKeyDown, focusFirstIn, restoreFocusOnClose } from './pickerUtils';

// Sound definitions
export const SOUNDS = [
  { type: 'silence', label: 'Silence', subtitle: null, group: 'default' },
  { type: 'binaural', label: '2Hz Delta', subtitle: 'Deep sleep', frequency: 2, group: 'binaural' },
  { type: 'binaural', label: '4Hz Theta', subtitle: 'Meditation', frequency: 4, group: 'binaural' },
  { type: 'binaural', label: '10Hz Alpha', subtitle: 'Relaxation', frequency: 10, group: 'binaural' },
  { type: 'binaural', label: '20Hz Beta', subtitle: 'Active focus', frequency: 20, group: 'binaural' },
  { type: 'white', label: 'White Noise', subtitle: null, group: 'noise' },
  { type: 'pink', label: 'Pink Noise', subtitle: null, group: 'noise' },
  { type: 'brown', label: 'Brown Noise', subtitle: null, group: 'noise' },
  { type: 'dark', label: 'Dark Noise', subtitle: null, group: 'noise' },
];

export const DEFAULT_SOUND = SOUNDS[0]; // Silence

const SoundPicker = ({ isOpen, onClose, selectedSound, onSelectSound, customTrack, onImportTrack, onToggleLoop }) => {
  const sheetRef = useRef(null);
  const prefersReduced = useReducedMotion();

  // Intercept browser back button to close the sheet instead of navigating away
  useEffect(() => {
    if (!isOpen) return;

    const closedByBack = { current: false };

    window.history.pushState({ soundPicker: true }, '');

    const handlePopState = () => {
      closedByBack.current = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByBack.current) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  // Focus management: focus first interactive element on open, restore on close
  useEffect(() => {
    if (!isOpen) return;
    const restore = restoreFocusOnClose();
    focusFirstIn(sheetRef.current);
    return restore;
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportTrack(file);
    }
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleSheetKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    trapFocusKeyDown(e, sheetRef.current);
  };

  const isSelected = (sound) => {
    if (sound.type === 'custom') {
      return selectedSound?.type === 'custom';
    }
    return (
      selectedSound?.type === sound.type &&
      selectedSound?.label === sound.label
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="sound-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sound-picker-title"
            onKeyDown={handleSheetKeyDown}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={prefersReduced ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 300 }}
            drag={prefersReduced ? false : 'y'}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2" aria-hidden="true">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 id="sound-picker-title" className="text-base font-semibold text-white">Sound</h3>
              <button
                onClick={onClose}
                className="text-white/75 hover:text-white transition-colors text-sm"
              >
                Done
              </button>
            </div>

            {/* Sound list */}
            <div
              role="radiogroup"
              aria-label="Ambient sound"
              className="px-3 pb-10 space-y-1 max-h-[70vh] overflow-y-auto overscroll-contain"
            >
              {/* Silence */}
              <SoundGroup label={null}>
                <SoundRow
                  sound={SOUNDS[0]}
                  selected={isSelected(SOUNDS[0])}
                  onSelect={() => onSelectSound(SOUNDS[0])}
                />
              </SoundGroup>

              {/* Binaural Beats */}
              <SoundGroup label="Binaural Beats">
                {SOUNDS.filter((s) => s.group === 'binaural').map((sound) => (
                  <SoundRow
                    key={sound.label}
                    sound={sound}
                    selected={isSelected(sound)}
                    onSelect={() => onSelectSound(sound)}
                  />
                ))}
              </SoundGroup>

              {/* Noise */}
              <SoundGroup label="Noise">
                {SOUNDS.filter((s) => s.group === 'noise').map((sound) => (
                  <SoundRow
                    key={sound.label}
                    sound={sound}
                    selected={isSelected(sound)}
                    onSelect={() => onSelectSound(sound)}
                  />
                ))}
              </SoundGroup>

              {/* Custom Audio */}
              <SoundGroup label="Your Audio">
                {customTrack ? (
                  <div>
                    <SoundRow
                      sound={{ type: 'custom', label: customTrack.name, subtitle: null }}
                      selected={selectedSound?.type === 'custom'}
                      onSelect={() => onSelectSound({ type: 'custom', label: customTrack.name, file: customTrack.file, loop: customTrack.loop })}
                    />
                    {/* Loop toggle */}
                    <div className="flex items-center justify-between px-4 py-2">
                      <span id="sound-loop-label" className="text-xs text-white/70">Loop</span>
                      <button
                        onClick={onToggleLoop}
                        role="switch"
                        aria-checked={!!customTrack.loop}
                        aria-labelledby="sound-loop-label"
                        className={`w-9 h-5 rounded-full transition-colors relative ${
                          customTrack.loop ? 'bg-opus-green/60' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                            customTrack.loop ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                ) : null}
                <label className="block w-full text-left px-4 py-3 rounded-lg text-sm text-opus-green hover:bg-white/5 transition-colors cursor-pointer">
                  {customTrack ? 'Replace track' : 'Import a track'}
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/aac,audio/flac,audio/aiff,.mp3,.m4a,.wav,.aac,.flac,.aiff"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </SoundGroup>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Group wrapper
const SoundGroup = ({ label, children }) => (
  <div className="mb-2">
    {label && (
      <p className="text-[11px] uppercase tracking-wider text-white/70 px-4 pt-3 pb-1 font-courier">
        {label}
      </p>
    )}
    {children}
  </div>
);

// Individual sound row
const SoundRow = ({ sound, selected, onSelect }) => (
  <button
    onClick={onSelect}
    role="radio"
    aria-checked={selected}
    className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
      selected ? 'bg-white/10' : 'hover:bg-white/5'
    }`}
  >
    <div>
      <span className="text-sm text-white">{sound.label}</span>
      {sound.subtitle && (
        <span className="text-xs text-white/60 ml-2">{sound.subtitle}</span>
      )}
    </div>
    {selected && (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2.5" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </button>
);

export default SoundPicker;

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOUNDS } from '../content/sounds';

const SoundPicker = ({ isOpen, onClose, selectedSound, onSelectSound, customTrack, onImportTrack, onToggleLoop }) => {
  const fileInputRef = useRef(null);

  // Intercept browser back button to close the sheet instead of navigating away
  useEffect(() => {
    if (!isOpen) return;

    const closedByBack = { current: false };

    // Keep the router's state (idx, key) on our entry so its history indexes stay valid.
    window.history.pushState({ ...window.history.state, soundPicker: true }, '');

    const handlePopState = () => {
      closedByBack.current = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Undo our entry only if it is still on top. After a route change the
      // router's entry is on top, and going back would leave the new page.
      if (!closedByBack.current && window.history.state?.soundPicker) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportTrack(file);
    }
    // Reset so the same file can be re-selected
    e.target.value = '';
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
          />

          {/* Sheet */}
          <motion.div
            className="sound-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Sound"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-base font-semibold text-white">Sound</h3>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-2 text-white/70 hover:text-white transition-colors text-sm"
              >
                Done
              </button>
            </div>

            {/* Sound list */}
            <div className="px-3 pb-10 space-y-1 max-h-[70vh] overflow-y-auto overscroll-contain">
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
                      <span id="sound-picker-loop" className="text-xs text-white/60">Loop</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!customTrack.loop}
                        aria-labelledby="sound-picker-loop"
                        onClick={onToggleLoop}
                        className={`w-9 h-5 rounded-full transition-colors relative ${
                          customTrack.loop ? 'bg-opus-green/60' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                            customTrack.loop ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm text-opus-green hover:bg-white/5 transition-colors"
                >
                  {customTrack ? 'Replace track' : 'Import a track'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/aac,audio/flac,audio/aiff,.mp3,.m4a,.wav,.aac,.flac,.aiff"
                  className="hidden"
                  onChange={handleFileChange}
                />
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
      <p className="text-[11px] uppercase tracking-wider text-white/55 px-4 pt-3 pb-1 font-courier">
        {label}
      </p>
    )}
    {children}
  </div>
);

// Individual sound row
const SoundRow = ({ sound, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
      selected ? 'bg-white/10' : 'hover:bg-white/5'
    }`}
  >
    <div>
      <span className="text-sm text-white">{sound.label}</span>
      {sound.subtitle && (
        <span className="text-xs text-white/55 ml-2">{sound.subtitle}</span>
      )}
    </div>
    {selected && (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A9B58" strokeWidth="2.5" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </button>
);

export default SoundPicker;

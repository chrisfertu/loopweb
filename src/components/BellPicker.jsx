import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { trapFocusKeyDown, focusFirstIn, restoreFocusOnClose } from './pickerUtils';

const INTERVALS = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60];

const BellPicker = ({ isOpen, onClose, bellEnabled, onSetBellEnabled, bellInterval, onSetBellInterval }) => {
  const sheetRef = useRef(null);
  const prefersReduced = useReducedMotion();

  // Intercept browser back button to close the sheet instead of navigating away
  useEffect(() => {
    if (!isOpen) return;

    const closedByBack = { current: false };

    window.history.pushState({ bellPicker: true }, '');

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

  const handleSheetKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    trapFocusKeyDown(e, sheetRef.current);
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
            aria-labelledby="bell-picker-title"
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
              <h3 id="bell-picker-title" className="text-base font-semibold text-white">Interval Bell</h3>
              <button
                onClick={onClose}
                className="text-white/75 hover:text-white transition-colors text-sm"
              >
                Done
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-10">
              {/* Toggle */}
              <div className="flex items-center justify-between py-3 px-1">
                <span id="bell-toggle-label" className="text-sm text-white/70">Play a bell</span>
                <button
                  onClick={() => onSetBellEnabled(!bellEnabled)}
                  role="switch"
                  aria-checked={bellEnabled}
                  aria-labelledby="bell-toggle-label"
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    bellEnabled ? 'bg-opus-green/60' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                      bellEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Interval grid — visible when enabled */}
              <AnimatePresence>
                {bellEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p id="bell-interval-label" className="text-[11px] uppercase tracking-wider text-white/70 px-1 pt-3 pb-2 font-courier">
                      Every
                    </p>
                    <div
                      className="grid grid-cols-5 gap-2"
                      role="radiogroup"
                      aria-labelledby="bell-interval-label"
                    >
                      {INTERVALS.map((min) => (
                        <button
                          key={min}
                          onClick={() => onSetBellInterval(min)}
                          role="radio"
                          aria-checked={bellInterval === min}
                          aria-label={`${min} ${min === 1 ? 'minute' : 'minutes'}`}
                          className={`py-2.5 rounded-lg text-sm font-courier transition-colors ${
                            bellInterval === min
                              ? 'bg-white/[0.12] text-white'
                              : 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          {min}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/70 px-1 pt-2 font-courier">
                      {bellInterval === 1 ? '1 minute' : `${bellInterval} minutes`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BellPicker;

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTERVALS = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60];

const BellPicker = ({ isOpen, onClose, bellEnabled, onSetBellEnabled, bellInterval, onSetBellInterval }) => {

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
              <h3 className="text-base font-semibold text-white">Interval Bell</h3>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white/70 transition-colors text-sm"
              >
                Done
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-10">
              {/* Toggle */}
              <div className="flex items-center justify-between py-3 px-1">
                <span className="text-sm text-white/70">Play a bell</span>
                <button
                  onClick={() => onSetBellEnabled(!bellEnabled)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    bellEnabled ? 'bg-opus-green/60' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                      bellEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
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
                    <p className="text-[11px] uppercase tracking-wider text-white/25 px-1 pt-3 pb-2 font-courier">
                      Every
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {INTERVALS.map((min) => (
                        <button
                          key={min}
                          onClick={() => onSetBellInterval(min)}
                          className={`py-2.5 rounded-lg text-sm font-courier transition-colors ${
                            bellInterval === min
                              ? 'bg-white/[0.12] text-white'
                              : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                          }`}
                        >
                          {min}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-white/20 px-1 pt-2 font-courier">
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

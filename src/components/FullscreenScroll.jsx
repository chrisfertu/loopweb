import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FullscreenScroll = ({ children, onSectionChange, locked = false }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef(null);
  const sections = Array.isArray(children) ? children : [children];
  const numSections = sections.length;
  const lastScrollTime = useRef(Date.now());
  const SCROLL_COOLDOWN = 1200;

  const navigateToSection = useCallback((index) => {
    if (
      locked ||
      isTransitioning ||
      index < 0 ||
      index >= numSections ||
      index === currentSection ||
      Date.now() - lastScrollTime.current < SCROLL_COOLDOWN
    ) {
      return;
    }

    setIsTransitioning(true);
    lastScrollTime.current = Date.now();
    setCurrentSection(index);
    onSectionChange?.(index);

    setTimeout(() => {
      setIsTransitioning(false);
    }, SCROLL_COOLDOWN);
  }, [currentSection, isTransitioning, numSections, onSectionChange, locked]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let throttleTimeout = null;

    const handleWheel = (e) => {
      e.preventDefault();
      if (locked) return;
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => { throttleTimeout = null; }, 100);

      if (e.deltaY > 0) {
        navigateToSection(currentSection + 1);
      } else if (e.deltaY < 0) {
        navigateToSection(currentSection - 1);
      }
    };

    const handleKeyDown = (e) => {
      if (locked) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        navigateToSection(currentSection + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        navigateToSection(currentSection - 1);
      }
    };

    let touchStart = null;
    const TOUCH_THRESHOLD = 60;

    const handleTouchStart = (e) => {
      if (locked) return;
      touchStart = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (locked || !touchStart) return;
      const deltaY = touchStart - e.touches[0].clientY;

      if (Math.abs(deltaY) > TOUCH_THRESHOLD) {
        if (deltaY > 0) {
          navigateToSection(currentSection + 1);
        } else {
          navigateToSection(currentSection - 1);
        }
        touchStart = null;
      }
    };

    const handleTouchEnd = () => {
      touchStart = null;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSection, navigateToSection, locked]);

  // Navigation dots
  const NavigationDots = () => (
    <div
      className={`fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 transition-opacity duration-500 ${
        locked ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {sections.map((_, index) => (
        <button
          key={index}
          onClick={() => navigateToSection(index)}
          className="relative flex items-center justify-center w-6 h-6 group"
          aria-label={`Go to section ${index + 1}`}
        >
          <div
            className={`rounded-full transition-all duration-500 ${
              index === currentSection
                ? 'w-2 h-2 bg-white'
                : 'w-1.5 h-1.5 bg-white/30 group-hover:bg-white/60'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="h-screen overflow-hidden relative touch-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-screen"
        >
          {sections[currentSection]}
        </motion.div>
      </AnimatePresence>
      <NavigationDots />
    </div>
  );
};

export default FullscreenScroll;

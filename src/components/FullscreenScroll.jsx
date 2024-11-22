import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const FullscreenScroll = ({ children, onSectionChange }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef(null);
  const sections = Array.isArray(children) ? children : [children];
  const numSections = sections.length;

  // Throttle scroll events
  const throttleTimeout = useRef(null);
  const lastScrollTime = useRef(Date.now());
  const SCROLL_COOLDOWN = 1500; // ms between scroll events

  const navigateToSection = (index) => {
    if (
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

    // Reset transition lock after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, SCROLL_COOLDOWN);
  };

  // Handle mouse wheel events
  const handleWheel = (e) => {
    if (throttleTimeout.current) return;

    throttleTimeout.current = setTimeout(() => {
      throttleTimeout.current = null;
    }, 100);

    if (e.deltaY > 0) {
      navigateToSection(currentSection + 1);
    } else if (e.deltaY < 0) {
      navigateToSection(currentSection - 1);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      navigateToSection(currentSection + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      navigateToSection(currentSection - 1);
    }
  };

  // Handle touch events
  const touchStart = useRef(null);
  const TOUCH_THRESHOLD = 75; // increased from 50 to 75 for more intentional swipes

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!touchStart.current) return;

    const deltaY = touchStart.current - e.touches[0].clientY;

    if (Math.abs(deltaY) > TOUCH_THRESHOLD) {
      if (deltaY > 0) {
        navigateToSection(currentSection + 1);
      } else {
        navigateToSection(currentSection - 1);
      }
      touchStart.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStart.current = null;
  };

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSection, isTransitioning]);

  // Navigation dots
  const NavigationDots = () => (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
      {sections.map((_, index) => (
        <motion.button
          key={index}
          onClick={() => navigateToSection(index)}
          className="relative flex items-center justify-center w-8 h-4 group"
          aria-label={`Go to section ${index + 1}`}
        >
          <motion.div
            className={`absolute rounded-full bg-white
              ${currentSection === index ? 'w-4 h-1.5 opacity-100' : 'w-1.5 h-1.5 opacity-30'}`}
            animate={{
              width: currentSection === index ? 16 : 6
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          />
        </motion.button>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-hidden bg-black"
      style={{ touchAction: 'none' }}
    >
      <motion.div
        animate={{ y: `-${currentSection * 100}%` }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="w-full h-full relative"
      >
        {sections.map((section, index) => (
          <div
            key={index}
            className="w-full h-full absolute top-0 left-0"
            style={{ transform: `translateY(${index * 100}%)` }}
          >
            {section}
          </div>
        ))}
      </motion.div>
      <NavigationDots />
    </div>
  );
};

FullscreenScroll.propTypes = {
  children: PropTypes.node.isRequired,
  onSectionChange: PropTypes.func
};

export default FullscreenScroll;

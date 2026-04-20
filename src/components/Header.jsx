import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/clip';

  const handleLogoClick = useCallback((e) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isHome]);

  useEffect(() => {
    if (!isHome) {
      setVisible(true);
      return;
    }

    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.7);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          className="header-bar"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="max-w-6xl mx-auto w-full px-5 flex items-center justify-between h-full">
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2.5 group">
              <img src="/images/logo.svg" alt="OPUS Loop" className="w-6 h-6" />
              <span className="font-courier text-[11px] tracking-[0.2em] uppercase text-white/75 group-hover:text-white/90 transition-colors">
                OPUS Loop
              </span>
            </Link>

            <nav aria-label="Primary" className="flex items-center gap-5">
              <Link
                to="/player"
                className="text-[13px] text-white/70 hover:text-white/90 transition-colors"
              >
                Web Player
              </Link>
              <Link
                to="/support"
                className="text-[13px] text-white/70 hover:text-white/90 transition-colors"
              >
                Support
              </Link>
            </nav>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Header;

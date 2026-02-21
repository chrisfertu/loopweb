import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const APP_STORE_URL = 'https://apps.apple.com/app/opus-loop-meditation-timer/id6740513432';

const Header = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/clip';

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
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/images/logo.svg" alt="OPUS Loop" className="w-6 h-6" />
              <span className="font-courier text-[11px] tracking-[0.2em] uppercase text-white/50 group-hover:text-white/70 transition-colors">
                OPUS Loop
              </span>
            </Link>

            <nav className="flex items-center gap-5">
              <Link
                to="/support"
                className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
              >
                Support
              </Link>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="header-download-btn"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download
              </a>
            </nav>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Header;

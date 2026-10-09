import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePath, isHomePath } from '../hooks/usePath';
import MotionToggle from './MotionToggle';
import ringSvg from '../geometry/logo/ring.svg?raw';
import chevronsSvg from '../geometry/logo/chevrons.svg?raw';
import bracketsSvg from '../geometry/logo/brackets.svg?raw';
import coreSvg from '../geometry/logo/core.svg?raw';
import Wordmark from './brand/Wordmark';

const APP_STORE_URL = 'https://apps.apple.com/app/id6756740657';
const SCROLLED_AT = 24;

// The app mark (ring, chevrons, brackets and core in the icon's green, and
// its dot), from the same SVGs the geometry engine draws.
const pathsOf = (svg) => Array.from(svg.matchAll(/\sd="([^"]+)"/g), (m) => m[1]);
const MARK_PATHS = [ringSvg, chevronsSvg, bracketsSvg, coreSvg].flatMap(pathsOf);

const LoopMark = ({ className = '' }) => (
  <svg
    viewBox="160 160 704 704"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {MARK_PATHS.map((d, i) => (
      <path key={i} d={d} fill="#64D262" />
    ))}
    <circle cx="512" cy="512" r="44" fill="#14E468" />
  </svg>
);

const readScrolled = () => typeof window !== 'undefined' && window.scrollY > SCROLLED_AT;
// On Home the hero carries the large wordmark, so the header shows only the
// mark until the hero has mostly scrolled away.
const readPastHero = () => typeof window !== 'undefined' && window.scrollY > window.innerHeight * 0.45;

const Header = () => {
  const path = usePath();
  const isHome = isHomePath(path);
  const [scrolled, setScrolled] = useState(readScrolled);
  const [pastHero, setPastHero] = useState(readPastHero);

  // The page's only scroll listener outside the geometry engine. State only
  // changes when a threshold is crossed.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(readScrolled());
      setPastHero(readPastHero());
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogoClick = useCallback((e) => {
    if (isHome) {
      e.preventDefault();
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [isHome]);

  // Skip link: move focus to the download block, not just the scroll position.
  const handleSkip = useCallback((e) => {
    const target = document.getElementById('download');
    if (!target) return;
    e.preventDefault();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.scrollIntoView();
    target.focus({ preventScroll: true });
  }, []);

  if (path === '/player') return null;

  return (
    <header className="header-bar" data-scrolled={scrolled ? 'true' : 'false'}>
      {isHome && (
        <a
          href="#download"
          onClick={handleSkip}
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-[calc(env(safe-area-inset-top)+8px)] focus:z-[70] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:text-white"
        >
          Skip to download
        </a>
      )}
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-3 px-4 lg:px-10 xl:px-16">
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex min-h-[44px] items-center gap-2.5 rounded-md text-white"
        >
          <LoopMark className="h-[22px] w-[22px] flex-shrink-0" />
          <Wordmark
            className={`h-[19px] w-auto text-paper transition-opacity duration-500 ease-out motion-reduce:transition-none ${
              isHome && !pastHero ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 lg:gap-3">
          <Link
            to="/support"
            className="hidden min-h-[44px] items-center rounded-md px-2 text-sm text-muted transition-colors hover:text-white lg:inline-flex"
          >
            Support
          </Link>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-[44px] items-center rounded-full px-1"
          >
            <span className="whitespace-nowrap rounded-full border border-white/[0.14] px-3.5 py-1.5 text-[13px] leading-none text-white transition-colors group-hover:border-white/30 group-hover:bg-white/[0.06]">
              Get the app
            </span>
          </a>
          <MotionToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header;

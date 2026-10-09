// CoffeeLink: "Buy me a coffee", a pill outlined in soft grains
// (ParticleFrame) beside the App Store button, as tall as it (52px). Opens
// the OPUS Buy Me a Coffee page in a new tab. Copy and address from copy.js
// (free.coffee).

import { free as COPY } from '../../content/copy';
import ParticleFrame from './ParticleFrame';
import { FOCUS_RING } from './links';

export default function CoffeeLink({ className = '' }) {
  return (
    <a
      href={COPY.coffee.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative inline-flex h-[52px] shrink-0 items-center gap-2 rounded-full px-6 text-[15px] font-medium text-white/90 transition-colors hover:bg-loop-glow/[0.05] hover:text-white ${FOCUS_RING} ${className}`}
    >
      <ParticleFrame tone="soft" seed={11} />
      <svg
        viewBox="0 0 20 20"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3.5 7.5h10v4.5a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z" />
        <path d="M13.5 9h1.25a2 2 0 0 1 0 4H13.3" />
        <path d="M7 2.5c-.6.8.6 1.5 0 2.5M10 2.5c-.6.8.6 1.5 0 2.5" />
      </svg>
      {COPY.coffee.label}
    </a>
  );
}

// TryInBrowser: the text link to the web player, "Try it in your browser",
// with a small arrow. Accent green, lighter on hover. 44px tall target.
//
// Props
// - className: extra classes.
// - children: optional label override (defaults to the spec copy).
//
// Hover or focus starts loading the player's chunk, so the click is instant.

import { Link } from 'react-router-dom';
import { FOCUS_RING, PLAYER_PATH } from './links';

function prefetchPlayer() {
  import('../../pages/Player').catch(() => {
    // The route loads (or reports the failure) on click.
  });
}

export default function TryInBrowser({ className = '', children }) {
  return (
    <Link
      to={PLAYER_PATH}
      onPointerEnter={prefetchPlayer}
      onFocus={prefetchPlayer}
      className={`group inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[15px] font-medium text-opus-green transition-colors hover:text-opus-green-dim ${FOCUS_RING} ${className}`}
    >
      <span>{children ?? 'Try it in your browser'}</span>
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      >
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </Link>
  );
}

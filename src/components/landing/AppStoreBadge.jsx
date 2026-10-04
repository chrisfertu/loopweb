// AppStoreBadge: Apple's official black "Download on the App Store" badge
// (public/images/app-store-badge.svg, unmodified), linking to the App Store.
//
// Props
// - className: extra classes for the link (spacing).
// - height: badge height in px (default 44; never below 40, per Apple's
//   guidelines, and 44 keeps the touch target).
// - id: optional id for the link.

import { APP_STORE_BADGE_SRC, APP_STORE_LABEL, APP_STORE_URL, FOCUS_RING } from './links';

// The SVG's own box is 119.66 x 40.
const RATIO = 119.66407 / 40;

export default function AppStoreBadge({ className = '', height = 44, id }) {
  const h = Math.max(40, height);
  return (
    <a
      id={id}
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener"
      className={`inline-flex shrink-0 rounded-[9px] ${FOCUS_RING} ${className}`}
    >
      <img
        src={APP_STORE_BADGE_SRC}
        alt={APP_STORE_LABEL}
        width={Math.round(h * RATIO)}
        height={h}
        decoding="async"
        draggable="false"
        className="block max-w-none"
        style={{ height: h, width: 'auto' }}
      />
    </a>
  );
}

// AppStoreButton: "Download on the App Store", a pill outlined in bright
// grains (ParticleFrame), linking to the App Store in a new tab. Two lines,
// like Apple's badge: a small "Download on the" over "App Store". 52px tall,
// the same as the coffee link beside it, and a little more luminous.
//
// Props
// - className: extra classes for the link (spacing).
// - id: optional id for the link.

import ParticleFrame from './ParticleFrame';
import { APP_STORE_LABEL, APP_STORE_URL, FOCUS_RING } from './links';

export default function AppStoreButton({ className = '', id }) {
  return (
    <a
      id={id}
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener"
      aria-label={APP_STORE_LABEL}
      className={`group relative inline-flex h-[52px] shrink-0 flex-col items-center justify-center rounded-full bg-loop-glow/[0.05] px-6 text-white transition-colors hover:bg-loop-glow/[0.09] ${FOCUS_RING} ${className}`}
    >
      <ParticleFrame tone="bright" seed={3} />
      <span aria-hidden="true" className="text-[10.5px] leading-[13px] tracking-[0.01em] text-white/75">
        Download on the
      </span>
      <span aria-hidden="true" className="text-[18px] font-medium leading-[21px] tracking-[-0.01em]">
        App Store
      </span>
    </a>
  );
}

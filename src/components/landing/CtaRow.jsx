// CtaRow: the App Store badge and the "Try it in your browser" link.
// Stacked on phones, side by side from 640px. Every target is at least 44px.
//
// Props
// - id: optional id on the row (the free section uses id="download", the
//   skip link's target). The row can take focus programmatically and keeps
//   clear of the fixed header when scrolled to.
// - className: extra classes (spacing, alignment).
// - align: 'left' (default) or 'center'.

import AppStoreBadge from './AppStoreBadge';
import TryInBrowser from './TryInBrowser';

export default function CtaRow({ id, className = '', align = 'left' }) {
  const center = align === 'center';
  return (
    <div
      id={id}
      tabIndex={id ? -1 : undefined}
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-7 ${
        center ? 'items-center sm:justify-center' : 'items-start'
      } ${id ? 'scroll-mt-4 focus:outline-none' : ''} ${className}`}
    >
      <AppStoreBadge />
      <TryInBrowser />
    </div>
  );
}

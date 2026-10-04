// CtaRow: the App Store button and the "Try it in your browser" link.
// The button (and anything passed as children, kept on its line) first;
// the link beside them when there is room, under them when not. Every
// target is at least 44px.
//
// Props
// - id: optional id on the row (the free section uses id="download", the
//   skip link's target). The row can take focus programmatically and keeps
//   clear of the fixed header when scrolled to.
// - className: extra classes (spacing, alignment).
// - align: 'left' (default) or 'center'.
// - children: anything to put right after the button, on its line (the
//   free section's coffee link).

import AppStoreButton from './AppStoreButton';
import TryInBrowser from './TryInBrowser';

export default function CtaRow({ id, className = '', align = 'left', children }) {
  const center = align === 'center';
  return (
    <div
      id={id}
      tabIndex={id ? -1 : undefined}
      className={`flex flex-wrap items-center gap-x-7 gap-y-4 ${
        center ? 'justify-center' : ''
      } ${id ? 'scroll-mt-4 focus:outline-none' : ''} ${className}`}
    >
      <div className="flex items-center gap-3">
        <AppStoreButton />
        {children}
      </div>
      <TryInBrowser />
    </div>
  );
}

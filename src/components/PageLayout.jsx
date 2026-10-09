import { useEffect } from 'react';
import { Link } from 'react-router-dom';

// Links inside page copy: the app accent, underlined.
const PROSE =
  'space-y-4 text-[16px] leading-[26px] text-muted md:text-[17px] md:leading-7 ' +
  '[&_a]:text-opus-green [&_a]:underline [&_a]:decoration-opus-green/40 [&_a]:underline-offset-[3px] ' +
  '[&_a:hover]:text-opus-green-dim [&_a:hover]:decoration-opus-green-dim ' +
  '[&_strong]:font-medium [&_strong]:text-white';

// The single-column layout for Support, Privacy, Terms and NotFound. The
// Footer is App's, after <main>.
// `docTitle` overrides the browser tab title when the H1 is a sentence.
const PageLayout = ({ title, docTitle, lastUpdated, intro, children }) => {
  useEffect(() => {
    const previous = document.title;
    document.title = `${docTitle || title} · Loop`;
    return () => {
      document.title = previous;
    };
  }, [title, docTitle]);

  return (
    <div className="flex flex-col bg-black text-white">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-24 sm:px-6 md:pb-28 md:pt-32">
        <nav aria-label="Back" className="-ml-1 mb-8 md:mb-10">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 px-1 font-courier text-[12px] uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-white"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
        </nav>

        <header className="mb-12 md:mb-16">
          <h1 className="text-[clamp(2.25rem,1.2rem+4.2vw,4.5rem)] font-medium leading-[1.04] tracking-[-0.03em] text-white">
            {title}
          </h1>
          {lastUpdated && <p className="mt-5 font-courier text-[12px] leading-5 text-white/55">{lastUpdated}</p>}
          {intro && <div className={`mt-6 max-w-[52ch] ${PROSE}`}>{intro}</div>}
        </header>

        <div className="space-y-12">{children}</div>
      </div>
    </div>
  );
};

// A titled block of copy on a PageLayout page.
export const PageSection = ({ title, children }) => (
  <section>
    {title && (
      <h2 className="mb-3 text-[20px] font-medium leading-7 tracking-[-0.01em] text-white md:text-[22px]">{title}</h2>
    )}
    <div className={`max-w-[60ch] ${PROSE}`}>{children}</div>
  </section>
);

export default PageLayout;

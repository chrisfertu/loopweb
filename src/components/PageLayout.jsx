import { Link } from 'react-router-dom';

const PageLayout = ({ title, lastUpdated, subtitle, children }) => (
  <div className="legal-page">
    <div className="max-w-2xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
      {/* Header */}
      <nav aria-label="Breadcrumb" className="mb-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white/90 transition-colors text-sm font-courier"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          opusloop.co
        </Link>
      </nav>

      <main id="main">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-white/60 font-courier">{lastUpdated}</p>
          )}
          {subtitle}
        </div>

        {/* Content */}
        <div className="space-y-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/70">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-white/30" aria-hidden="true">·</span>
          <Link to="/player" className="hover:text-white transition-colors">Web Player</Link>
          <span className="text-white/30" aria-hidden="true">·</span>
          <Link to="/support" className="hover:text-white transition-colors">Help</Link>
          <span className="text-white/30" aria-hidden="true">·</span>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <span className="text-white/30" aria-hidden="true">·</span>
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  </div>
);

export default PageLayout;

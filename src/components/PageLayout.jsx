import { Link } from 'react-router-dom';

const PageLayout = ({ title, lastUpdated, children }) => (
  <div className="legal-page">
    <div className="max-w-2xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
      {/* Header */}
      <nav className="mb-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm font-courier"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          opusloop.co
        </Link>
      </nav>

      {/* Title */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-sm text-white/30 font-courier">{lastUpdated}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {children}
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/25">
          <Link to="/" className="hover:text-white/50 transition-colors">Home</Link>
          <span className="text-white/10">·</span>
          <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          <span className="text-white/10">·</span>
          <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          <span className="text-white/10">·</span>
          <Link to="/support" className="hover:text-white/50 transition-colors">Support</Link>
          <span className="flex-1" />
          <a
            href="https://www.opus.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
          >
            OPUS
          </a>
        </div>
      </footer>
    </div>
  </div>
);

export default PageLayout;

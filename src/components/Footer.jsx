import { Link } from 'react-router-dom';
import { footer } from '../content/copy';

// The one footer, rendered by App after <main> on every route but /player
// (so it is the page's contentinfo landmark). `narrow` matches PageLayout's
// reading column; Home uses the page width. The bottom padding clears the
// iPhone home indicator.
const Footer = ({ narrow = false, className = '' }) => (
  <footer
    className={`relative z-10 border-t border-white/[0.14] font-courier text-[12px] leading-5 text-white/55 ${className}`}
  >
    <div
      className={`mx-auto flex w-full flex-col gap-2 px-4 pt-8 pb-[calc(2rem_+_env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-between md:gap-6 ${
        narrow ? 'max-w-2xl sm:px-6' : 'max-w-[1200px] lg:px-10 xl:px-16'
      }`}
    >
      <p>
        {footer.madeIn}{' '}
        <a
          href={footer.orgUrl}
          className="-mx-1 -my-[15px] inline-block px-1 py-[15px] text-white/75 underline decoration-white/25 underline-offset-[3px] transition-colors hover:text-white"
        >
          {footer.org}
        </a>
        .
      </p>

      <nav aria-label="Footer" className="-mx-2">
        <ul className="flex flex-wrap items-center">
          {footer.links.map((link, i) => (
            <li key={link.to} className="flex items-center">
              {i > 0 && (
                <span aria-hidden="true" className="select-none">
                  ·
                </span>
              )}
              <Link
                to={link.to}
                className="inline-flex min-h-[44px] items-center px-2 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p>{footer.copyright}</p>
    </div>
  </footer>
);

export default Footer;

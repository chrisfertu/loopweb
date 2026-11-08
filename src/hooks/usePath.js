import { useLocation } from 'react-router-dom';

/**
 * Strip trailing slashes so '/player/' (nginx on loop.opus.ro redirects
 * '/player' there) matches '/player'. The root stays '/'.
 */
export function normalizePath(pathname) {
  return (pathname || '/').replace(/\/+$/, '') || '/';
}

/** True for the landing page. '/clip' has its own page (pages/Clip.jsx). */
export function isHomePath(path) {
  return path === '/';
}

/** The current pathname, normalised. */
export function usePath() {
  return normalizePath(useLocation().pathname);
}

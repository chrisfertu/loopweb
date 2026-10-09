// Where the site is served from. Usually the root of its domain; a preview
// build can live under a path (VITE_BASE=/v2/ at build time). Files in
// public/ are addressed through withBase(); routes go through the router,
// which is given the same base.

export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const withBase = (path) => `${BASE}${path}`;

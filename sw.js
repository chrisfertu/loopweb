// Loop service worker (production only; main.jsx registers it).
// Bump CACHE_NAME whenever the caching rules change: activate deletes every
// other cache.
const CACHE_NAME = 'opus-loop-v5';
const ASSET_LIMIT = 40;
// The player's interval bell (media.js). The player fetches it whole and
// decodes it, so it is cached like a shell file and rings offline.
const BELL = '/media/bells/meditation_bell.m4a';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/logo.svg',
  '/images/icon-192.png',
  '/images/icon-512.png',
  BELL,
];
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i;
// Script and stylesheet tags in the built index.html.
const SHELL_ASSET = /(?:src|href)="(\/assets\/[^"]+)"/g;
// Lazy chunks named in an entry bundle: Vite writes import("./X.js") for the
// chunk and "assets/X.js" for the files it preloads with it.
const LAZY_CHUNK = /import\("\.\/([\w.-]+\.js)"\)|"assets\/([\w.-]+\.(?:js|css))"/g;

// The shell, plus the hashed bundles its index.html loads, so an install on a
// first visit works offline without a second online visit. Every file here
// must exist, or install fails (and runs again on the next visit).
async function precacheShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(PRECACHE);
  const shell = await cache.match('/index.html');
  if (!shell) return;
  const html = await shell.text();
  const entries = [...new Set(Array.from(html.matchAll(SHELL_ASSET), (m) => m[1]))];
  if (!entries.length) return;
  await cache.addAll(entries);

  // Pages load as lazy chunks (the player is the installed app's start page),
  // so cache the ones the entry names too. A miss here never fails install.
  const lazy = new Set();
  for (const url of entries.filter((u) => u.endsWith('.js'))) {
    const response = await cache.match(url);
    if (!response) continue;
    for (const m of (await response.text()).matchAll(LAZY_CHUNK)) {
      lazy.add(`/assets/${m[1] || m[2]}`);
    }
  }
  await Promise.all(
    [...lazy].filter((u) => !entries.includes(u)).map((u) => cache.add(u).catch(() => {}))
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell());
  self.skipWaiting();
});

// The page posts the /assets/ files it loaded before this worker took over
// (main.jsx), such as chunks loaded after the first paint. Same origin only.
function isOwnAsset(url) {
  try {
    const u = new URL(url);
    return u.origin === self.location.origin && u.pathname.startsWith('/assets/');
  } catch {
    return false;
  }
}

self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || data.type !== 'cache' || !Array.isArray(data.urls)) return;
  const urls = [...new Set(data.urls.filter(isOwnAsset))];
  if (!urls.length) return;
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urls).then(() => trimAssets(cache)))
      .catch(() => {})
  );
});

// Activate: delete every other cache, then take over open pages.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Keep at most ASSET_LIMIT hashed bundles; cache.keys() is in insertion
// order, so the oldest go first.
async function trimAssets(cache) {
  const keys = await cache.keys();
  const assets = keys.filter((req) => new URL(req.url).pathname.startsWith('/assets/'));
  const excess = assets.length - ASSET_LIMIT;
  for (let i = 0; i < excess; i++) {
    await cache.delete(assets[i]);
  }
}

// Extend the event for background cache writes. Allowed while respondWith()
// is pending; if a browser refuses, the write still runs unguarded.
function keepAlive(event, promise) {
  const guarded = promise.catch(() => {});
  try {
    event.waitUntil(guarded);
  } catch {
    // InvalidStateError: nothing else to do.
  }
}

function isCacheable(response) {
  // Full 200s only: never a 206 partial, an opaque or a redirected response.
  return response && response.status === 200 && response.type === 'basic';
}

// Navigations: network first, so a deploy shows up at once. Each route has
// its own HTML (same bundles, its own canonical and title), so a good response
// is kept under its own path; the root's also refreshes '/index.html'.
async function handleNavigation(event) {
  const { pathname } = new URL(event.request.url);
  try {
    const response = await fetch(event.request);
    const type = response.headers.get('content-type') || '';
    if (isCacheable(response) && type.includes('text/html')) {
      const copy = response.clone();
      const shell = pathname === '/' ? response.clone() : null;
      keepAlive(
        event,
        caches.open(CACHE_NAME).then((cache) =>
          Promise.all([cache.put(pathname, copy), shell && cache.put('/index.html', shell)])
        )
      );
    }
    return response;
  } catch (error) {
    // Offline: this route's page (with or without the trailing slash GitHub
    // Pages redirects to), then the shell, which renders any route.
    const cached =
      (await caches.match(event.request, { ignoreSearch: true, ignoreVary: true })) ||
      (!pathname.endsWith('/') && (await caches.match(`${pathname}/`))) ||
      (await caches.match('/index.html')) ||
      (await caches.match('/'));
    if (cached) return cached;
    throw error;
  }
}

// /assets/*: content-hashed, so cache first.
async function handleAsset(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (isCacheable(response)) {
    const copy = response.clone();
    keepAlive(event, cache.put(event.request, copy).then(() => trimAssets(cache)));
  }
  return response;
}

// Images: stale-while-revalidate.
async function handleImage(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);
  const refresh = fetch(event.request).then((response) => {
    if (isCacheable(response)) {
      keepAlive(event, cache.put(event.request, response.clone()));
    }
    return response;
  });
  if (cached) {
    keepAlive(event, refresh);
    return cached;
  }
  return refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Media is left to the browser: byte ranges (206) cannot be cached safely,
  // and a cached 200 answered to a Range request breaks playback in Safari.
  if (request.headers.has('range')) return;
  if (url.pathname === BELL && request.destination === '') {
    event.respondWith(caches.match(BELL).then((hit) => hit || fetch(request)));
    return;
  }
  if (request.destination === 'video' || request.destination === 'audio') return;
  if (url.pathname.startsWith('/media/') || url.pathname.startsWith('/videos/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(handleAsset(event));
    return;
  }

  if (request.destination === 'image' || IMAGE_EXT.test(url.pathname)) {
    event.respondWith(handleImage(event));
    return;
  }

  // Everything else goes to the network untouched.
});

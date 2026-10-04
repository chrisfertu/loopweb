import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { BASE } from './lib/base'
import './index.css'

// A tab opened before a deploy asks for chunks that no longer exist. Reload
// once to pick up the new build; a second failure within a minute is left to
// surface, so a persistent failure never loops. No storage, no reload.
const PRELOAD_RELOAD_KEY = 'loop.preloadReloadAt';

window.addEventListener('vite:preloadError', (event) => {
  let last = 0;
  try {
    last = Number(window.sessionStorage.getItem(PRELOAD_RELOAD_KEY)) || 0;
    if (Date.now() - last < 60_000) return;
    window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

// The service worker runs in production builds only. In dev it would cache
// Vite's modules and serve stale code, so remove any left from earlier runs.
// Once it is active, it is sent the /assets/ files this page already loaded
// (fetched before it could see them), so an install on a first visit also
// works offline.
if ('serviceWorker' in navigator) {
  // The worker is written for a site at the root of its domain.
  if (import.meta.env.PROD && !BASE) {
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
      navigator.serviceWorker.ready
        .then((reg) => {
          const urls = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .filter((u) => u.startsWith(`${location.origin}/assets/`));
          if (reg.active && urls.length) reg.active.postMessage({ type: 'cache', urls });
        })
        .catch(() => {});
    };
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .catch(() => {});
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((k) => k.startsWith('opus-loop')).map((k) => caches.delete(k))))
        .catch(() => {});
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={BASE || undefined}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

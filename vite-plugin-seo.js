// Fills the SEO placeholders in index.html from src/content/seo.js.
//
// index.html holds tokens such as {{seo.description}} and {{seo.jsonLd}}.
// Every token must resolve and every value must be used, so a typo fails the
// build instead of shipping a literal "{{seo.x}}" to crawlers. The release flag
// (VITE_APP_103_LIVE) is read in vite.config.js and passed in as `live`.
//
// After a build it also writes one copy of index.html per route in ROUTES
// (dist/support/index.html and so on). GitHub Pages has no other file for
// those paths and would answer them with 404.html and an HTTP 404; the copies
// answer with a 200 and carry their own canonical, title and description.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { getSeo, ROUTES, SITE_URL } from './src/content/seo.js';

const TOKEN = /\{\{seo\.([a-zA-Z0-9]+)\}\}/g;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// JSON inside <script>: keep "</script>" and HTML comments from closing it.
const safeJson = (value) =>
  JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

export function valuesFor(live) {
  const seo = getSeo(live);
  return {
    title: escapeHtml(seo.title),
    description: escapeHtml(seo.description),
    canonical: escapeHtml(seo.canonical),
    ogType: escapeHtml(seo.og.type),
    ogUrl: escapeHtml(seo.og.url),
    ogTitle: escapeHtml(seo.og.title),
    ogDescription: escapeHtml(seo.og.description),
    ogSiteName: escapeHtml(seo.og.siteName),
    ogLocale: escapeHtml(seo.og.locale),
    ogImage: escapeHtml(seo.og.image.url),
    ogImageWidth: escapeHtml(seo.og.image.width),
    ogImageHeight: escapeHtml(seo.og.image.height),
    ogImageAlt: escapeHtml(seo.og.image.alt),
    twitterCard: escapeHtml(seo.twitter.card),
    twitterUrl: escapeHtml(seo.twitter.url),
    twitterTitle: escapeHtml(seo.twitter.title),
    twitterDescription: escapeHtml(seo.twitter.description),
    twitterImage: escapeHtml(seo.twitter.image.url),
    twitterImageAlt: escapeHtml(seo.twitter.image.alt),
    jsonLd: safeJson(seo.jsonLd),
  };
}

export function fillSeo(html, live) {
  const values = valuesFor(live);
  const used = new Set();
  const out = html.replace(TOKEN, (match, key) => {
    if (!(key in values)) throw new Error(`vite-plugin-seo: unknown placeholder ${match}`);
    used.add(key);
    return values[key];
  });
  const unused = Object.keys(values).filter((key) => !used.has(key));
  if (unused.length) {
    throw new Error(`vite-plugin-seo: index.html is missing ${unused.map((k) => `{{seo.${k}}}`).join(', ')}`);
  }
  return out;
}

// Replace every occurrence of `from` in html, and fail the build if there is
// none (index.html changed shape and the route page would keep the root's value).
function replaceAll(html, from, to, what, route) {
  const parts = html.split(from);
  if (parts.length < 2) {
    throw new Error(`vite-plugin-seo: no ${what} to replace for ${route}`);
  }
  return parts.join(to);
}

/** The built index.html, rewritten for one route in ROUTES. */
export function routeHtml(html, live, route) {
  const base = valuesFor(live);
  const page = ROUTES[route];
  const url = escapeHtml(`${SITE_URL}${route}`);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  // Canonical, og:url and twitter:url.
  let out = replaceAll(html, `"${base.canonical}"`, `"${url}"`, 'canonical', route);
  // The description, og:description and twitter:description attributes.
  out = replaceAll(out, `content="${base.description}"`, `content="${description}"`, 'description', route);
  // <title> and <meta name="title">.
  out = replaceAll(out, `<title>${base.title}</title>`, `<title>${title}</title>`, 'title', route);
  out = out.split(`content="${base.title}"`).join(`content="${title}"`);
  return out;
}

// Only the root index.html is strict. Other pages (lab.html) pass through
// untouched unless they opt in with a placeholder.
const ROBOTS = /(<meta name="robots" content=")[^"]*(")/;

export default function seoPlugin({ live = false, noindex = false } = {}) {
  let rootIndex = '';
  let outDir = '';
  let command = '';
  return {
    name: 'opus-loop-seo',
    configResolved(config) {
      rootIndex = resolve(config.root, 'index.html');
      outDir = resolve(config.root, config.build.outDir);
      command = config.command;
    },
    // Runs once the bundle is on disk, so the copies carry the final /assets/
    // tags. The dev server serves index.html for every path and needs none.
    async closeBundle() {
      if (command !== 'build') return;
      const html = await readFile(resolve(outDir, 'index.html'), 'utf8');
      for (const route of Object.keys(ROUTES)) {
        const file = resolve(outDir, `.${route}`, 'index.html');
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, routeHtml(html, live, route));
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const isRoot = ctx.filename && resolve(ctx.filename) === rootIndex;
        if (!isRoot && !html.includes('{{seo.')) return html;
        const filled = fillSeo(html, live);
        if (!noindex) return filled;
        if (!ROBOTS.test(filled)) throw new Error('vite-plugin-seo: no robots meta to mark noindex');
        return filled.replace(ROBOTS, '$1noindex, nofollow$2');
      },
    },
  };
}

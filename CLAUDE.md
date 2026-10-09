# Loop Website

Product website and browser meditation player (PWA) for Loop, the meditation timer by OPUS. Lives at opusloop.co.

## Commands

```
npm run dev       # Vite dev server
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build locally
swift scripts/og-image.swift   # Regenerate public/images/og-image.png
node scripts/dump-geometry-fixtures.mjs > "../opusloop/OPUS LoopTests/GeometryShapeFixtures.swift"
                               # Reference points for the iOS port of the shape library
```

Deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to main. Custom domain: `opusloop.co`.

`VITE_APP_103_LIVE` (`.env.production` / `.env.development`) switches copy between the fully free model with an optional tip (iOS 1.0.3+) and the older preset unlock. Every pricing, tip and Watch-first string reads it through `src/content/copy.js` and `src/content/seo.js`.

## Tech Stack

- React 18, Vite 5, React Router 7
- Tailwind CSS 3 (utilities in JSX + semantic classes via `@layer components` in `index.css`)
- Framer Motion for reveals and transitions
- Hand-rolled WebGL for the geometry field (no three.js)
- JavaScript only (no TypeScript). Do not convert files to `.ts`/`.tsx`.
- PWA: `public/manifest.json` + `public/sw.js` (registered in `main.jsx`, production only)
- SPA on GitHub Pages: `public/404.html` redirect pattern; SEO tags injected at build time by `vite-plugin-seo.js`

## Architecture

```
src/
  main.jsx              Entry: createRoot, BrowserRouter, global CSS, service worker
  App.jsx               TimerProvider, routes, Header/MiniPlayer, pickers
  contexts/TimerContext useTimerContext() (ticks every second) and useTimerState() (no ticks)
  hooks/                useTimer, useAudioEngine (mirrors iOS SimpleAudioGenerator), usePath
  geometry/             The field: shapes.js (figures), engine.js (WebGL), field.js
                        (scroll controller), scenes.js (the score), components.jsx
                        (SceneTrigger, GeometryAnchor, PinnedStage), GeometryField.jsx
  pages/home/           One file per landing section
  components/landing/   Reveal, SectionHeading, CtaRow, ListenProvider, and stage/ (the
                        app's own pieces drawn for the web: Digits, icons, PresetStage)
  components/brand/     Wordmark (the "loop" logotype)
  content/              copy.js (every landing string), seo.js, media.js, sounds.js
  lib/motion.js         The visitor's Pause motion preference
public/
  media/                The app's default bell (bells/meditation_bell.m4a), rung by the
                        bells section and the web player
  .well-known/apple-app-site-association, images/, sw.js, manifest.json, 404.html, CNAME
scripts/og-image.swift
```

Routes: `/` and `/clip/*` (Home), `/player` (full-screen player, no Header/MiniPlayer), `/support`, `/privacy`, `/terms`, `*` (NotFound).

## The geometry field

- One fixed canvas behind Home draws several thousand points that morph from figure to figure as the page scrolls.
- A section registers a scene with `<SceneTrigger scene={CONFIG}>`; the scene arrives when the trigger's top crosses a line (70% of the way down the viewport by default) and the field then morphs into it on the clock, easing out over a couple of seconds (off at once, the last grains trailing in), so a finished figure is on screen for nearly all of the scroll. Nothing is scrubbed by scroll position: text that changes with a figure crossfades on the clock too. Figures are placed on `<GeometryAnchor name="…">` elements (one plate unit = half the anchor's shorter side). Pinned sequences use `<PinnedStage>`.
- Scene configs are module constants in `geometry/scenes.js`; interactive sections derive copies with `useMemo` (`listening()`, `withBell()`, `withNode()`, `withCloud()`, `withCutout()`). A Listen tap takes over the figure (whatever the scroll position) until the visitor scrolls to another step; what plays is always what is drawn.
- Frequencies are shown as geometry (petal counts, waves), never as flicker. Keep whole-field brightness changes slow and small.
- The hero is the app's mark (`logo:1`), far larger than its anchor and loosening toward its edge (`ether`), with a play triangle at its centre that leads to the timer. Live figures, redrawn every frame by the field: the timer's clock (`geometry/clock.js`), the interval bells (`intervals.js`, which reports each bell it reaches through `onFieldEvent`), the Watch's pulse (`pulse.js`) and the flowing spiral (`flowspiral.js`, the app's default background, behind the web player). The sounds figure is a seed head with shapes left empty (`cutouts.js`).
- Home, in order: hero, timer, sound (silence, noise, binaural beats), your sounds, interval bells, the Apple ecosystem, presets (seven circles that fill with presets one by one, on the clock), privacy, free.
- On phones a figure sits above its section's title or between its paragraphs, never last in a section; only the page's final figure (the mark) ends a section.
- Reduced motion: static figures and crossfades inside the engine. The header's Pause motion toggle stops all time-driven motion and video.

## Design Rules

- Name: the product is **Loop**. OPUS is the company ("Made in Romania by OPUS."). Never "OPUS Loop" in site copy or metadata. The logotype is lowercase "loop" with the two o's drawn as one ∞ (`components/brand/Wordmark.jsx`).
- Dark theme, `#000` background. Visual parity with the iOS app.
- DM Sans for text, Courier Prime for labels and captions, rounded digits (`font-rounded`, SF Pro Rounded) for timers, like the app's odometer.
- Accent: `opus-green` = `#7A9B58` (the app's accentGreen) for links and active states. `loop-glow` `#64D262` and `loop-core` `#14E468` are for geometry and the mark only, never text.
- No phone frames and no screenshots: the app's screens are rebuilt in HTML (`components/landing/stage/`) from the app's own assets (its icons and its default bell), showing what the app shows. No third-party album art, no invented numbers. No captions that describe the geometry.
- `useReducedMotion` respected for all motion. Framer Motion for UI transitions.
- Honest, simple copy. Anti-marketing language. No em dashes. No efficacy claims, no esoteric names for the geometry; captions describe plain math.

## Conventions

- Functional components only. Hooks for state and side effects.
- Default exports for page, section and layout components. Named exports for hooks and context. Constants live in `.js` files, not `.jsx`.
- Relative imports from `src/` (no path aliases configured).
- Components on Home read `useTimerState()`, not the ticking context.
- Sections use `overflow-clip`, never `overflow-hidden` (it breaks sticky).
- `react-icons` is declared as a dependency but unused. Do not import it without asking.

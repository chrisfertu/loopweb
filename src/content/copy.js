// Every user-facing string on the landing page (design spec section 2).
//
// Sections read from here and never hard-code copy, so the release gate and
// the copy rules live in one place:
//   - No em dashes or en dashes. Ranges use "to". Apostrophes are typographic (’).
//   - No efficacy claims and no esoteric names.
//   - Never deny in-app purchases (Guideline 2.3.1(a)); say "nothing paywalled".
//   - Brainwave labels are the app's own strings: "2Hz - Sleep" and so on.
//
// Release gate (spec 2.0.3). Lines marked [103] are only true once iOS 1.0.3
// (free model, tip, Watch-first sessions, heart rate kept out of iCloud) is on
// the App Store. They resolve through APP_103_LIVE, which reads the build flag
// VITE_APP_103_LIVE ('true' selects the [103] line, anything else the fallback
// that is true for 1.0.2). A [103]-only line with no fallback is null when the
// flag is off: render it only when it is truthy.
//
// Shape (every value is a string unless noted):
//
//   APP_103_LIVE                  boolean
//   APP_STORE_URL                 string
//   common      { appName, appStoreUrl, tryInBrowser,
//                 playerPath, requirements, storeName, skipLink,
//                 header { support, getTheApp, pauseMotion, resumeMotion, home },
//                 listen { label, stop, hint, sessionPlaying, openPlayer,
//                          playing(name) => string, stopped } }
//   stage       { play, timerAlt, shapesAlt }
//   hero        { eyebrow, h1, body, micro }
//   timer       { eyebrow, h2, body, line }
//   sounds      { eyebrow, h2, body, footnote }
//   sound       { eyebrow, h2, body, micro, choicesLabel, hint,
//                 groups [{ key, name, line, honest?, options [{ type,
//                   frequency?, label, short }] }], playLabel(name), stopLabel(name) }
//   bells       { eyebrow, h2, body, uses [3] (minutes => string), every
//                 [{ minutes, bells, below }], everyAbove, everyLabel,
//                 shorter, longer, micro }
//   devices     { watch { eyebrow, h2, body, activities [{ key, name }],
//                         nextLabel },
//                 everywhere { h2, body, surfaces [6], prevLabel, nextLabel,
//                              requirements } }
//   presets     { eyebrow, h2, body, examples [{ key, name, icon,
//                 line }] (7), showLabel(name), listLabel }
//   privacy     { eyebrow, h2, body, exception, closing, website }
//   free        { eyebrow, h2, body, tip (null without 1.0.3), requirements,
//                 storeName, coffee { label, url } }
//   loop        { languagesLabel, languages [{ name, lang }], tagline }
//   footer      { madeIn, org, orgUrl, links [{ label, to }], copyright }
//   COPY        all of the above, keyed by section (also the default export)
//
// Eyebrows ("01  TIMER") keep the spec's two spaces: render them with
// white-space: pre (or pre-wrap).

export const APP_103_LIVE = import.meta.env.VITE_APP_103_LIVE === 'true';

const pick = (live, fallback) => (APP_103_LIVE ? live : fallback);

export const APP_STORE_URL = 'https://apps.apple.com/app/id6756740657';

const REQUIREMENTS = 'iPhone and iPad with iOS 18 or later. Apple Watch with watchOS 11 or later.';

// ── Shared ───────────────────────────────────────────────────

export const common = {
  appName: 'Loop',
  appStoreUrl: APP_STORE_URL,
  tryInBrowser: 'Try it in your browser',
  playerPath: '/player',
  requirements: REQUIREMENTS,
  // Pending an owner decision (spec 6.6, item 4).
  storeName: 'On the App Store as Loop - Meditation & Focus.',
  skipLink: 'Skip to download',
  header: {
    support: 'Support',
    getTheApp: 'Get the app',
    pauseMotion: 'Pause motion',
    resumeMotion: 'Resume motion',
    home: 'Loop, home',
  },
  // Listen buttons on binaural stops and noise clouds (spec 5.1).
  listen: {
    label: 'Listen',
    stop: 'Stop',
    hint: 'Binaural beats need headphones.',
    sessionPlaying: 'A session is playing.',
    openPlayer: 'Open the player.',
    playing: (name) => `Playing ${name}.`,
    stopped: 'Stopped.',
  },
};

// ── 2.1 hero ─────────────────────────────────────────────────

export const hero = {
  eyebrow: 'Loop', // accessible name of the hero wordmark
  h1: 'Your rituals, without a monthly sacrifice.',
  body: 'A simple timer and sound player for meditation, prayer, or whatever centers you.',
  micro: pick(
    'Free for iPhone and iPad, with an Apple Watch app. Nothing paywalled. No subscription. No account.',
    'Free to download for iPhone and iPad, with an Apple Watch app. No subscription. No account.',
  ),
};

// ── 2.2 timer ────────────────────────────────────────────────

export const timer = {
  eyebrow: '01  JUST A TIMER',
  h2: 'A tool, not a service.',
  body: 'You probably don’t need a subscription to an overwhelming catalog of guides, nature sounds and daily questionnaires for your silent 10 minutes a day, so Loop was designed to be just a simple tool to track your time and play your favorite background sound or guide.',
  // The second paragraph, after the figure on phones.
  line: 'Your iPhone can already do everything you need. Loop just makes it nicer, at no extra cost.',
};

// ── 2.3 sounds ───────────────────────────────────────────────

export const sounds = {
  eyebrow: '03  YOUR SOUNDS',
  h2: 'Bring your own teacher.',
  body: 'Import guided meditations, your teacher’s recordings, mantras or music. From Files, from your music library, or from Apple Music.* Pick a folder and it becomes a playlist. Each track can loop for a whole session or play once.',
  footnote: '* Playing tracks from Apple Music requires an Apple Music subscription.',
};

// ── Stages: pictures of the app, drawn on the page ──────────
// Accessible names for the figures and the pieces of the app's UI that are
// rebuilt in HTML. What they show is what the app shows.

export const stage = {
  play: 'Go on to the timer',
  timerAlt: 'A clock counting up from zero, inside sixty second marks that leave one by one and come back.',
  shapesAlt: 'What you can add: an audio file, a recording of birdsong, a handpan, a playlist from Apple Music.',
};

// ── 2.4 sound ────────────────────────────────────────────────
// Silence first; then the sounds the app makes as it plays. `type` and
// `frequency` are the audio engine's (useAudioEngine), `label` the app's
// own name for each.

export const sound = {
  eyebrow: '02  SOUND',
  h2: 'Silence is the goal. Sound is there to make room for it.',
  body: 'Most sessions need nothing at all. When the room is loud or your thoughts won’t settle, Loop can play a sound to absorb the noise.',
  micro: 'Made on your device while it plays. Nothing to download, nothing to stream.',
  choicesLabel: 'Sounds',
  hint: 'Tap one to hear it.',
  groups: [
    {
      key: 'silence',
      name: 'Silence',
      line: 'Only the timer. Music or a podcast from another app keeps playing.',
      options: [],
    },
    {
      key: 'noise',
      name: 'Noise',
      line: 'A steady hush that covers what is around you.',
      options: [
        { type: 'white', label: 'White Noise', short: 'White' },
        { type: 'pink', label: 'Pink Noise', short: 'Pink' },
        { type: 'brown', label: 'Brown Noise', short: 'Brown' },
        { type: 'dark', label: 'Dark Noise', short: 'Dark' },
      ],
    },
    {
      key: 'tones',
      name: 'Binaural beats',
      line: 'A slightly different tone in each ear, heard as a slow pulse. Use headphones.',
      honest: 'Some people find they help them settle. The research is mixed, so try them and keep what works.',
      options: [
        { type: 'binaural', frequency: 2, label: '2Hz - Sleep', short: '2 Hz' },
        { type: 'binaural', frequency: 6, label: '6Hz - Meditation', short: '6 Hz' },
        { type: 'binaural', frequency: 10, label: '10Hz - Relax', short: '10 Hz' },
        { type: 'binaural', frequency: 16, label: '16Hz - Focus', short: '16 Hz' },
      ],
    },
  ],
  playLabel: (name) => `Play ${name}`,
  stopLabel: (name) => `Stop ${name}`,
};

// ── 2.6 bells ────────────────────────────────────────────────
// Interval bells: what they are for, in plain words.

const everyPhrase = (m) => (m === 1 ? 'every minute' : `every ${m} min`);

export const bells = {
  eyebrow: '04  INTERVAL BELLS',
  h2: 'Know where you are without opening your eyes.',
  body: 'Set a bell to ring every few minutes, from every minute to every two hours. It can help you tell how far along you are without checking the time.',
  // Under the figure, one at a time, with the interval that is set.
  uses: [
    (m) => `Come back to the breath ${everyPhrase(m)}, if your mind has wandered off.`,
    (m) => `Check your posture on a long sit ${everyPhrase(m)}.`,
    (m) => `Move on to the next part ${everyPhrase(m)}: a body scan, walking, the other side.`,
  ],
  // The interval, set in the middle of the figure (a thirty minute sit, so
  // `bells` of them go round it).
  every: [
    { minutes: 1, bells: 30, below: 'minute' },
    { minutes: 5, bells: 6, below: 'minutes' },
    { minutes: 10, bells: 3, below: 'minutes' },
    { minutes: 15, bells: 2, below: 'minutes' },
  ],
  everyAbove: 'Every',
  everyLabel: 'Interval in minutes',
  shorter: 'Ring more often',
  longer: 'Ring less often',
  micro: 'Seven bells to choose from, at the volume you like. With an Apple Watch, each bell can tap your wrist too, or only tap.',
};

// ── 2.7 presets ──────────────────────────────────────────────
// The figure fills with presets one at a time. The app starts with one
// preset (ten minutes, silence); every other one is made by the person
// using it, so the rest are examples of what someone might add. Presets are
// free: as many as you like.

export const presets = {
  eyebrow: '06  PRESETS',
  h2: 'One setup for each thing you do.',
  body: 'All settings of a session are easy to change in a few seconds, but you can save multiple configurations for each of your habits or moods. You can also customize each preset with your own video or image backgrounds.',
  // The seven icons on the figure, in the order it adds them (presetSlot):
  // the one the app starts with, then six someone might make. `line` says
  // what each is set to; `icon` is a stage icon.
  examples: [
    { key: 'start', name: 'Meditation', icon: 'meditation', line: '10 min · Silence' },
    { key: 'focus', name: 'Focus', icon: 'pomodoro', line: '90 min · 16Hz - Focus · a bell every 10 min' },
    { key: 'sleep', name: 'Sleep', icon: 'sleep', line: 'No end · Brown Noise' },
    { key: 'walk', name: 'Walk', icon: 'walk', line: '30 min · Silence · a bell every 5 min' },
    { key: 'dance', name: 'Dance', icon: 'dance', line: 'No end · your own playlist' },
    { key: 'breathe', name: 'Breathe', icon: 'breathe', line: '20 min · Pink Noise' },
    { key: 'evening', name: 'Evening', icon: 'evening', line: '15 min · Silence · Thin Bell' },
  ],
  showLabel: (name) => `Show ${name}`,
  listLabel: 'Example presets',
};

// ── 2.9 devices ──────────────────────────────────────────────

export const devices = {
  watch: {
    eyebrow: '05  THE APPLE ECOSYSTEM',
    h2: 'Mind & Body',
    body: 'The Loop companion app for the Apple Watch can also track your heart rate during your sessions. Your sessions can be saved in Apple Health as mindful minutes, a workout, both or neither.',
    // What the figure shows, in turn (DevicesSection sets its pace).
    activities: [
      { key: 'sit', name: 'Sitting' },
      { key: 'walk', name: 'Walking' },
      { key: 'dance', name: 'Dancing' },
    ],
    nextLabel: 'Show the next activity',
  },
  everywhere: {
    h2: 'Where you already look.',
    body: 'A running session shows on your Lock Screen and in the Dynamic Island, with pause, mute and stop. Start one from Control Center, Siri, Shortcuts or a Watch complication. iCloud keeps presets and history the same on iPhone and iPad.',
    // The outlines the figure draws, in turn (surface:0 to surface:3).
    surfaces: ['Dynamic Island', 'Lock Screen', 'Control Center', 'Siri', 'Shortcuts', 'Apple Watch'],
    prevLabel: 'Previous place',
    nextLabel: 'Next place',
    requirements: REQUIREMENTS,
  },
};

// ── 2.10 privacy ─────────────────────────────────────────────

export const privacy = {
  eyebrow: '07  PRIVACY',
  h2: 'No account. No ads.',
  body: 'Your presets, sounds and history stay on your device and in your own iCloud. OPUS runs no servers for your data.',
  exception: 'The app sends anonymous usage statistics through TelemetryDeck, using a random install identifier that is hashed before it is sent. Never health data, never the names of what you play. They are on by default, and one switch in App Settings turns them off.',
  closing: 'We don’t know who you are. We prefer it that way.',
  website: 'This website uses no analytics and sets no cookies.',
};

// ── 2.11 free ────────────────────────────────────────────────

export const free = {
  eyebrow: '08  FREE',
  h2: pick('Free to download. Yours to keep.', 'Free to download.'),
  body: pick(
    'Every feature and every preset, for everyone. No subscription, no trial, no account.',
    'No subscription, no trial, no account. The timer, every sound and your imports are included. One preset is free; more presets are a one-time purchase.',
  ),
  tip: pick('If it earns a place in your day, there is an optional tip in App Settings. It unlocks nothing and changes nothing.', null),
  requirements: REQUIREMENTS,
  storeName: common.storeName,
  coffee: { label: 'Buy me a coffee', url: 'https://buymeacoffee.com/opusculum' },
};

// ── 2.12 loop ────────────────────────────────────────────────

export const loop = {
  languagesLabel: 'Available in 14 languages',
  // Verbatim from the current site. "Telugu" is written in English here, so it
  // carries no lang of its own (lang="te" would ask for a Telugu voice).
  languages: [
    { name: 'English', lang: 'en' },
    { name: 'Deutsch', lang: 'de' },
    { name: 'Español', lang: 'es' },
    { name: 'Français', lang: 'fr' },
    { name: 'Nederlands', lang: 'nl' },
    { name: 'Norsk', lang: 'nb' },
    { name: 'Suomi', lang: 'fi' },
    { name: 'Filipino', lang: 'fil' },
    { name: 'Magyar', lang: 'hu' },
    { name: 'Română', lang: 'ro' },
    { name: 'Telugu', lang: undefined },
    { name: '日本語', lang: 'ja' },
    { name: '简体中文', lang: 'zh-Hans' },
    { name: '繁體中文', lang: 'zh-Hant' },
  ],
  tagline: 'No philosophy imposed. No tradition assumed.',
};

// ── Footer (shared by Home and PageLayout) ───────────────────

export const footer = {
  madeIn: 'Made in Romania by',
  org: 'OPUS',
  orgUrl: 'https://opus.ro',
  links: [
    { label: 'Support', to: '/support' },
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Web player', to: '/player' },
  ],
  copyright: '© 2026 OPUS',
};

export const COPY = {
  common,
  stage,
  hero,
  timer,
  sounds,
  sound,
  bells,
  presets,
  devices,
  privacy,
  free,
  loop,
  footer,
};

export default COPY;

// Search and social metadata for index.html (design spec 6.4).
//
// This module runs in Node (vite-plugin-seo.js imports it from vite.config.js),
// so it must stay free of import.meta.env and browser APIs. The release flag is
// passed in: getSeo(live) with live = VITE_APP_103_LIVE === 'true'.
//
// Copy rules: no em or en dashes; never deny in-app purchases (App Store
// Guideline 2.3.1(a)), "nothing paywalled" is the approved phrasing.

// Canonical host. Owner decision pending (opusloop.co or loop.opus.ro).
export const SITE_URL = 'https://opusloop.co';
export const APP_STORE_URL = 'https://apps.apple.com/app/id6756740657';

const DESCRIPTION =
  'A free meditation timer for iPhone, iPad and Apple Watch. Binaural beats, noise, bells and your own audio. No subscription, no account.';

const LD_DESCRIPTION =
  'A free meditation timer and sound player for iPhone, iPad and Apple Watch, with binaural beats, noise, bells and your own audio. No subscription, no account.';

// The landing page's and the player's titles. App.jsx also sets them after a
// client-side navigation, since each route's HTML starts with its own title.
export const HOME_TITLE = 'Loop, a meditation timer for iPhone, iPad and Apple Watch';
export const PLAYER_TITLE = 'Loop web player, a free meditation timer in your browser';

// Every other route is a copy of index.html written at build time
// (vite-plugin-seo.js), so GitHub Pages answers it with a 200 and its own
// canonical, title and description. Keys are the paths as served, with the
// trailing slash GitHub Pages redirects to.
export const ROUTES = {
  '/player/': {
    title: PLAYER_TITLE,
    description:
      'A free meditation timer that runs in your browser, with binaural beats, noise, an interval bell and an audio file of your own. No account.',
  },
  '/support/': {
    title: 'Support · Loop',
    description:
      'Answers to common questions about Loop: presets, sounds, bells, Apple Health, Apple Watch, price and privacy.',
  },
  '/privacy/': {
    title: 'Privacy Policy · Loop',
    description:
      'How Loop handles your data. No account and no ads. Your data stays on your device and in your own iCloud, and anonymous usage statistics can be turned off.',
  },
  '/terms/': {
    title: 'Terms of Service · Loop',
    description: 'The terms of service for Loop, a meditation timer and sound player for iPhone, iPad and Apple Watch.',
  },
};

const faq = (name, text) => ({
  '@type': 'Question',
  name,
  acceptedAnswer: { '@type': 'Answer', text },
});

export function getSeo(live) {
  const pick = (a, b) => (live ? a : b);

  const title = HOME_TITLE;
  const socialTitle = 'Loop, a free meditation timer';
  const image = {
    url: `${SITE_URL}/images/og-image.png`,
    width: 1200,
    height: 630,
    alt: 'The Loop wordmark, its two o’s drawn as one infinity sign, beside a thin green ring around the app icon, on black. Your rituals, without a monthly sacrifice.',
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'Loop',
      alternateName: 'Loop - Meditation & Focus',
      description: LD_DESCRIPTION,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'iOS 18 or later, watchOS 11 or later',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      downloadUrl: APP_STORE_URL,
      installUrl: APP_STORE_URL,
      featureList: [
        'Meditation and focus timer, from one minute to twenty-four hours, or open-ended',
        'Binaural beats at 2, 6, 10 and 16 Hz, generated on the device',
        'White, pink, brown and dark noise, and Silence',
        'Seven bells for the start and the end, with an optional interval bell',
        'Import from Files, your music library and Apple Music',
        'Presets with their own sound, bell, background and icon',
        'Apple Watch app with heart rate',
        'Apple Health mindful minutes',
        'iCloud sync across iPhone and iPad',
        pick(
          'Free, nothing paywalled; an optional tip that unlocks nothing',
          'Free to download; more presets are a one-time purchase',
        ),
      ],
      author: { '@type': 'Organization', name: 'OPUS', url: 'https://opus.ro' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        faq(
          'Is Loop free?',
          pick(
            'Yes. Every feature is included, unlimited presets too. There is no subscription and no account. If you want to, you can leave an optional tip in App Settings. It unlocks nothing.',
            'Yes, to download. The timer, every sound and your imports are included. One preset is free; more presets are a one-time purchase.',
          ),
        ),
        faq(
          'How does Loop work?',
          'Choose a duration, pick a sound (binaural beats, noise, Silence or your own audio) and tap play. If you like, add one of seven bells to ring at the start and the end, and at an interval.',
        ),
        faq(
          'Does Loop have a subscription?',
          pick('No. There is no subscription and nothing is paywalled.', 'No. There is no subscription.'),
        ),
        faq(
          'Does Loop track my data?',
          'There are no accounts and no ads, and OPUS runs no servers for your data. The app sends anonymous usage statistics through TelemetryDeck, using a random install identifier that is hashed before it is sent. Health data and the names of your sounds are never sent. You can turn this off in App Settings.',
        ),
        faq(
          'Can I use Loop without downloading the app?',
          `Yes. Visit ${SITE_URL.replace('https://', '')}/player for a free web timer with binaural beats, noise, an interval bell and your own audio file. It works directly in your browser.`,
        ),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Loop',
      url: SITE_URL,
      description: DESCRIPTION,
    },
  ];

  return {
    title,
    description: DESCRIPTION,
    canonical: `${SITE_URL}/`,
    og: {
      type: 'website',
      url: `${SITE_URL}/`,
      title: socialTitle,
      description: DESCRIPTION,
      siteName: 'Loop',
      locale: 'en_US',
      image,
    },
    twitter: {
      card: 'summary_large_image',
      url: `${SITE_URL}/`,
      title: socialTitle,
      description: DESCRIPTION,
      image,
    },
    jsonLd,
  };
}

export default getSeo;

// Shared destinations for the landing CTAs.

import { withBase } from '../../lib/base';

export const APP_STORE_URL = 'https://apps.apple.com/app/id6756740657';
export const APP_STORE_LABEL = 'Download Loop on the App Store';
// The official black "Download on the App Store" badge, kept unmodified.
export const APP_STORE_BADGE_SRC = withBase('/images/app-store-badge.svg');
export const PLAYER_PATH = '/player';

// The shared focus ring: 2px accent at a 2px offset.
export const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-opus-green';

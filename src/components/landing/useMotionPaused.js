import { useSyncExternalStore } from 'react';
import { isMotionPaused, subscribeMotion } from '../../lib/motion';

// The visitor's "Pause motion" choice (header toggle), as a React value.
export function useMotionPaused() {
  return useSyncExternalStore(subscribeMotion, isMotionPaused, () => false);
}

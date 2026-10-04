import { useEffect, useState } from 'react';

// Shared timing for text reveals (spec 2.0.4).
export const REVEAL_EASE = [0.22, 1, 0.36, 1];
export const REVEAL_DURATION = 0.7;
export const REVEAL_REDUCED_DURATION = 0.2;
export const REVEAL_STAGGER = 0.08;

// Accepts seconds (Framer convention) or milliseconds: values above 5 are
// treated as milliseconds, so delay={0.16} and delay={160} mean the same.
export function toSeconds(value, fallback = 0) {
  if (value == null || value === false) return fallback;
  if (value === true) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n > 5 ? n / 1000 : n;
}

// True once the element has been at least `amount` in view. Blocks taller
// than the viewport also count once their top has passed (1 - amount) of the
// viewport height, so they are never stuck hidden. Fires once.
export function useRevealOnce(ref, amount = 0.3) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const done = () => setShown(true);
    const byRatio = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= amount - 0.001)) done();
      },
      { threshold: amount },
    );
    const byTop = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) done();
      },
      { rootMargin: `0px 0px -${Math.round(amount * 100)}% 0px`, threshold: 0 },
    );
    byRatio.observe(el);
    byTop.observe(el);
    return () => {
      byRatio.disconnect();
      byTop.disconnect();
    };
  }, [ref, amount, shown]);

  return shown;
}

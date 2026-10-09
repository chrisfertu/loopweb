import { memo, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// Full-viewport canvas behind the page. Memoised and free of context
// subscriptions, so the timer's once-a-second re-render never touches it.
//
// The canvas is created inside the effect: a WebGL context that was lost on
// unmount cannot be reused, and StrictMode mounts effects twice in dev.
const GeometryField = memo(function GeometryField() {
  const hostRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || failed) return undefined;
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    let stop = null;
    let cancelled = false;
    // The controller and WebGL renderer load as their own chunk, so the rest
    // of the site never downloads them.
    import('./field')
      .then(({ startField }) => {
        if (cancelled) return;
        stop = startField(canvas, {
          reducedMotion: !!prefersReduced,
          onFail: () => setFailed(true),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (stop) stop();
      canvas.remove();
    };
  }, [prefersReduced, failed]);

  return (
    <div ref={hostRef} className="geometry-field" aria-hidden="true">
      {failed && <div className="geometry-field-fallback" />}
    </div>
  );
});

export default GeometryField;

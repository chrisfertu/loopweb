import { useEffect, useRef } from 'react';
import { registerAnchor, registerScene, unregisterScene, updateScene } from './registry';

// Attach the returned ref to an element. When that element's top rises
// through the scene's window (90% → 50% of the viewport by default), the
// field morphs into the shape described by `config`.
// Keep `config` referentially stable (module constant or useMemo); a new
// object re-targets the scene and animates to it.
export function useGeometryScene(config) {
  const ref = useRef(null);
  const idRef = useRef(0);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!ref.current || !configRef.current) return undefined;
    const id = registerScene(ref.current, configRef.current);
    idRef.current = id;
    return () => {
      unregisterScene(id);
      idRef.current = 0;
    };
  }, []);

  useEffect(() => {
    if (idRef.current && config) updateScene(idRef.current, config);
  }, [config]);

  return ref;
}

// Attach the returned ref to the element a figure should sit on. Scenes name
// it with `anchor: '<name>'`; one plate unit is half its shorter side.
export function useGeometryAnchor(name) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !name) return undefined;
    return registerAnchor(name, ref.current);
  }, [name]);
  return ref;
}

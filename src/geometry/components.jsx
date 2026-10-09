import { useEffect, useRef, useState } from 'react';
import { useGeometryAnchor, useGeometryScene } from './useGeometryScene';

// A block of the page that brings its figure in when it scrolls into view.
export function SceneTrigger({ scene, as: Tag = 'div', children, ...rest }) {
  const ref = useGeometryScene(scene);
  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}

// The element a figure is drawn on. Usually empty or holding a device frame;
// give it a size (square is best) with CSS.
export function GeometryAnchor({ name, as: Tag = 'div', children, ...rest }) {
  const ref = useGeometryAnchor(name);
  return (
    <Tag ref={ref} data-anchor={name} {...rest}>
      {children}
    </Tag>
  );
}

function StepSpacer({ scene, top, height }) {
  const ref = useGeometryScene(scene);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, width: 1, top, height, pointerEvents: 'none' }}
    />
  );
}

// A tall section whose stage stays pinned while the visitor scrolls through
// `steps`. The section itself brings in `entry`; each step then arrives as
// its spacer's top crosses 90% of the viewport (the middle of its window).
//
// children: (activeStep) => stage content. activeStep is -1 before the first
// step, then 0..steps.length-1; it changes at the same line as the figure.
//
// Heights use svh so mobile address bars do not change the pin length.
export function PinnedStage({
  entry,
  steps,
  lead = 25,
  stepHeight = 40,
  className = '',
  stageClassName = '',
  id,
  children,
  ...rest
}) {
  const sectionRef = useGeometryScene(entry);
  const [active, setActive] = useState(-1);
  const stepsRef = useRef(steps.length);
  stepsRef.current = steps.length;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      // The section is (100 + lead + n·step) svh tall, which gives 1svh in px.
      const svh = el.offsetHeight / (100 + lead + stepsRef.current * stepHeight);
      const scrolled = -el.getBoundingClientRect().top;
      // Step i's spacer starts at 100svh + lead + i·step; it is "active" once
      // its top has passed 90% of the viewport, where its figure arrives.
      let next = -1;
      for (let i = 0; i < stepsRef.current; i++) {
        const spacerTop = (100 + lead + i * stepHeight) * svh - scrolled;
        if (spacerTop <= 0.9 * vh) next = i;
      }
      setActive((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionRef, lead, stepHeight]);

  const total = `calc(100svh + ${lead + steps.length * stepHeight}svh)`;

  return (
    <section
      ref={sectionRef}
      id={id}
      className={className}
      style={{ position: 'relative', height: total }}
      {...rest}
    >
      <div className={stageClassName} style={{ position: 'sticky', top: 0, height: 'calc(100svh - var(--mini-h, 0px))' }}>
        {children(active)}
      </div>
      {steps.map((scene, i) => (
        <StepSpacer
          key={scene.id || i}
          scene={scene}
          top={`calc(${100 + lead + i * stepHeight}svh)`}
          height={`${stepHeight}svh`}
        />
      ))}
    </section>
  );
}

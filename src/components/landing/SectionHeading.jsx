// SectionHeading: eyebrow, title and body for a landing section, revealed
// line by line (80ms stagger) with <Reveal>.
//
// Props
// - eyebrow: slate text, e.g. "03  BUILT-IN SOUND" (two spaces are kept).
//   Courier Prime Bold 11, uppercase, tracking 0.2em, white at 55%.
// - title: the heading text or node.
// - as: heading level, 'h2' (default) or 'h1' (hero). 'h3' is also accepted
//   and uses the H2 scale.
// - id: id for the heading (use it for aria-labelledby on the section).
// - body: a string (rendered as <p>) or a node (rendered in a <div>).
//   17/28 (16/26 on phones), text-muted, max 52ch.
// - large: a larger body, 20/31 (18/28 on phones), for the hero.
// - children: anything after the body (CTAs, micro lines). Revealed as one
//   more line, 32px below the body.
// - align: 'left' (default) or 'center'.
// - className: classes for the wrapper.
// - titleClassName, bodyClassName: extra classes for those lines.
// - delay: before the first line (seconds, or ms when above 5).

import Reveal from './Reveal';

const EYEBROW =
  'whitespace-pre-wrap font-courier text-[11px] font-bold uppercase leading-4 tracking-[0.2em] text-white/55';

const TITLE = {
  h1: 'text-[clamp(2.25rem,1.2rem+4.2vw,4.5rem)] leading-[1.04] tracking-[-0.03em] font-medium',
  h2: 'text-[clamp(1.75rem,1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.025em] font-medium',
};

const BODY = 'text-muted max-w-[52ch] text-pretty';
const BODY_SIZE = {
  base: 'text-[16px] leading-[26px] sm:text-[17px] sm:leading-[28px]',
  large: 'text-[18px] leading-[28px] sm:text-[20px] sm:leading-[31px]',
};

export default function SectionHeading({
  eyebrow,
  title,
  as = 'h2',
  id,
  body,
  children,
  align = 'left',
  className = '',
  titleClassName = '',
  bodyClassName = '',
  large = false,
  delay = 0,
}) {
  const center = align === 'center';
  const Title = as === 'h1' || as === 'h3' ? as : 'h2';
  const scale = Title === 'h1' ? TITLE.h1 : TITLE.h2;
  const bodyClass = `${BODY} ${large ? BODY_SIZE.large : BODY_SIZE.base} ${center ? 'mx-auto' : ''} ${bodyClassName}`;

  return (
    <Reveal stagger delay={delay} className={`${center ? 'text-center' : ''} ${className}`}>
      {eyebrow ? <p className={`mb-4 ${EYEBROW}`}>{eyebrow}</p> : null}
      {title ? (
        <Title id={id} className={`text-balance text-white ${scale} ${center ? 'mx-auto' : ''} ${titleClassName}`}>
          {title}
        </Title>
      ) : null}
      {body ? (
        typeof body === 'string' ? (
          <p className={`mt-5 ${bodyClass}`}>{body}</p>
        ) : (
          <div className={`mt-5 ${bodyClass}`}>{body}</div>
        )
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </Reveal>
  );
}

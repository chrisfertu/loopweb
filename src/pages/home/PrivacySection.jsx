// 09  PRIVACY (spec 2.10): the enclosure.
//
// One centred column, max 560px. The figure sits on a 280px square above the
// text: your device inside your iCloud, a closed circle, and one dotted line
// that comes in, meets the circle and leaves again.
//
// Desktop (lg+): each leg of the line is 1.2 plate units long. The entering
// leg starts above the square, so the section's top padding makes room for
// it; the line's label is written just past the end of the leaving leg, to
// the right of the square. Below lg the legs are shorter (0.5) and stay
// close to the square, and the label is a small legend under the figure.

import { memo } from 'react';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { PRIVACY } from '../../geometry/scenes';
import { ricochet } from '../../geometry/nodes';
import { privacy as COPY } from '../../content/copy';
import SectionHeading from '../../components/landing/SectionHeading';
import Reveal from '../../components/landing/Reveal';

// The desktop line, in plate units (y up): 1 unit is half the square, so a
// point (x, y) is at left 50% + x * 50%, top 50% - y * 50%. The label starts
// 10px past the line's end, centred on it.
const LINE = ricochet(1.2);
const LABEL_STYLE = {
  left: `calc(${(50 + LINE.to[0] * 50).toFixed(2)}% + 10px)`,
  top: `${(50 - LINE.to[1] * 50).toFixed(2)}%`,
  transform: 'translate(0, -50%)',
};

const PARA = 'mx-auto max-w-[52ch] text-[16px] leading-[26px] sm:text-[17px] sm:leading-[28px]';

function PrivacySection() {
  return (
    <section aria-labelledby="privacy-title" className="relative z-10 overflow-clip">
      {/* lg:pt-44: the entering leg starts 1.64 plate units above the
          square's centre, 90px above its top edge. 176px leaves that point
          as far from the section's top as the square is on phones. */}
      <div className="mx-auto w-full max-w-[592px] px-4 pb-16 pt-20 text-center lg:pt-44">
        <SceneTrigger scene={PRIVACY} className="mx-auto w-[280px]">
          <GeometryAnchor name="privacy" aria-hidden="true" className="relative aspect-square w-[280px]">
            <span
              className="absolute hidden w-max font-courier text-[11px] leading-4 text-opus-green lg:block"
              style={LABEL_STYLE}
            >
              {COPY.plateLabel}
            </span>
          </GeometryAnchor>
        </SceneTrigger>

        <p
          aria-hidden="true"
          className="mt-5 flex items-center justify-center gap-2 font-courier text-[11px] leading-4 text-opus-green lg:hidden"
        >
          <span className="inline-block w-6 border-t border-dashed border-current" />
          {COPY.plateLabel}
        </p>

        <SectionHeading
          id="privacy-title"
          align="center"
          eyebrow={COPY.eyebrow}
          title={COPY.h2}
          body={COPY.body}
          className="mt-14 lg:mt-16"
        />

        <Reveal stagger className="mt-5">
          <p className={`${PARA} text-white`}>{COPY.exception}</p>
          <p className={`${PARA} mt-5 text-muted`}>{COPY.closing}</p>
          <p className="mt-8 font-courier text-[11px] leading-4 text-white/55">{COPY.website}</p>
        </Reveal>
      </div>
    </section>
  );
}

export default memo(PrivacySection);

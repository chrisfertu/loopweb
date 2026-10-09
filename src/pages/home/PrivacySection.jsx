// 07  PRIVACY (spec 2.10): the enclosure.
//
// One centred column, max 560px. The figure sits on a 280px square above the
// text: you, inside your device, inside your iCloud behind a double wall.
// Dotted lines come in from three sides, meet the wall and turn away;
// nothing reaches in.
//
// The lines' legs are 0.8 plate units long on desktop and reach past the
// square on every side, so the section's padding and the heading's margin
// make room for them. On phones they are shorter (0.42) and stay inside the
// screen.

import { memo } from 'react';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { PRIVACY } from '../../geometry/scenes';
import { privacy as COPY } from '../../content/copy';
import SectionHeading from '../../components/landing/SectionHeading';
import Reveal from '../../components/landing/Reveal';

const PARA = 'mx-auto max-w-[52ch] text-[16px] leading-[26px] sm:text-[17px] sm:leading-[28px]';

function PrivacySection() {
  return (
    <section aria-labelledby="privacy-title" className="relative z-10 overflow-clip">
      <div className="mx-auto w-full max-w-[592px] px-4 pb-16 pt-20 text-center lg:pt-28">
        <SceneTrigger scene={PRIVACY} className="mx-auto w-[280px]">
          <GeometryAnchor name="privacy" aria-hidden="true" className="aspect-square w-[280px]" />
        </SceneTrigger>

        <SectionHeading
          id="privacy-title"
          align="center"
          eyebrow={COPY.eyebrow}
          title={COPY.h2}
          body={COPY.body}
          className="mt-14 lg:mt-24"
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

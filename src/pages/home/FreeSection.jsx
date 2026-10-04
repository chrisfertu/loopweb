// 10  FREE (spec 2.11 and 2.12): free, and the page ends on the app's mark.
//
// The whole section is the scene trigger: the mark assembles from the inside
// out as the section comes up. Desktop: copy in columns 1 to 5 (the offer,
// the download row, then the languages and the closing line), the mark in
// columns 7 to 11, staying centred on screen while the copy scrolls past.
// Mobile: the copy first, and the mark (240px) last, so the page ends on it.
// The CTA row carries id="download", the skip link's target, and the "Buy me
// a coffee" link beside the badge. App renders the Footer after <main>.
//
// The tip line only exists with iOS 1.0.3 (the copy resolves it to null
// otherwise).

import { memo } from 'react';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { FREE } from '../../geometry/scenes';
import { APP_103_LIVE, free as COPY, loop as LOOP_COPY } from '../../content/copy';
import SectionHeading from '../../components/landing/SectionHeading';
import Reveal from '../../components/landing/Reveal';
import CtaRow from '../../components/landing/CtaRow';
import CoffeeLink from '../../components/landing/CoffeeLink';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const MICRO = 'font-courier text-[11px] leading-4 text-white/55';

const showTip = APP_103_LIVE && !!COPY.tip;

function Languages() {
  return (
    <p className="mt-4 max-w-[34rem] text-pretty text-[15px] leading-7 text-white/75">
      {/* The dot stays with the name before it; lines break after it. The
          plain space is outside the hidden dot, so names are read apart. */}
      {LOOP_COPY.languages.map((l, i) => (
        <span key={l.name}>
          <span lang={l.lang} className="whitespace-nowrap">
            {l.name}
          </span>
          {i < LOOP_COPY.languages.length - 1 ? (
            <>
              <span aria-hidden="true" className="text-white/40">
                {' ·'}
              </span>{' '}
            </>
          ) : null}
        </span>
      ))}
    </p>
  );
}

function FreeSection() {
  return (
    <SceneTrigger
      scene={FREE}
      as="section"
      id="free"
      aria-labelledby="free-title"
      className="relative z-10 overflow-clip"
    >
      <div className={`${CONTAINER} pb-12 pt-16 lg:py-20`}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1">
            <SectionHeading id="free-title" eyebrow={COPY.eyebrow} title={COPY.h2} body={COPY.body} />

            {showTip ? (
              <Reveal>
                <p className="mt-4 max-w-[52ch] text-pretty text-[16px] leading-[26px] text-muted sm:text-[17px] sm:leading-[28px]">
                  {COPY.tip}
                </p>
              </Reveal>
            ) : null}

            <Reveal stagger className="mt-12">
              <CtaRow id="download">
                <CoffeeLink />
              </CtaRow>
              <p className={`mt-8 max-w-[46ch] text-balance ${MICRO}`}>{COPY.requirements}</p>
              <p className={`mt-1.5 ${MICRO}`}>{COPY.storeName}</p>
            </Reveal>

            <Reveal stagger className="mt-14">
              <p className="font-courier text-[10px] uppercase leading-4 tracking-[0.2em] text-white/55">
                {LOOP_COPY.languagesLabel}
              </p>
              <Languages />
              <p className="mt-8 text-[16px] italic leading-6 text-white/55">{LOOP_COPY.tagline}</p>
            </Reveal>
          </div>

          {/* The mark. Last in the flow on phones. On desktop it sits in
              columns 7 to 11 (spilling a little into the empty columns beside
              it) and stays centred on screen while the copy scrolls past. */}
          <div
            aria-hidden="true"
            className="mt-16 flex justify-center lg:col-span-5 lg:col-start-7 lg:row-start-1 lg:mt-0 lg:items-start"
          >
            <GeometryAnchor
              name="free"
              className="aspect-square w-[240px] shrink-0 lg:sticky lg:top-[calc(50svh_+_28px_-_min(30svh,20vw))] lg:w-[min(60svh,40vw)]"
            />
          </div>
        </div>
      </div>
    </SceneTrigger>
  );
}

export default memo(FreeSection);

// 03  SOUND: silence first, and the sounds the app makes when it is wanted.
//
// One section, one scene. The figure is the sound that is chosen: a horizon
// for silence, four clouds for the noises (the one playing lights up), two
// tones for binaural beats (waves at 2 Hz, petals from 6 Hz). It arrives as
// silence; after that it follows the choices.
//
// The choices are three rows: Silence, Noise and Binaural beats. Choosing a
// row shows its figure and its line; the noise and beat rows also show their
// sounds as small buttons, and a tap on one plays it through ListenProvider
// (a second tap stops it), so only one sound plays on the page. The sound
// stops when the section leaves the viewport. While a /player session is
// running or paused, the buttons are replaced by a link to it.
//
// Desktop (lg+): about one screen tall. Columns 1 to 5 hold the heading,
// the choices and the micro line; the square "sound" anchor fills columns 6
// to 12. Below lg: the heading, then the figure, then the choices, so the
// figure sits between the words and never ends the section.

import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m as motion } from 'framer-motion';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { listening, SOUND_NOISE, SOUND_SILENCE, SOUND_TONES, withCloud } from '../../geometry/scenes';
import { sound as COPY } from '../../content/copy';
import Reveal from '../../components/landing/Reveal';
import SectionHeading from '../../components/landing/SectionHeading';
import { soundKey, useListen } from '../../components/landing/listen';
import { FOCUS_RING, PLAYER_PATH } from '../../components/landing/links';
import { PlayIcon, StopIcon } from '../../components/landing/stage/icons';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const MICRO = 'max-w-[46ch] text-pretty text-[13px] leading-5 text-white/55';
const LINE = 'max-w-[44ch] text-pretty text-[15px] leading-6 text-muted';

const reveal = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

// The audio engine's sound for an option.
const soundOf = (option) => (option.type === 'binaural' ? { type: 'binaural', frequency: option.frequency } : { type: option.type });

// The figure for what is chosen and what is playing.
function sceneFor(group, option, playing) {
  if (group === 'noise') return playing && option ? withCloud(SOUND_NOISE, option.type) : SOUND_NOISE;
  if (group === 'tones') {
    const i = Math.max(0, COPY.groups[2].options.indexOf(option));
    return playing ? listening(SOUND_TONES[i]) : SOUND_TONES[i];
  }
  return SOUND_SILENCE;
}

function SoundButton({ option, playing, onTap }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onTap(option)}
        aria-pressed={playing}
        aria-label={playing ? COPY.stopLabel(option.label) : COPY.playLabel(option.label)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 font-courier text-[13px] font-bold leading-none transition-colors ${
          playing
            ? 'border-opus-green/70 bg-opus-green/10 text-opus-green-dim'
            : 'border-white/[0.14] text-white/80 hover:border-white/30 hover:text-white'
        } ${FOCUS_RING}`}
      >
        <span aria-hidden="true" className="block h-[18px] w-[18px]">
          {playing ? <StopIcon /> : <PlayIcon />}
        </span>
        {option.short}
      </button>
    </li>
  );
}

function SoundSection() {
  const listen = useListen();
  const { playingKey, toggle, stop, sessionActive } = listen;
  const id = useId();
  const sectionRef = useRef(null);
  const [group, setGroup] = useState('silence');
  const [chosen, setChosen] = useState({ noise: null, tones: null });

  const current = COPY.groups.find((g) => g.key === group);
  const option = chosen[group] || null;
  const playingHere = !!option && soundKey(soundOf(option)) === playingKey;
  const scene = useMemo(() => sceneFor(group, option, playingHere), [group, option, playingHere]);

  const pickGroup = (key) => {
    if (key === group) return;
    stop({ owner: id });
    setGroup(key);
  };

  const onTap = (opt) => {
    setChosen((c) => ({ ...c, [group]: opt }));
    toggle(soundOf(opt), { label: opt.label, owner: id });
  };

  // The sound stops once the section has left the viewport, and when the
  // section goes away.
  const playing = playingKey != null;
  useEffect(() => {
    if (!playing) return undefined;
    const target = sectionRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry && !entry.isIntersecting) stop({ owner: id });
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [playing, stop, id]);
  useEffect(() => () => stop({ owner: id }), [stop, id]);

  return (
    <section ref={sectionRef} id="sound" aria-labelledby="sound-title" className="relative z-10 overflow-clip">
      <SceneTrigger
        scene={scene}
        className={`${CONTAINER} flex min-h-[100svh] flex-col justify-center py-[10svh] lg:grid lg:grid-cols-12 lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-6`}
      >
        <SectionHeading
          id="sound-title"
          eyebrow={COPY.eyebrow}
          title={COPY.h2}
          body={COPY.body}
          className="lg:col-span-5 lg:row-start-2"
        />

        <div className="mt-10 lg:col-span-7 lg:col-start-6 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:self-center">
          <GeometryAnchor
            name="sound"
            aria-hidden="true"
            className="mx-auto aspect-square w-[min(100%,44svh)] lg:w-[min(72svh,50vw,100%)]"
          />
        </div>

        <Reveal className="mt-10 lg:col-span-5 lg:row-start-3 lg:mt-10">
          <div role="radiogroup" aria-label={COPY.choicesLabel} className="border-t border-white/10">
            {COPY.groups.map((g) => {
              const on = g.key === group;
              return (
                <div key={g.key} className="border-b border-white/10">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pickGroup(g.key)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-sm py-2 text-left text-[17px] leading-6 transition-colors ${
                      on ? 'text-white' : 'text-white/55 hover:text-white/85'
                    } ${FOCUS_RING}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full border transition-colors ${
                        on ? 'border-opus-green bg-opus-green' : 'border-white/40'
                      }`}
                    />
                    {g.name}
                  </button>
                  <AnimatePresence initial={false}>
                    {on ? (
                      <motion.div key={g.key} className="overflow-hidden pl-5" {...reveal}>
                        <p className={`${LINE} pb-3`}>{g.line}</p>
                        {g.options.length ? (
                          sessionActive ? (
                            <p className="pb-4 text-[14px] leading-5 text-muted">
                              {'A session is playing. '}
                              <Link
                                to={PLAYER_PATH}
                                className={`rounded-sm text-opus-green underline decoration-opus-green/40 underline-offset-4 transition-colors hover:text-opus-green-dim ${FOCUS_RING}`}
                              >
                                Open the player.
                              </Link>
                            </p>
                          ) : (
                            <ul className="flex flex-wrap gap-2 pb-4">
                              {g.options.map((opt) => (
                                <SoundButton
                                  key={opt.label}
                                  option={opt}
                                  playing={soundKey(soundOf(opt)) === playingKey}
                                  onTap={onTap}
                                />
                              ))}
                            </ul>
                          )
                        ) : null}
                        {g.honest ? <p className={`${MICRO} pb-4`}>{g.honest}</p> : null}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          {current && current.options.length && !sessionActive ? (
            <p className="mt-3 font-courier text-[11px] leading-4 text-white/55">{COPY.hint}</p>
          ) : null}
          <p className={`mt-5 ${MICRO}`}>{COPY.micro}</p>
        </Reveal>
      </SceneTrigger>
    </section>
  );
}

export default memo(SoundSection);

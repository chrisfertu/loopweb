// 02  SOUND: silence first, and the sounds the app makes when it is wanted.
//
// One section, one scene. The figure is the sound that is chosen: a horizon
// for silence, four clouds for the noises (the one playing lights up), two
// tones for binaural beats (two parallel waves at 2 Hz, petals from 6 Hz).
// It arrives as silence; after that it follows the choices.
//
// Under the figure, three round choices: Silence (chosen at first), Noise
// and Binaural beats. Noise and binaural beats open a second row of four,
// one per sound, each drawn after its figure; a tap on one plays it through
// ListenProvider (a second tap stops it), so only one sound plays on the
// page. Under the rows, what the chosen kind of sound is. The sound stops
// when the section leaves the viewport. While a /player session is running
// or paused, the second row is replaced by a link to it.
//
// The figure and its choices fit in one phone screen. Desktop (lg+): about
// one screen tall; the heading and the micro line in columns 1 to 5, the
// figure with its choices under it in columns 6 to 12. Below lg: the
// heading, the figure, the choices, then the micro line.

import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m as motion } from 'framer-motion';
import { GeometryAnchor, SceneTrigger } from '../../geometry/components';
import { listening, SOUND_NOISE, SOUND_SILENCE, SOUND_TONES, TINT, withCloud } from '../../geometry/scenes';
import { sound as COPY } from '../../content/copy';
import Reveal from '../../components/landing/Reveal';
import SectionHeading from '../../components/landing/SectionHeading';
import { soundKey, useListen } from '../../components/landing/listen';
import { FOCUS_RING, PLAYER_PATH } from '../../components/landing/links';
import { BeatIcon, BinauralIcon, NoiseCloud, SilenceIcon } from '../../components/landing/SoundIcons';

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-10 xl:px-16';
const MICRO = 'max-w-[46ch] text-pretty text-[13px] leading-5 text-white/55';
const LINE = 'mx-auto max-w-[44ch] text-pretty text-center text-[15px] leading-6 text-muted';
const NAME = 'mt-1.5 block font-courier text-[11px] font-bold leading-4';

const reveal = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

// The kinds of sound, drawn.
const GROUP_ICON = { silence: SilenceIcon, noise: NoiseCloud, tones: BinauralIcon };

// Each sound's colour, the one its figure is drawn in.
const NOISE_TINT = { white: TINT.white, pink: TINT.pinkish, brown: TINT.brown, dark: TINT.dark };
const BEAT_TINT = { 2: TINT.hz2, 6: TINT.hz6, 10: TINT.hz10, 16: TINT.hz16 };

function OptionIcon({ option }) {
  if (option.type === 'binaural') return <BeatIcon beat={option.frequency} color={BEAT_TINT[option.frequency]} />;
  return <NoiseCloud color={NOISE_TINT[option.type]} />;
}

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

// One kind of sound: a round picture with its name under it.
function GroupChoice({ group, on, onPick }) {
  const Icon = GROUP_ICON[group.key];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={() => onPick(group.key)}
      className={`group flex w-[88px] flex-col items-center rounded-lg py-1 ${FOCUS_RING}`}
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full border bg-black transition-colors ${
          on ? 'border-opus-green text-white' : 'border-white/[0.16] text-white/55 group-hover:border-white/35 group-hover:text-white/85'
        }`}
      >
        <span className="block h-8 w-8">
          <Icon />
        </span>
      </span>
      <span className={`${NAME} ${on ? 'text-white' : 'text-white/55'}`}>{group.name}</span>
    </button>
  );
}

// One sound: its figure, small, in a round button; a tap plays it.
function SoundButton({ option, playing, onTap }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onTap(option)}
        aria-pressed={playing}
        aria-label={playing ? COPY.stopLabel(option.label) : COPY.playLabel(option.label)}
        className={`group flex w-16 flex-col items-center rounded-lg py-1 ${FOCUS_RING}`}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full border bg-black transition-[border-color,opacity] ${
            playing ? 'border-opus-green' : 'border-white/[0.14] opacity-80 group-hover:border-white/35 group-hover:opacity-100'
          }`}
        >
          <span className="block h-7 w-7">
            <OptionIcon option={option} />
          </span>
        </span>
        <span className={`${NAME} ${playing ? 'text-opus-green-dim' : 'text-white/60'}`}>{option.short}</span>
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

        <div className="mt-8 lg:col-span-7 lg:col-start-6 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:self-center">
          <GeometryAnchor
            name="sound"
            aria-hidden="true"
            className="mx-auto aspect-square w-[min(100%-24px,34svh)] lg:w-[min(44svh,40vw,100%)]"
          />

          <Reveal className="mt-6">
            <div role="radiogroup" aria-label={COPY.choicesLabel} className="flex justify-center gap-2">
              {COPY.groups.map((g) => (
                <GroupChoice key={g.key} group={g} on={g.key === group} onPick={pickGroup} />
              ))}
            </div>

            <AnimatePresence initial={false} mode="wait">
              {current.options.length ? (
                <motion.div key={current.key} className="overflow-hidden" {...reveal}>
                  {sessionActive ? (
                    <p className="pt-4 text-center text-[14px] leading-5 text-muted">
                      {'A session is playing. '}
                      <Link
                        to={PLAYER_PATH}
                        className={`rounded-sm text-opus-green underline decoration-opus-green/40 underline-offset-4 transition-colors hover:text-opus-green-dim ${FOCUS_RING}`}
                      >
                        Open the player.
                      </Link>
                    </p>
                  ) : (
                    <ul aria-label={current.name} className="flex justify-center gap-1 pt-3">
                      {current.options.map((opt) => (
                        <SoundButton key={opt.label} option={opt} playing={soundKey(soundOf(opt)) === playingKey} onTap={onTap} />
                      ))}
                    </ul>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mx-auto mt-4 min-h-[72px] max-w-[44ch]">
              <AnimatePresence initial={false} mode="wait">
                <motion.div key={current.key} {...fade}>
                  <p className={LINE}>{current.line}</p>
                  {current.honest ? <p className={`${MICRO} mx-auto mt-2 text-center`}>{current.honest}</p> : null}
                  {current.options.length && !sessionActive ? (
                    <p className="mt-2 text-center font-courier text-[11px] leading-4 text-white/55">{COPY.hint}</p>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-8 lg:col-span-5 lg:row-start-3 lg:mt-8">
          <p className={MICRO}>{COPY.micro}</p>
        </Reveal>
      </SceneTrigger>
    </section>
  );
}

export default memo(SoundSection);

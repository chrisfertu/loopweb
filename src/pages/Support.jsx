import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { APP_103_LIVE } from '../content/copy';
import PageLayout from '../components/PageLayout';

// Answers follow the iOS code (1.0.3 where it is live, 1.0.2 otherwise):
// pricing, tips and Watch-first sessions switch on APP_103_LIVE.

const PROSE =
  'space-y-3 text-[16px] leading-[26px] text-muted ' +
  '[&_a]:text-opus-green [&_a]:underline [&_a]:decoration-opus-green/40 [&_a]:underline-offset-[3px] ' +
  '[&_a:hover]:text-opus-green-dim [&_strong]:font-medium [&_strong]:text-white';

const Question = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const id = useId();

  return (
    <div className="border-b border-white/[0.14]">
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          className="group flex min-h-[56px] w-full items-center justify-between gap-6 py-4 text-left"
        >
          <span className="text-[17px] leading-6 text-white/90 transition-colors group-hover:text-white">{title}</span>
          <svg
            aria-hidden="true"
            className={`h-4 w-4 flex-shrink-0 text-white/55 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-a`}
            role="region"
            aria-labelledby={`${id}-q`}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className={`max-w-[60ch] pb-6 ${PROSE}`}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Topic = ({ title, children }) => (
  <section>
    <h2 className="mb-2 font-courier text-[11px] font-bold uppercase leading-4 tracking-[0.2em] text-white/55">
      {title}
    </h2>
    <div className="border-t border-white/[0.14]">{children}</div>
  </section>
);

const Support = () => (
  <PageLayout
    title="Support"
    intro={
      <p>
        Answers to common questions. If yours isn&rsquo;t here, write to{' '}
        <a href="mailto:hello@opus.ro">hello@opus.ro</a>.
      </p>
    }
  >
    <Topic title="Getting started">
      <Question title="How does Loop work?" defaultOpen>
        <p>
          Set a duration on the wheel, choose a sound or Silence, and tap play. The app times
          your session and plays your sound.
        </p>
        <p>
          A bell is optional. Pick one of seven bells and it rings when the session begins and
          when it ends, and at an interval if you like. New presets start with No Bell.
        </p>
      </Question>
      <Question title="What are presets?">
        <p>
          A preset saves a duration, sound, bell, background, icon and health settings together.
          Swipe the preset carousel, or the timer wheel, to move between them.
        </p>
        <p>
          To add one, swipe past your last preset, set it up, and tap Add New Preset.{' '}
          {APP_103_LIVE
            ? 'Presets are unlimited, for everyone.'
            : 'The app comes with one preset. More presets are a one-time purchase.'}
        </p>
      </Question>
      <Question title="Can I set an infinite timer?">
        <p>
          Yes. &infin; sits at the top of the duration wheel, above one minute. The session runs
          until you stop it.
        </p>
        <p>Fixed durations run from 1 minute to 24 hours.</p>
      </Question>
      <Question title="Can a preset remind me?">
        <p>
          Yes. A preset can send one quiet notification at the time and on the days you choose.
          Up to eight presets can have a reminder.
        </p>
      </Question>
    </Topic>

    <Topic title="Sounds and audio">
      <Question title="How do I add my own audio?">
        <p>
          Tap the sound button on the main screen to open the soundtrack gallery. Swipe to either
          end and tap Add Soundtrack, the + cover.
        </p>
        <p>
          From there you can import audio files, or a whole folder from Files (a folder becomes a
          playlist), add songs from your music library, or search Apple Music for songs, albums
          and playlists, or paste a link.
        </p>
        <p>
          Common formats work, such as MP3, M4A, WAV, AAC, FLAC and AIFF. Playing tracks from
          Apple Music requires an Apple Music subscription.
        </p>
      </Question>
      <Question title="What are the built-in sounds?">
        <p>
          Loop generates its sounds on your device as you listen, so there is nothing to
          download.
        </p>
        <p>
          <strong>Binaural beats:</strong> 2Hz - Sleep, 6Hz - Meditation, 10Hz - Relax and 16Hz -
          Focus, around a 216 Hz center tone. Use headphones.
        </p>
        <p>
          <strong>Noise:</strong> white, pink, brown and dark, matched in loudness.
        </p>
        <p>
          <strong>Silence:</strong> the timer runs on its own, and audio from other apps keeps
          playing.
        </p>
      </Question>
      <Question title="What does a track’s loop button do?">
        <p>
          With a track&rsquo;s loop button on, it repeats for the whole session. With it off, the
          track plays once and the rest of the session is silent. Useful for guided meditations
          that are shorter than your session.
        </p>
      </Question>
      <Question title="Can I change the soundtrack during a session?">
        <p>
          Yes. Touch and hold the sound button while a session is running to change the
          soundtrack without stopping the timer.
        </p>
      </Question>
      <Question title="Can I play other media during a session?">
        <p>
          Yes, if the soundtrack is set to Silence. Loop won&rsquo;t interrupt audio from
          other apps.
        </p>
      </Question>
    </Topic>

    <Topic title="Bells">
      <Question title="Which bells are there?">
        <p>
          Seven, all built in: Meditation Bell, Singing Bowl, Tibetan Bowl, Tibetan Bowl Light,
          Glass Bell, Metallic Bell and Thin Bell. You can also choose No Bell. With an Apple
          Watch paired, there is Vibration Only too, which taps your wrist instead of ringing.
        </p>
        <p>Importing your own bell sounds is not supported.</p>
      </Question>
      <Question title="What are interval bells?">
        <p>
          Each preset has one bell. It rings when a session begins and when it ends. Turn on
          Interval Bell and it also rings every 1 to 120 minutes, at the interval you choose.
        </p>
        <p>
          On Apple Watch, the Vibration switch also taps your wrist when the bell rings. Without
          Mind &amp; Body, the Watch stops tapping after sixty minutes, a limit Apple sets.
        </p>
      </Question>
    </Topic>

    <Topic title="Health and Apple Watch">
      <Question title="How do I track mindful minutes?">
        <p>
          Mindful minutes are on by default for each preset. The first time you finish a
          session, the app asks for access to Apple Health. After that, every completed session
          is saved as mindful minutes. You can turn it off per preset in the session settings.
        </p>
      </Question>
      <Question title="What is Mind & Body mode?">
        <p>
          Mind &amp; Body records a session as a workout, with heart rate from your Apple Watch
          and active calories. Turn it on per preset in the session settings.
          {APP_103_LIVE && ' It appears there once an Apple Watch has been connected.'}
        </p>
        <p>
          Saving the workout is optional. Turn off Save sessions as workout in App Settings and
          you still see your heart rate, but no workout is saved.
        </p>
      </Question>
      <Question title="Does the Apple Watch app work without my iPhone?">
        {APP_103_LIVE ? (
          <>
            <p>
              For sessions, yes. Start a session on the Watch and it begins right there. If your
              iPhone is out of reach, the session runs and ends on your wrist and syncs to the
              iPhone later.
            </p>
            <p>You still need the iPhone app to install the Watch app and to set up presets.</p>
          </>
        ) : (
          <p>
            The Watch app works together with your iPhone. It shows your active session and lets
            you start, pause and stop from your wrist. Heart rate streams to your iPhone during
            Mind &amp; Body sessions.
          </p>
        )}
      </Question>
    </Topic>

    <Topic title="Price and refunds">
      <Question title="Is there a subscription?">
        {APP_103_LIVE ? (
          <>
            <p>
              No. Loop is free, and everything is included, unlimited presets too. Nothing
              is paywalled.
            </p>
            <p>
              If you want to, you can leave a tip from App Settings, more than once if you like.
              A tip unlocks nothing and changes nothing. If you bought the preset unlock in an
              earlier version, nothing changes for you.
            </p>
          </>
        ) : (
          <>
            <p>
              No. Loop is free to download, with the timer, every sound and your imports
              included.
            </p>
            <p>
              One preset is free. More presets are a one-time in-app purchase, with no recurring
              fee.
            </p>
          </>
        )}
      </Question>
      <Question title="How do I get a refund?">
        <p>
          {APP_103_LIVE
            ? 'Tips, and the preset unlock sold in earlier versions, go through the App Store, so Apple handles refunds.'
            : 'Purchases go through the App Store, so Apple handles refunds.'}{' '}
          Visit <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer">reportaproblem.apple.com</a>,
          sign in with your Apple Account, choose Request a refund, and select Loop.
        </p>
      </Question>
    </Topic>

    <Topic title="The web version">
      <Question title="Can I use Loop without downloading the app?">
        <p>
          Yes. The <Link to="/player">web player</Link> is a free timer that runs in your
          browser, with the built-in sounds, an audio file of your own and an interval bell.
        </p>
      </Question>
      <Question title="How do I install it as an app?">
        <p>
          <strong>Safari (iPhone and iPad):</strong> tap the Share button, then Add to Home
          Screen. It opens as a standalone app.
        </p>
        <p>
          <strong>Chrome (Android and desktop):</strong> open the menu, then Install app or Add to
          Home Screen.
        </p>
      </Question>
      <Question title="What’s different from the iPhone app?">
        <p>
          The web version is a simple timer: the built-in sounds, one audio file of your own, and
          an interval bell.
        </p>
        <p>
          The iPhone app adds presets, the seven bells, backgrounds, Apple Music, Apple Health, the
          Apple Watch app, iCloud sync and reminders. It also shows a Live Activity on the Lock
          Screen and in the Dynamic Island, and adds a Lock Screen widget, a Control Center
          control, Siri Shortcuts and Watch complications.
        </p>
      </Question>
    </Topic>

    <Topic title="Privacy and data">
      <Question title="Does the app track me?">
        <p>
          There are no accounts and no ads, and OPUS runs no servers for your data. The app sends
          anonymous usage statistics through TelemetryDeck. They are on by default, and you can
          turn them off in App Settings. Health data and the names of your sounds are never sent.
        </p>
        <p>
          See the <Link to="/privacy">Privacy Policy</Link> for details.
        </p>
      </Question>
      <Question title="What analytics are collected?">
        <p>
          Which features are used, and how long sessions last. Each signal carries a random
          install identifier, hashed before it is sent, so repeat use can be counted without
          knowing who you are. No name, email or account is involved.
        </p>
        <p>To turn it off, use the Anonymous Analytics switch in App Settings.</p>
      </Question>
      <Question title="Where is my data stored?">
        <p>
          On your device. With iCloud sync on, presets, settings, your sound library and session
          history sync through your own iCloud Drive, in the app&rsquo;s own folder, which you can see in Files
          and Finder.{APP_103_LIVE && ' Heart rate is never written to iCloud.'} OPUS runs no
          servers.
        </p>
      </Question>
    </Topic>

    <section className="border-t border-white/[0.14] pt-10">
      <p className="text-[17px] leading-7 text-white">Still have a question?</p>
      <p className="mt-1 text-[16px] leading-[26px] text-muted">
        Write to{' '}
        <a
          href="mailto:hello@opus.ro"
          className="text-opus-green underline decoration-opus-green/40 underline-offset-[3px] hover:text-opus-green-dim"
        >
          hello@opus.ro
        </a>
        . We read every message.
      </p>
    </section>
  </PageLayout>
);

export default Support;

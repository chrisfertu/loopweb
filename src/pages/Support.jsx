import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../components/PageLayout';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/[0.06] rounded-lg hover:bg-white/[0.02] transition-colors">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 px-1 text-left group"
      >
        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5 px-1 text-sm text-white/75 leading-relaxed space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SupportSection = ({ title, children }) => (
  <Reveal>
    <div className="mb-10">
      <h2 className="font-courier text-[11px] tracking-[0.2em] uppercase text-white/70 mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  </Reveal>
);

const Support = () => (
  <PageLayout
    title="Help"
    subtitle={
      <p className="text-white/75 text-sm mt-2">
        Answers to common questions. If yours isn't here, write to{' '}
        <a href="mailto:hello@opus.ro" className="text-opus-green hover:text-opus-green-dim transition-colors">
          hello@opus.ro
        </a>
      </p>
    }
  >
    {/* Getting Started */}
    <SupportSection title="Getting Started">
      <Accordion title="How does OPUS Loop work?" defaultOpen>
        <p>
          Set a duration with the scroll wheel, choose a soundtrack (or silence), and tap play.
          The app times your session and plays your chosen sound. When the session ends, you hear a bell.
        </p>
      </Accordion>
      <Accordion title="What are presets?">
        <p>
          Presets let you save different session configurations. Each preset remembers its own
          duration, soundtrack, bells, background, and health toggles.
        </p>
        <p>
          Swipe horizontally on the main screen to switch between presets. The last card
          lets you add a new one. The app comes with one preset for free. Unlock unlimited
          presets with a one-time purchase of $4.99.
        </p>
      </Accordion>
      <Accordion title="Can I set an infinite timer?">
        <p>
          Yes. Scroll the duration wheel past zero to reach infinity mode.
          The session runs until you stop it manually.
        </p>
      </Accordion>
    </SupportSection>

    {/* Sounds */}
    <SupportSection title="Sounds & Audio">
      <Accordion title="How do I add my own audio?">
        <p>
          Tap the sound icon on the main screen, then tap "Add Soundtrack" at the bottom
          of your sound library. From there you can import an audio file, paste a track or
          playlist link from Apple Music, or search Apple Music and your iTunes library directly.
        </p>
        <p>
          Supported file formats: MP3, M4A, WAV, AAC, FLAC, AIFF. Apple Music requires an active subscription.
        </p>
      </Accordion>
      <Accordion title="What are the built-in sounds?">
        <p>
          OPUS Loop generates sounds in real time, no downloads needed:
        </p>
        <p>
          <strong className="text-white/60">Binaural beats</strong> at 2Hz (deep sleep), 4Hz (meditation),
          10Hz (relaxation), and 20Hz (active focus), with a 216Hz carrier tone.
        </p>
        <p>
          <strong className="text-white/60">Noise</strong> in four flavors: white, pink, brown, and dark.
        </p>
      </Accordion>
      <Accordion title="What does the loop toggle do?">
        <p>
          When loop is on, your imported track repeats for the entire session. When loop is off,
          the track plays once and the rest of the session continues in silence. Useful for guided
          meditations that are shorter than your session.
        </p>
      </Accordion>
      <Accordion title="Can I change the soundtrack during a session?">
        <p>
          Yes. Tap and hold the sound/mute button while a session is running to change your
          soundtrack without stopping the timer.
        </p>
      </Accordion>
      <Accordion title="Can I play other media during a session?">
        <p>
          Yes, if the soundtrack is set to Silence. OPUS Loop won't interrupt audio from other apps.
        </p>
      </Accordion>
    </SupportSection>

    {/* Health & Watch */}
    <SupportSection title="Health & Apple Watch">
      <Accordion title="How do I track mindful minutes?">
        <p>
          Grant Apple Health access when prompted, or enable it from the session settings
          for each preset. Completed sessions are saved as mindful minute samples automatically.
        </p>
      </Accordion>
      <Accordion title="What is Mind & Body mode?">
        <p>
          Mind & Body records your session as a workout in Apple Health, including heart rate
          data from your Apple Watch. Enable it per-preset in session settings.
        </p>
      </Accordion>
      <Accordion title="Does the Apple Watch app work without my iPhone?">
        <p>
          No. The Watch app requires your iPhone nearby. It mirrors your active session and
          lets you start, pause, and stop from your wrist. Heart rate data streams to your
          iPhone during Mind & Body sessions.
        </p>
      </Accordion>
    </SupportSection>

    {/* Guides */}
    <SupportSection title="Guides">
      <Accordion title="What are interval bells?">
        <p>
          Interval bells play a sound at a regular interval during your session (e.g. every
          10 minutes). Choose from several included bell sounds, or import your own.
        </p>
      </Accordion>
      <Accordion title="Set up guided meditations">
        <p>
          Import a guided meditation as an audio file through the sound picker. Turn off loop
          so the track plays once. If you want silent time after the guided portion, set the
          session duration longer than the track. If the session is shorter, the track will
          stop when the timer ends.
        </p>
      </Accordion>
      <Accordion title="Where to find free guided meditations">
        <p>
          The app includes a curated list of free resources at the bottom of the sound settings
          screen. Beyond that, many teachers and organizations publish guided meditations as
          downloadable audio on their websites. Search for what resonates with you.
        </p>
      </Accordion>
    </SupportSection>

    {/* Purchases & Refunds */}
    <SupportSection title="Purchases & Refunds">
      <Accordion title="Is there a subscription?">
        <p>
          No. OPUS Loop is free to download with all core features included: timer, sound
          generator, Apple Music import, Apple Watch, Apple Health, and more.
        </p>
        <p>
          If you want to create more than one preset, there's a one-time in-app purchase of
          $4.99 that unlocks unlimited presets. No subscription, no recurring fees.
        </p>
      </Accordion>
      <Accordion title="How do I get a refund?">
        <p>
          Refunds are handled by Apple. Visit{' '}
          <a
            href="https://reportaproblem.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-opus-green hover:text-opus-green-dim transition-colors underline underline-offset-2"
          >
            reportaproblem.apple.com
          </a>
          , sign in with your Apple ID, find OPUS Loop in your purchase history, and select
          "Request a Refund." Apple typically processes refunds within a few days.
        </p>
      </Accordion>
    </SupportSection>

    {/* Web Version */}
    <SupportSection title="Using the Web Version">
      <Accordion title="Can I use OPUS Loop without downloading the app?">
        <p>
          Yes. Visit{' '}
          <Link to="/player" className="text-opus-green hover:text-opus-green-dim transition-colors underline underline-offset-2">
            opusloop.co/player
          </Link>
          {' '}for a free web-based timer with built-in binaural beats, noise generators,
          and custom audio import. You can use it directly in your browser.
        </p>
      </Accordion>
      <Accordion title="How do I install it as an app?">
        <p>
          <strong className="text-white/60">Safari (iPhone/iPad):</strong> Tap the Share button,
          then "Add to Home Screen." The site will open as a standalone app.
        </p>
        <p>
          <strong className="text-white/60">Chrome (Android/Desktop):</strong> Tap the three-dot menu,
          then "Install app" or "Add to Home Screen."
        </p>
      </Accordion>
      <Accordion title="What's different from the native app?">
        <p>
          The web version is a basic timer with sound playback and a duration selector. The
          native app adds presets, Apple Health, Apple Watch, Live Activities, interval bells,
          custom backgrounds, iCloud sync, reminders, and Apple Music integration.
        </p>
      </Accordion>
    </SupportSection>

    {/* Privacy */}
    <SupportSection title="Privacy & Data">
      <Accordion title="Does the app track me?">
        <p>
          No. OPUS Loop has no servers, no accounts, and no user tracking. Your sessions, presets,
          and soundtracks stay on your device and your personal iCloud account. See the{' '}
          <Link to="/privacy" className="text-opus-green hover:text-opus-green-dim transition-colors underline underline-offset-2">
            Privacy Policy
          </Link>
          {' '}for details.
        </p>
      </Accordion>
      <Accordion title="What analytics are collected?">
        <p>
          OPUS Loop uses TelemetryDeck, a privacy-preserving analytics service. It collects
          anonymous usage counts (how many times a feature is used) with no personal data,
          no device fingerprinting, and no user profiles. You can opt out in Settings.
        </p>
      </Accordion>
      <Accordion title="Where is my data stored?">
        <p>
          On your device. If iCloud is enabled, presets, soundtracks, and session history
          sync through your personal iCloud Drive container. OPUS does not operate any servers.
        </p>
      </Accordion>
    </SupportSection>

    {/* Contact */}
    <Reveal>
      <div className="mt-6 pt-8 border-t border-white/[0.06] text-center">
        <p className="text-white/75 text-sm mb-2">
          Still have a question?
        </p>
        <a
          href="mailto:hello@opus.ro"
          className="text-opus-green hover:text-opus-green-dim transition-colors text-sm"
        >
          hello@opus.ro
        </a>
        <p className="text-white/70 text-xs mt-1">We read every message.</p>
      </div>
    </Reveal>
  </PageLayout>
);

export default Support;

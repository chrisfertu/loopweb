import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const APP_STORE_URL = 'https://apps.apple.com/app/opus-loop-meditation-timer/id6740513432';

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
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
            <div className="pb-5 text-sm text-white/40 leading-relaxed space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SupportSection = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="font-courier text-[11px] tracking-[0.2em] uppercase text-white/25 mb-4">{title}</h2>
    <div>{children}</div>
  </div>
);

const Support = () => (
  <div className="min-h-screen bg-black text-white">
    <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
      {/* Back nav */}
      <nav className="mb-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm font-courier"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          opusloop.co
        </Link>
      </nav>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">Help</h1>
      <p className="text-white/40 text-sm mb-12">
        Answers to common questions. If yours isn't here, write to{' '}
        <a href="mailto:hello@opus.ro" className="text-opus-green hover:text-opus-green-dim transition-colors">
          hello@opus.ro
        </a>
      </p>

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
            lets you add a new one.
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
        <Accordion title="How do I import my own audio?">
          <p>
            Tap the sound icon on the main screen, then tap "Add Sound."
            You can import audio files from your device, iCloud Drive, or the Files app.
            Supported formats: MP3, M4A, WAV, AAC, FLAC, AIFF.
          </p>
        </Accordion>
        <Accordion title="Can I use Apple Music?">
          <p>
            Yes. In the sound picker, choose "Apple Music" to browse and select tracks
            from your Apple Music library. Requires an active Apple Music subscription.
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
        <Accordion title="Can I play other media during a session?">
          <p>
            Yes, if the soundtrack is set to Silence. OPUS Loop won't interrupt audio from other
            apps, so your podcast or music keeps playing. You can quickly switch any preset to
            silence by tapping and holding the mute button in the sound view.
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
            Interval bells ring at regular points during your session. You can set them to
            midpoint, thirds, quarters, or a custom interval (e.g. every 25 minutes). Choose
            from several included bell sounds, or import your own.
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
            No. $4.99, one-time. All features included, no in-app purchases.
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
        <Accordion title="Can I use OPUS Loop without buying the app?">
          <p>
            The website at{' '}
            <Link to="/" className="text-opus-green hover:text-opus-green-dim transition-colors underline underline-offset-2">
              opusloop.co
            </Link>
            {' '}includes a free meditation timer with built-in binaural beats, noise generators,
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
            The web version is a basic timer with sound playback. The native app adds presets,
            Apple Health, Apple Watch, Live Activities, interval bells, custom backgrounds,
            iCloud sync, reminders, and Apple Music.
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
      <div className="mt-16 pt-8 border-t border-white/[0.06] text-center">
        <p className="text-white/40 text-sm mb-2">
          Still have a question?
        </p>
        <a
          href="mailto:hello@opus.ro"
          className="text-opus-green hover:text-opus-green-dim transition-colors text-sm"
        >
          hello@opus.ro
        </a>
        <p className="text-white/20 text-xs mt-1">We read every message.</p>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/25">
          <Link to="/" className="hover:text-white/50 transition-colors">Home</Link>
          <span className="text-white/10">·</span>
          <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          <span className="text-white/10">·</span>
          <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          <span className="flex-1" />
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
          >
            App Store
          </a>
        </div>
      </footer>
    </div>
  </div>
);

export default Support;

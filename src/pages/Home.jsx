import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PhoneFrame from '../components/PhoneFrame';

const APP_STORE_URL = 'https://apps.apple.com/ro/app/loop-meditation-focus/id6756740657';

// ────────────────────────────────────────────────────────────
// Shared components
// ────────────────────────────────────────────────────────────

const VideoBackground = ({ src = '/videos/pastelmountains.mp4', opacity = 0.35 }) => (
  <div className="absolute inset-0 overflow-hidden">
    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
      <source src={src} type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-black" style={{ opacity: 1 - opacity }} />
  </div>
);

const AppStoreButton = ({ label = 'Download on the App Store', className = '' }) => (
  <a
    href={APP_STORE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`app-store-btn ${className}`}
  >
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
    <span className="text-sm font-semibold">{label}</span>
  </a>
);

const WebAppButton = ({ className = '' }) => (
  <Link
    to="/player"
    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 border border-white/15 text-white/70 hover:border-white/30 hover:text-white hover:bg-white/[0.06] ${className}`}
  >
    Try on the web
  </Link>
);

const SectionReveal = ({ children, className = '', delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

const ScrollChevron = () => (
  <motion.div
    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.5, duration: 0.8 }}
  >
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-30"
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M6 9l6 6 6-6" />
    </motion.svg>
  </motion.div>
);

// ────────────────────────────────────────────────────────────
// Section 1: Hero (split layout)
// ────────────────────────────────────────────────────────────

const HeroSection = () => (
  <section id="hero" className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
    <VideoBackground src="/videos/pastelmountains.mp4" opacity={0.3} />

    <div className="relative z-10 w-full max-w-6xl mx-auto px-8 py-20 md:py-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center min-h-[80vh]">

        {/* Left: Mockup image */}
        <motion.div
          className="flex justify-center order-1 md:order-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img
            src="/images/mockup-price.png"
            alt="OPUS Loop meditation timer app"
            className="max-w-[320px] md:max-w-[460px] w-full drop-shadow-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Right: Copy + CTA */}
        <motion.div
          className="flex flex-col items-center md:items-start text-center md:text-left gap-6 order-2 md:order-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 mb-2">
            <img src="/images/logo.svg" alt="OPUS Loop" className="w-12 h-12" />
            <span className="font-courier tracking-[0.3em] uppercase text-sm text-white/50">opus loop</span>
          </div>

          <h1 className="text-[1.75rem] md:text-5xl lg:text-6xl font-semibold leading-[1.15] tracking-[-0.02em] text-white">
            Your rituals, without a monthly sacrifice.
          </h1>

          <p className="text-base md:text-lg text-white/40 max-w-md leading-relaxed">
            A simple tool for meditation, prayer or whatever centers you.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <AppStoreButton label="Download for free" />
            <WebAppButton />
          </div>
        </motion.div>
      </div>
    </div>

    <ScrollChevron />
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 2: Bring your own teacher (video LEFT, text right)
// ────────────────────────────────────────────────────────────

const TeacherSection = () => (
  <section className="section-container">
    <div className="section-two-col">
      <SectionReveal className="flex flex-col justify-center gap-5 text-center md:text-left" delay={0.1}>
        <h2 className="section-heading">Bring your own teacher</h2>
        <p className="section-body">
          Import your own soundscapes or guided meditation from your own files or from Apple Music*.
        </p>

        <h3 className="text-lg md:text-xl font-medium text-white/80 mt-4">A tool, not a service.</h3>
        <p className="section-body">
          Set a duration, choose a sound and tap to begin. No catalog to browse, no content you didn't choose, no monthly subscription.
        </p>

        <p className="text-[11px] text-white/30 mt-2 leading-relaxed">
          * Requires an active Apple Music subscription for streaming content.
        </p>
      </SectionReveal>

      <SectionReveal className="flex justify-center" delay={0.2}>
        <PhoneFrame className="max-w-[240px] w-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/app-demo.mp4" type="video/mp4" />
          </video>
        </PhoneFrame>
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 3: Unlimited options (image LEFT, text right)
// ────────────────────────────────────────────────────────────

const OptionsSection = () => (
  <section className="section-container">
    <div className="section-two-col">
      <SectionReveal className="flex justify-center" delay={0.1}>
        <img
          src="/images/mockup-config.png"
          alt="Multiple preset configurations"
          className="w-full max-w-md rounded-2xl"
        />
      </SectionReveal>

      <SectionReveal className="flex flex-col justify-center gap-5 text-center md:text-left" delay={0.2}>
        <h2 className="section-heading">Unlimited options.<br />Yours forever.</h2>
        <p className="section-body">
          Loop lets you create your library of soundscapes, add your own background images or videos, track your heart rate or mindful minutes. All for free.
        </p>

        <h3 className="text-lg md:text-xl font-medium text-white/80 mt-4">A small price for a useful app.</h3>
        <p className="section-body">
          If you find more than one use for Loop in your life, consider unlocking presets with a one-time purchase of $5 and create unlimited configurations that you can easily swipe between.
        </p>
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 4: Use Cases (carousel with illustrations)
// ────────────────────────────────────────────────────────────

const useCases = [
  {
    text: 'Five minutes of stillness before the day begins.',
    illustration: '/images/illustrations/five-minutes-of-stillness.svg',
  },
  {
    text: '90 min deep work sessions with interval bells at 10 minutes and binaural beats.',
    illustration: '/images/illustrations/deep-work.svg',
  },
  {
    text: 'Ecstatic dance with a personal playlist from Apple Music.',
    illustration: '/images/illustrations/ecstatic-dance.svg',
  },
  {
    text: 'Ten minutes of reflection before bed time.',
    illustration: '/images/illustrations/ten-minutes-reflection.svg',
  },
  {
    text: 'As a brown noise machine for sleep.',
    illustration: '/images/illustrations/brown-noise.svg',
  },
];

const UseCasesSection = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (next) => {
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  };

  const prev = () => go((current - 1 + useCases.length) % useCases.length);
  const next = () => go((current + 1) % useCases.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % useCases.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current]);

  const textVariants = {
    enter: (d) => ({ opacity: 0, y: d > 0 ? 24 : -24 }),
    center: { opacity: 1, y: 0 },
    exit: (d) => ({ opacity: 0, y: d > 0 ? -24 : 24 }),
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <VideoBackground opacity={0.25} />

      {/* Illustration background layer */}
      <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={useCases[current].illustration}
            alt=""
            className="w-[300px] md:w-[400px] h-auto opacity-[0.18]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <SectionReveal className="text-center mb-12 md:mb-16">
          <h2 className="section-heading">How people use it.</h2>
        </SectionReveal>

        <div
          className="w-full max-w-lg mx-auto px-8 relative"
          style={{ minHeight: '5rem' }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.p
              key={current}
              custom={direction}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-courier text-lg md:text-xl text-white/50 leading-relaxed text-center"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x < -40 || info.velocity.x < -200) next();
                else if (info.offset.x > 40 || info.velocity.x > 200) prev();
              }}
            >
              {useCases[current].text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-6 mt-10">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
            aria-label="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5">
            {useCases.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-5 h-1.5 bg-white/40'
                    : 'w-1.5 h-1.5 bg-white/15 hover:bg-white/25'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
            aria-label="Next"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

// ────────────────────────────────────────────────────────────
// Section 5: Apple Ecosystem (image LEFT, text right)
// ────────────────────────────────────────────────────────────

const EcosystemSection = () => (
  <section className="section-container">
    <SectionReveal className="text-center mb-12 md:mb-16">
      <h2 className="section-heading">Track your practice, not your spending.</h2>
    </SectionReveal>

    <div className="section-two-col">
      <SectionReveal className="flex justify-center" delay={0.1}>
        <img
          src="/images/mockup-ecosystem.png"
          alt="OPUS Loop on iPad, iPhone, and Apple Watch"
          className="w-full max-w-lg"
        />
      </SectionReveal>

      <SectionReveal className="flex flex-col justify-center" delay={0.2}>
        <p className="text-white/50 text-sm md:text-base leading-relaxed mb-4">
          Sessions sync to Apple Health as mindful minutes. Automatically. No extra steps.
        </p>
        <p className="text-white/50 text-sm md:text-base leading-relaxed mb-4">
          Apple Watch companion with heart rate monitoring. Start, pause, and track sessions
          from your wrist. Mind & Body mode turns any session into a workout.
        </p>
        <p className="text-white/50 text-sm md:text-base leading-relaxed mb-4">
          Live Activities put your session on the Lock Screen. Your presets, soundtracks,
          and history sync across devices through iCloud.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
          <AppStoreButton />
          <span className="text-white/20 text-sm">or</span>
          <WebAppButton />
        </div>
      </SectionReveal>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 6: Privacy (breather)
// ────────────────────────────────────────────────────────────

const PrivacySection = () => (
  <section className="w-full max-w-2xl mx-auto px-8 py-20 md:py-24 text-center">
    <SectionReveal>
      <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-white mb-4">
        No account. No tracking. No data collection.
      </h2>
      <p className="text-white/35 text-base md:text-lg leading-relaxed mb-2">
        Your practice stays on your device and your iCloud.
      </p>
      <p className="text-white/25 text-base md:text-lg leading-relaxed">
        We don't know who you are. We prefer it that way.
      </p>
    </SectionReveal>
  </section>
);

// ────────────────────────────────────────────────────────────
// Section 7: Closing (pricing + CTA)
// ────────────────────────────────────────────────────────────

const ClosingSection = () => (
  <section className="relative mt-14 md:mt-20 py-28 md:py-36 overflow-hidden">
    <VideoBackground opacity={0.5} />

    {/* Gradient overlays */}
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(177.3deg, rgba(12,14,12,0.7) 3.67%, rgba(17,18,17,0.7) 45.37%, rgba(14,21,16,0.7) 96.33%)' }} />
    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 24% 6% at 50% 110%, rgba(35,26,151,0.18) 0%, rgba(0,168,107,0.06) 40%, transparent 70%)' }} />
    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 16% 4% at 50% 100%, rgba(181,175,255,0.05) 0%, transparent 60%)' }} />
    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" style={{ backgroundSize: '100% 30%', backgroundRepeat: 'no-repeat' }} />

    <div className="relative z-10 w-full max-w-5xl mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

        {/* Left: Mockup */}
        <SectionReveal className="flex justify-center" delay={0.1}>
          <img
            src="/images/mockup-price.png"
            alt="OPUS Loop timer in action"
            className="max-w-[300px] md:max-w-[360px] w-full drop-shadow-2xl"
          />
        </SectionReveal>

        {/* Right: Pricing + CTA */}
        <SectionReveal className="flex flex-col items-center md:items-start text-center md:text-left gap-6" delay={0.2}>
          <div>
            <h2 className="section-heading mb-3">Free to download.<br />Yours to keep.</h2>
            <p className="section-body">
              OPUS Loop is free with a fully functional timer, sound generator, and Apple Music import. No account, no trial.
            </p>
            <p className="section-body mt-3">
              Love it? Unlock unlimited presets with a one-time purchase of $4.99. Every feature. Every update. Forever.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <AppStoreButton label="Download for free" />
            <WebAppButton />
          </div>

          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-white/30">
              {'Refundable through '}
              <a
                href="https://reportaproblem.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/45 underline underline-offset-2 hover:text-white/60 transition-colors"
              >
                Apple
              </a>
            </span>
          </div>
        </SectionReveal>
      </div>

      {/* Languages + philosophy */}
      <div className="mt-20 flex flex-col items-center gap-6">
        <SectionReveal delay={0.15} className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-medium text-white/20 tracking-[1px] uppercase font-courier">Available in 14 languages</p>
          <p className="text-[12px] text-white/25 leading-relaxed max-w-[488px] font-courier text-center">
            English · Deutsch · Español · Français · Nederlands · Norsk · Suomi · Filipino · Magyar · Română · Telugu · 日本語 · 简体中文 · 繁體中文
          </p>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <p className="text-[12px] text-white/20 italic tracking-[0.1px]">
            No philosophy imposed. No tradition assumed.
          </p>
        </SectionReveal>
      </div>
    </div>
  </section>
);

// ────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="py-10 px-6 text-center">
    <p className="text-xs text-white/25 font-inter mb-4">
      Made in Romania by{' '}
      <a
        href="http://opus.ro"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
      >
        OPUS
      </a>
    </p>
    <div className="flex items-center justify-center gap-4 text-xs text-white/25">
      <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
      <span className="text-white/25 text-sm">·</span>
      <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
      <span className="text-white/25 text-sm">·</span>
      <Link to="/support" className="hover:text-white/50 transition-colors">Support</Link>
    </div>
  </footer>
);

// ────────────────────────────────────────────────────────────
// Home Page
// ────────────────────────────────────────────────────────────

const Home = () => {
  return (
    <div>
      <HeroSection />
      <TeacherSection />
      <OptionsSection />
      <UseCasesSection />
      <EcosystemSection />
      <PrivacySection />
      <ClosingSection />
      <Footer />
    </div>
  );
};

export default Home;

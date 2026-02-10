import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const APP_STORE_URL = 'https://apps.apple.com/app/opus-loop-meditation-timer/id6740513432';

const Support = () => (
  <PageLayout title="Support">
    <div className="legal-section">
      <p>
        OPUS Loop is designed to be simple and self-contained. If you need help or have
        feedback, we&rsquo;re here.
      </p>
    </div>

    <div className="legal-section">
      <h2>Contact</h2>
      <p>
        For questions, bug reports, or feedback, email us at{' '}
        <a href="mailto:hello@opus.ro">hello@opus.ro</a>.
        <br />
        We read every message.
      </p>
    </div>

    <div className="legal-section">
      <h2>Common Questions</h2>

      <div className="space-y-6 mt-4">
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-1">How do I import my own soundtracks?</h3>
          <p className="text-sm text-white/50">
            Tap the sound icon on the main screen, then tap &ldquo;Add Sound.&rdquo;
            You can import audio files from your device, iCloud Drive, or use tracks
            from Apple Music.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-1">How do I create a new preset?</h3>
          <p className="text-sm text-white/50">
            Swipe left on the main screen to browse your presets. The last card lets
            you add a new one. Each preset has its own soundtrack, bells, background,
            and reminder schedule.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-1">Does the app track my data?</h3>
          <p className="text-sm text-white/50">
            No. OPUS Loop has no servers, no accounts, and no tracking. Your data stays
            on your device and in your personal iCloud account. See our{' '}
            <Link to="/privacy">Privacy Policy</Link> for details.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-1">Is there a subscription or in-app purchase?</h3>
          <p className="text-sm text-white/50">
            No. OPUS Loop is a one-time purchase. All features are included. There is no
            &ldquo;Pro&rdquo; version and no locked content.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-1">Can I sync across devices?</h3>
          <p className="text-sm text-white/50">
            Yes. If iCloud is enabled on your devices, your presets, soundtracks, and
            session history sync automatically across iPhone, iPad, and Apple Watch.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-1">How do I track mindful minutes?</h3>
          <p className="text-sm text-white/50">
            OPUS Loop can write your sessions to Apple Health as mindful minutes. Grant
            Health access when prompted, or enable it later from the session settings.
            You can also use Mind &amp; Body mode to track sessions as workouts with heart rate.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-1">Can I get a refund?</h3>
          <p className="text-sm text-white/50">
            Refunds are handled by Apple. You can request a refund through the App Store
            or at{' '}
            <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer">
              reportaproblem.apple.com
            </a>.
          </p>
        </div>
      </div>
    </div>

    <div className="legal-section">
      <h2>App Store</h2>
      <p>
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          View OPUS Loop on the App Store
        </a>
      </p>
    </div>
  </PageLayout>
);

export default Support;

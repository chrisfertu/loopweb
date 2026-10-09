import { Link } from 'react-router-dom';
import { APP_103_LIVE } from '../content/copy';
import PageLayout, { PageSection } from '../components/PageLayout';

// Mirrors the in-app terms (App Settings > Terms of Service), plus Purchases.
// Purchases switch on VITE_APP_103_LIVE: 1.0.3 is free with an optional tip;
// 1.0.2 sold a one-time preset unlock.

const Terms = () => (
  <PageLayout title="Terms of Service" lastUpdated="Last updated: September 2026">
    <PageSection title="Health notice">
      <p>
        Loop is a wellness tool, not a medical device. It cannot diagnose, treat, cure, or
        prevent any disease. If you experience any adverse effects, stop using the app.
      </p>
    </PageSection>

    <PageSection title="What this app does">
      <p>
        Loop is a meditation timer and sound player. Your meditation sessions can optionally
        be saved to Apple Health. Your sessions, presets and settings stay on your device or in
        your personal iCloud account.
      </p>
    </PageSection>

    <PageSection title="Your responsibilities">
      <p>
        Use the app lawfully and for personal use. You are responsible for any content you import
        into the app and for keeping your device secure.
      </p>
    </PageSection>

    <PageSection title="Purchases">
      {APP_103_LIVE ? (
        <>
          <p>
            Loop is free. Every feature is included, unlimited presets too, and nothing is
            paywalled. There is no subscription.
          </p>
          <p>
            There is one optional in-app purchase: a tip, which you can leave from App Settings,
            more than once if you like. A tip unlocks nothing and changes nothing. If you bought
            the preset unlock in an earlier version, nothing changes for you.
          </p>
          <p>Apple handles payment and refunds through the App Store.</p>
        </>
      ) : (
        <>
          <p>
            Loop is free to download, and there is no subscription. The timer, every sound
            and your imports are included. One preset is free; more presets are a one-time in-app
            purchase.
          </p>
          <p>Apple handles payment and refunds through the App Store.</p>
        </>
      )}
    </PageSection>

    <PageSection title="Privacy">
      <p>
        See the <Link to="/privacy">Privacy Policy</Link> for details. In short: we don&rsquo;t
        operate servers and we don&rsquo;t require an account. Your data is stored on your device
        and, if you use iCloud sync, in your personal iCloud account. The app sends anonymous
        usage statistics, which you can turn off in App Settings. Health data is only written to
        Apple Health if you allow it.
      </p>
    </PageSection>

    <PageSection title="Changes">
      <p>
        We may update these terms as the app evolves. Significant changes will be noted in the
        app or on this page.
      </p>
    </PageSection>

    <PageSection title="Contact">
      <p>
        Questions about these terms? Reach us at <a href="mailto:hello@opus.ro">hello@opus.ro</a>.
      </p>
    </PageSection>
  </PageLayout>
);

export default Terms;

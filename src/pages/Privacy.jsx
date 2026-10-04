import { APP_103_LIVE } from '../content/copy';
import PageLayout, { PageSection } from '../components/PageLayout';

// Mirrors the in-app policy (App Settings > Privacy Policy, AppSettingsView.swift).
// [103] lines describe iOS 1.0.3 and switch on VITE_APP_103_LIVE; the fallbacks
// are true for 1.0.2, where heart rate still travelled with the session history.

const Privacy = () => (
  <PageLayout
    title="Privacy Policy"
    lastUpdated="Last updated: September 2026"
    intro={
      <p>
        OPUS runs no servers for Loop. Your data stays on your device and in your own iCloud
        account, and we don&rsquo;t sell or share it. Apart from iCloud sync and Apple services
        you choose to use, such as Apple Music, the only thing the app sends is anonymous usage
        statistics, described below, and you can turn them off.
      </p>
    }
  >
    <PageSection title="Your data stays local">
      <p>
        Your meditation sessions, presets, and settings are stored on your device and, with
        iCloud sync on (the default), in your personal iCloud account. We have no access to it.
        No accounts, no emails, no names required.
      </p>
    </PageSection>

    <PageSection title="Apple Health (optional)">
      {APP_103_LIVE ? (
        <p>
          When you allow access to Apple Health, Loop writes your meditation sessions as mindful
          minutes to the Health app on your device. During a Mind &amp; Body session it also reads
          your heart rate from Apple Watch. Heart rate is kept with the session on this device and
          in the Health app. It is never written to iCloud and never sent to analytics. You can
          turn this off per preset in the app, or in iOS Settings.
        </p>
      ) : (
        <p>
          When you allow access to Apple Health, Loop writes your meditation sessions as mindful
          minutes to the Health app on your device. During a Mind &amp; Body session it also reads
          your heart rate from Apple Watch. Heart rate is kept with the session history: on this
          device, in the Health app and, if iCloud sync is on, in your personal iCloud account.
          It is never sent to analytics. You can turn this off per preset in the app, or in iOS
          Settings.
        </p>
      )}
    </PageSection>

    <PageSection title="Anonymous analytics">
      <p>
        Loop uses TelemetryDeck to collect anonymous usage data: which features are used, and
        how long sessions last. Each signal carries a random install identifier, hashed before it
        is sent, so repeat use can be counted without knowing who you are. No name, email or
        account is involved, content names are never sent, and health data is never sent.
      </p>
      <p>
        Analytics are on by default. You can turn them off with the Anonymous Analytics switch in
        App Settings.
      </p>
    </PageSection>

    <PageSection title="iCloud sync (optional)">
      <p>
        iCloud sync is on by default, and you can turn it off in App Settings. With it on, your
        sessions, presets and soundtracks are stored in your personal iCloud account. Only you
        can access this data. Apple&rsquo;s privacy policy governs iCloud storage. You can manage
        the app&rsquo;s folder in iCloud Drive from the Files app on iOS or Finder on Mac.
      </p>
    </PageSection>

    {APP_103_LIVE && (
      <PageSection title="Tips (optional)">
        <p>
          If you leave a tip, Apple handles the payment. Loop never sees your payment
          details, and a tip is never reported to analytics. The only thing kept on your device
          is a count of how many tips you have left, used to label the button. A tip unlocks
          nothing.
        </p>
      </PageSection>
    )}

    <PageSection title="Your rights">
      <p>
        You can delete all your data by uninstalling the app or clearing iCloud storage. You can
        manage health permissions in iOS Settings &gt; Privacy &amp; Security &gt; Health.
      </p>
    </PageSection>

    <PageSection title="This website">
      <p>
        This website uses no analytics and sets no cookies. Your browser fetches its fonts from
        Google Fonts. Apart from the files it caches so the web player works offline, the only
        thing it remembers is whether you paused motion, kept in your browser&rsquo;s local
        storage. Audio you open in the web player stays in your browser and is never uploaded.
      </p>
    </PageSection>

    <PageSection title="Contact">
      <p>
        If you have questions about this privacy policy, contact us at{' '}
        <a href="mailto:hello@opus.ro">hello@opus.ro</a>.
      </p>
    </PageSection>
  </PageLayout>
);

export default Privacy;

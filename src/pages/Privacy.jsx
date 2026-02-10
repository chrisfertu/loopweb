import PageLayout from '../components/PageLayout';

const Privacy = () => (
  <PageLayout title="Privacy Policy" lastUpdated="Last updated: February 2026">
    <div className="legal-section">
      <p>
        OPUS Loop does not operate any servers. All your data stays on your device
        or in your personal iCloud account. We don&rsquo;t sell or share your data.
      </p>
    </div>

    <div className="legal-section">
      <h2>Your Data Stays Local</h2>
      <p>
        Your meditation sessions, presets, and settings are stored only on your device.
        If you enable iCloud sync, data is stored in your personal iCloud account.
        We have no access to it. No accounts, no emails, no names required.
      </p>
    </div>

    <div className="legal-section">
      <h2>Apple Health (Optional)</h2>
      <p>
        When you enable Health sync, OPUS Loop writes your meditation sessions as
        mindful minutes to the Health app on your device. This data is managed by
        Apple&rsquo;s Health app. You can disable this anytime in Settings.
      </p>
    </div>

    <div className="legal-section">
      <h2>Anonymous Analytics</h2>
      <p>
        OPUS Loop uses TelemetryDeck, a privacy-focused analytics service, to collect
        minimal, anonymized usage data such as which features are used and session
        duration ranges. This helps us improve the app. TelemetryDeck does not collect
        personal identifiers and cannot track individual users. No personal data leaves
        your device.
      </p>
    </div>

    <div className="legal-section">
      <h2>iCloud Sync (Optional)</h2>
      <p>
        If you enable iCloud sync, your sessions, presets, and soundtracks are stored
        in your personal iCloud account. Only you can access this data. Apple&rsquo;s
        privacy policy governs iCloud storage. You can manage your OPUS Loop files
        from the Files app on iOS or Finder on Mac.
      </p>
    </div>

    <div className="legal-section">
      <h2>Your Rights</h2>
      <p>
        You can delete all your data by uninstalling the app or clearing iCloud storage.
        You can manage health permissions in iOS Settings &gt; Privacy &amp; Security &gt; Health.
      </p>
    </div>

    <div className="legal-section">
      <h2>Contact</h2>
      <p>
        If you have questions about this privacy policy, contact us at{' '}
        <a href="mailto:hello@opus.ro">hello@opus.ro</a>.
      </p>
    </div>
  </PageLayout>
);

export default Privacy;

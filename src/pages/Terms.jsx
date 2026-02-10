import PageLayout from '../components/PageLayout';

const Terms = () => (
  <PageLayout title="Terms of Service" lastUpdated="Last updated: February 2026">
    <div className="legal-section">
      <h2>Health Notice</h2>
      <p>
        OPUS Loop is a wellness tool, not a medical device. It cannot diagnose, treat,
        cure, or prevent any disease. If you experience any adverse effects, stop using the app.
      </p>
    </div>

    <div className="legal-section">
      <h2>What This App Does</h2>
      <p>
        OPUS Loop is a meditation timer and sound player. Your meditation sessions can
        optionally be saved to Apple Health. All data stays on your device or in your
        personal iCloud account.
      </p>
    </div>

    <div className="legal-section">
      <h2>Your Responsibilities</h2>
      <p>
        Use the app lawfully and for personal use. You are responsible for any content
        you import into the app and for keeping your device secure.
      </p>
    </div>

    <div className="legal-section">
      <h2>Purchases</h2>
      <p>
        OPUS Loop is a one-time purchase. There are no subscriptions, no in-app purchases,
        and no &ldquo;Pro&rdquo; upgrades. All features are included. Refunds are handled
        by Apple through the App Store.
      </p>
    </div>

    <div className="legal-section">
      <h2>Privacy</h2>
      <p>
        See the <a href="/privacy">Privacy Policy</a> for details. In short: we don&rsquo;t
        operate servers, we don&rsquo;t store your data, and we don&rsquo;t require an account.
        Health data is only written to Apple Health if you explicitly enable it.
      </p>
    </div>

    <div className="legal-section">
      <h2>Changes</h2>
      <p>
        We may update these terms as the app evolves. Significant changes will be noted
        in the app or on this page.
      </p>
    </div>

    <div className="legal-section">
      <h2>Contact</h2>
      <p>
        Questions about these terms? Reach us at{' '}
        <a href="mailto:hello@opus.ro">hello@opus.ro</a>.
      </p>
    </div>
  </PageLayout>
);

export default Terms;

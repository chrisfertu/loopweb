import { useLocation } from 'react-router-dom';
import PageLayout, { PageSection } from '../components/PageLayout';
import CtaRow from '../components/landing/CtaRow';

// Where the App Clip's QR codes land when the phone cannot open an App Clip
// (Android, an older iPhone, a desktop camera). The codes on the coasters and
// stickers encode https://opusloop.co/clip?s=coaster (or s=sticker); an iPhone
// opens the App Clip instead and never sees this page.
const Clip = () => {
  const source = new URLSearchParams(useLocation().search).get('s');

  return (
    <PageLayout
      title="This code opens Loop on an iPhone."
      docTitle="Open on iPhone"
      intro={
        <p>
          On an iPhone, it starts a short session in Loop without installing anything. This phone
          could not open it, but you can still get the app, or try Loop in your browser.
        </p>
      }
    >
      <PageSection title="The app">
        <p>
          Loop is a meditation timer for iPhone, iPad and Apple Watch. Set a time, choose a sound
          or silence, and press play. No account, no ads and no subscription.
        </p>
        {source === 'coaster' && <p>The coaster is yours to keep.</p>}
      </PageSection>
      <CtaRow />
    </PageLayout>
  );
};

export default Clip;

import { memo } from 'react';
import GeometryField from '../geometry/GeometryField';
import ListenProvider from '../components/landing/ListenProvider';
import DeviceStory from './home/DeviceStory';
import SoundSection from './home/SoundSection';
import YourSoundsSection from './home/YourSoundsSection';
import BellsSection from './home/BellsSection';
import PresetsSection from './home/PresetsSection';
import DevicesSection from './home/DevicesSection';
import PrivacySection from './home/PrivacySection';
import FreeSection from './home/FreeSection';

// The landing page: one fixed geometry field behind every section.
//
// - The skip link ("Skip to download" → #download) lives in the Header, so it
//   is the first tab stop on the page. FreeSection's CtaRow carries the
//   `download` id.
// - GeometryField is memoised and reads no context; the sections are memoised
//   and read only useTimerState(), so a running /player session never
//   re-renders this tree once a second.
// - App renders the Footer, after <main>.
// - Scroll position on arrival is App's ScrollToTop; nothing here scrolls.
const Home = memo(function Home() {
  return (
    <>
      <GeometryField />
      <ListenProvider>
        <div className="relative z-10">
          <DeviceStory />
          <SoundSection />
          <YourSoundsSection />
          <BellsSection />
          <DevicesSection />
          <PresetsSection />
          <PrivacySection />
          <FreeSection />
        </div>
      </ListenProvider>
    </>
  );
});

export default Home;

import { Link } from 'react-router-dom';
import PageLayout, { PageSection } from '../components/PageLayout';

// The catch-all route.
const NotFound = () => (
  <PageLayout title="This page does not exist." docTitle="Not found">
    <PageSection>
      <p>
        The link may be old, or the address mistyped. Start again from the{' '}
        <Link to="/">home page</Link>, or open the <Link to="/player">web player</Link>.
      </p>
    </PageSection>
  </PageLayout>
);

export default NotFound;

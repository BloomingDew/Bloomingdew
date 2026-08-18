import CustomClient from './CustomClient';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata({
  title: 'Made for You',
  description: "Order a Bloomingdew piece in a size we don't stock, or have one made entirely to your measurements. Made-to-order pieces are ready in 7–10 days.",
  path: '/custom',
});

export default function Page() {
  return <CustomClient />;
}

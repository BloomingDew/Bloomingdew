import type { Metadata } from 'next';
import CustomClient from './CustomClient';

const description =
  "Order a Bloomingdew piece in a size we don't stock, or have one made entirely to your measurements. Made-to-order pieces are ready in 7–10 days.";

export const metadata: Metadata = {
  title: 'Made for You',
  description,
  alternates: { canonical: '/custom' },
  openGraph: { title: 'Made for You | Bloomingdew', description, url: '/custom' },
};

export default function Page() {
  return <CustomClient />;
}

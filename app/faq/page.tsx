import type { Metadata } from 'next';
import FaqClient from './FaqClient';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers on delivery times, sizing and fit, made-to-order pricing, international shipping and our final-sale policy.',
  alternates: { canonical: '/faq' },
  openGraph: { title: 'FAQ | Bloomingdew', description: 'Answers on delivery times, sizing and fit, made-to-order pricing, international shipping and our final-sale policy.', url: '/faq' },
};

export default function Page() {
  return <FaqClient />;
}

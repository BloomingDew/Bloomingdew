import FaqClient from './FaqClient';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata({
  title: 'FAQ',
  description: "Answers on delivery times, sizing and fit, made-to-order pricing, international shipping and our final-sale policy.",
  path: '/faq',
});

export default function Page() {
  return <FaqClient />;
}

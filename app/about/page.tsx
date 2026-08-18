import AboutClient from './AboutClient';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata({
  title: 'About',
  description: "The story behind Bloomingdew — a Lagos studio making clothing by hand, one piece at a time, for women who want something with intention behind it.",
  path: '/about',
});

export default function Page() {
  return <AboutClient />;
}

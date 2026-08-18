import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About',
  description: 'The story behind Bloomingdew — a Lagos studio making clothing by hand, one piece at a time, for women who want something with intention behind it.',
  alternates: { canonical: '/about' },
  openGraph: { title: 'About | Bloomingdew', description: 'The story behind Bloomingdew — a Lagos studio making clothing by hand, one piece at a time, for women who want something with intention behind it.', url: '/about' },
};

export default function Page() {
  return <AboutClient />;
}

import type { Metadata } from 'next';
import ShopClient from './ShopClient';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse the Bloomingdew collection — handcrafted dresses, sets and bubus in sizes 12–18, cut in Lagos and shipped worldwide.',
  alternates: { canonical: '/shop' },
  openGraph: { title: 'Shop | Bloomingdew', description: 'Browse the Bloomingdew collection — handcrafted dresses, sets and bubus in sizes 12–18, cut in Lagos and shipped worldwide.', url: '/shop' },
};

export default function Page() {
  return <ShopClient />;
}

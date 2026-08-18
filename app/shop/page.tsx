import ShopClient from './ShopClient';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata({
  title: 'Shop',
  description: "Browse the Bloomingdew collection — handcrafted dresses, sets and bubus in sizes 12–18, cut in Lagos and shipped worldwide.",
  path: '/shop',
});

export default function Page() {
  return <ShopClient />;
}

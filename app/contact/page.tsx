import ContactClient from './ContactClient';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata({
  title: 'Contact',
  description: "Questions about sizing, a custom piece or an order already placed? Reach the Bloomingdew studio by email, WhatsApp or the contact form.",
  path: '/contact',
});

export default function Page() {
  return <ContactClient />;
}

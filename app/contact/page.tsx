import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Questions about sizing, a custom piece or an order already placed? Reach the Bloomingdew studio by email, WhatsApp or the contact form.',
  alternates: { canonical: '/contact' },
  openGraph: { title: 'Contact | Bloomingdew', description: 'Questions about sizing, a custom piece or an order already placed? Reach the Bloomingdew studio by email, WhatsApp or the contact form.', url: '/contact' },
};

export default function Page() {
  return <ContactClient />;
}

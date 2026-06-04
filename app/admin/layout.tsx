import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bloomingdew Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Completely bypass the root layout (no navbar/footer)
  return children;
}

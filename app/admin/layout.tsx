import type { Metadata } from 'next';
import AdminTopbar from '../../components/AdminTopbar';

export const metadata: Metadata = {
  title: 'Bloomingdew Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      <AdminTopbar />
      {children}
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireApprovedUser } from '@/lib/authz';
import Dashboard from './dashboard/Dashboard';

export const metadata = {
  title: 'دراسة الكتاب المقدس',
  description: 'إدارة الحضور وقراءة الإنجيل والنوتة الروحية',
};

export const viewport = 'width=device-width,initial-scale=1,theme-color=#2563EB';

export default async function Home() {
  const session = await requireApprovedUser();

  if (!session) {
    redirect('/login');
  }

  return <Dashboard />;
}
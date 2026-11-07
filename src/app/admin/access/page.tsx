
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import AccessRequests from './AccessRequests';

export default async function AccessPage() {
  const session = await requireAdmin();

  if (!session) {
    redirect('/login');
  }

  return <AccessRequests />;
}


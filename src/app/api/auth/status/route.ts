import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: { email: (session.user as any).email, name: (session.user as any).name },
  });
}
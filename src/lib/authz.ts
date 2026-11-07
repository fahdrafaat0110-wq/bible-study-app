
import { getServerSession } from 'next-auth/next';
import { authOptions, isAllowedEmail } from './auth';
import { prisma } from './prisma';

// Super Admin only
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = (session?.user as any)?.email ?? null;

  if (!email || !isAllowedEmail(email)) {
    return null;
  }

  return session;
}

// Super Admin or an approved user
export async function requireApprovedUser() {
  const session = await getServerSession(authOptions);

  const email = (session?.user as any)?.email
    ?.trim()
    .toLowerCase();

  const googleId = (session?.user as any)?.googleId;

  if (!session || !email) {
    return null;
  }

  // Super Admin has permanent access
  if (isAllowedEmail(email)) {
    return session;
  }

  // Every other user must be approved in the database
  if (!googleId) {
    return null;
  }

  const request = await prisma.accessRequest.findUnique({
    where: { googleId },
    select: { email: true, status: true },
  });

  if (
    !request ||
    request.email.toLowerCase() !== email ||
    request.status !== 'APPROVED'
  ) {
    return null;
  }

  return session;
}

export async function requireAdminOrThrow() {
  const session = await requireAdmin();

  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

export async function requireApprovedUserOrThrow() {
  const session = await requireApprovedUser();

  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

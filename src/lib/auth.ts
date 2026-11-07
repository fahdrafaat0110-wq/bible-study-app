
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8,
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === 'google') {
        if (user?.email) {
          token.email = user.email;
        }

        if (account.providerAccountId) {
          (token as any).googleId = account.providerAccountId;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (token.email) {
          (session.user as any).email = token.email;
        }

        (session.user as any).isSuperAdmin = isAllowedEmail(
          (session.user as any).email
        );

        (session.user as any).googleId =
          (token as any).googleId;
      }

      return session;
    },

    async signIn({ user, account }) {
      if (account?.provider !== 'google') {
        return false;
      }

      const email = user.email?.trim().toLowerCase();
      const googleId = account.providerAccountId;

      if (!email || !googleId) {
        return false;
      }

      // Super Admin
      if (isAllowedEmail(email)) {
        await prisma.admin.upsert({
          where: { googleId },
          update: {
            email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
          create: {
            googleId,
            email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });

        return true;
      }

      // Find existing access request
      let request = await prisma.accessRequest.findUnique({
        where: { googleId },
      });

      // Check existing email if Google ID is different
      if (!request) {
        request = await prisma.accessRequest.findUnique({
          where: { email },
        });

        if (request) {
          request = await prisma.accessRequest.update({
            where: { id: request.id },
            data: {
              googleId,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            },
          });
        }
      }

      // Create a new request
      if (!request) {
        await prisma.accessRequest.create({
          data: {
            googleId,
            email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            status: 'PENDING',
          },
        });

        return '/login?error=Pending';
      }

      // Check access status
      if (request.status === 'APPROVED') {
        return true;
      }

      if (request.status === 'REJECTED') {
        return '/login?error=Rejected';
      }

      if (request.status === 'REVOKED') {
        return '/login?error=Revoked';
      }

      return '/login?error=Pending';
    },
  },
};

export default authOptions;

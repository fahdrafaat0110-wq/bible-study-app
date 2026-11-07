import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Idempotent: only seed when the database is empty.
  const existingAdmin = await prisma.admin.count();
  if (existingAdmin > 0) {
    console.log('Database already seeded — skipping.');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim();
  if (!adminEmail) {
    console.log('No ADMIN_EMAILS set — creating a placeholder admin (replace in production).');
  }

  await prisma.admin.create({
    data: {
      googleId: 'seed-placeholder',
      email: adminEmail || 'admin@example.com',
      name: 'Admin',
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
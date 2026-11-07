
import { NextResponse } from 'next/server';
import { requireApprovedUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { updateMemberSchema } from '@/lib/validators';
import { computeAge } from '@/lib/age';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireApprovedUser();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const parsed = updateMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { fullName, phoneNumber, dateOfBirth, college } = parsed.data;

  const dup = await prisma.member.findFirst({
    where: {
      fullName,
      phoneNumber,
      id: { not: params.id },
    },
  });

  if (dup) {
    return NextResponse.json(
      {
        error: 'ظ‡ط°ط§ ط§ظ„ط§ط³ظ… ظˆط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ظ…ط³ط¬ظ„ظٹظ† ط¨ط§ظ„ظپط¹ظ„ ظ„-member ط¢ط®ط±',
      },
      { status: 409 }
    );
  }

  const member = await prisma.member.update({
    where: { id: params.id },
    data: {
      fullName,
      phoneNumber,
      dateOfBirth: new Date(dateOfBirth),
      college,
    },
  });

  return NextResponse.json({
    ...member,
    age: computeAge(member.dateOfBirth),
    dateOfBirth: member.dateOfBirth.toISOString().split('T')[0],
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireApprovedUser();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  await prisma.member.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
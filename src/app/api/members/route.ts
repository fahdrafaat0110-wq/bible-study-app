
import { NextResponse } from 'next/server';
import { requireApprovedUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { createMemberSchema } from '@/lib/validators';
import { computeAge } from '@/lib/age';

// GET /api/members - all members with their current meeting activity.
export async function GET(req: Request) {
  const session = await requireApprovedUser();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  const where = q
    ? {
        OR: [
          { fullName: { contains: q } },
          { phoneNumber: { contains: q } },
        ],
      }
    : {};

  const members = await prisma.member.findMany({
    where,
    orderBy: { fullName: 'asc' },
    include: {
      activities: {
        include: { meeting: true },
        orderBy: { meeting: { meetingDate: 'desc' } },
      },
    },
  });

  const data = members.map((m) => ({
    ...m,
    age: computeAge(m.dateOfBirth),
    dateOfBirth: m.dateOfBirth.toISOString().split('T')[0],
    activities: m.activities.map((a) => ({
      ...a,
      meetingDate: a.meeting.meetingDate.toISOString().split('T')[0],
    })),
  }));

  return NextResponse.json(data);
}

// POST /api/members - register a member once.
export async function POST(req: Request) {
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

  const parsed = createMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { fullName, phoneNumber, dateOfBirth, college } = parsed.data;

  // Duplicate detection: same full name and phone number.
  const existing = await prisma.member.findFirst({
    where: { fullName, phoneNumber },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Member already exists with the same name and phone number.' },
      { status: 409 }
    );
  }

  const member = await prisma.member.create({
    data: {
      fullName,
      phoneNumber,
      dateOfBirth: new Date(dateOfBirth),
      college,
    },
  });

  return NextResponse.json(
    {
      ...member,
      age: computeAge(member.dateOfBirth),
      dateOfBirth: member.dateOfBirth.toISOString().split('T')[0],
    },
    { status: 201 }
  );
}

import { NextResponse } from 'next/server';
import { requireApprovedUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { createMeetingSchema } from '@/lib/validators';

// GET /api/meetings - all meetings with derived status.
export async function GET(req: Request) {
  const session = await requireApprovedUser();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date')?.trim() ?? '';

  const where = date ? { meetingDate: new Date(date) } : {};

  const meetings = await prisma.meeting.findMany({
    where,
    include: {
      _count: { select: { activities: true } },
    },
    orderBy: { meetingDate: 'desc' },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data = meetings.map((m) => {
    const md = new Date(m.meetingDate);
    md.setHours(0, 0, 0, 0);

    let status: 'current' | 'upcoming' | 'past';

    if (md.getTime() === today.getTime()) {
      status = 'current';
    } else if (md.getTime() > today.getTime()) {
      status = 'upcoming';
    } else {
      status = 'past';
    }

    return {
      id: m.id,
      title: m.title,
      meetingDate: m.meetingDate.toISOString().split('T')[0],
      createdAt: m.createdAt.toISOString(),
      memberCount: m._count.activities,
      status,
    };
  });

  return NextResponse.json(data);
}

// POST /api/meetings - create a new meeting.
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

  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { title, meetingDate } = parsed.data;

  // Prevent duplicate meeting on the same date with the same title.
  const dup = await prisma.meeting.findFirst({
    where: {
      title,
      meetingDate: new Date(meetingDate),
    },
  });

  if (dup) {
    return NextResponse.json(
      { error: 'Meeting titled this on this date already exists' },
      { status: 409 }
    );
  }

  const meeting = await prisma.meeting.create({
    data: {
      title,
      meetingDate: new Date(meetingDate),
    },
  });

  // Create one activity row per member, all unchecked.
  const members = await prisma.member.findMany({
    select: { id: true },
  });

  if (members.length > 0) {
    await prisma.memberActivity.createMany({
      data: members.map((m) => ({
        memberId: m.id,
        meetingId: meeting.id,
        attendanceStatus: false,
        bibleReadingStatus: false,
        spiritualNoteStatus: false,
      })),
    });
  }

  return NextResponse.json(
    {
      id: meeting.id,
      title: meeting.title,
      meetingDate: meeting.meetingDate.toISOString().split('T')[0],
      createdAt: meeting.createdAt.toISOString(),
      memberCount: members.length,
      status: 'upcoming',
    },
    { status: 201 }
  );
}
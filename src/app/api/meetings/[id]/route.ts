
import { NextResponse } from 'next/server';
import { requireApprovedUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { createMeetingSchema } from '@/lib/validators';

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

  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { title, meetingDate } = parsed.data;

  const dup = await prisma.meeting.findFirst({
    where: {
      title,
      meetingDate: new Date(meetingDate),
      id: { not: params.id },
    },
  });

  if (dup) {
    return NextResponse.json(
      { error: 'Another meeting with this title on this date exists' },
      { status: 409 }
    );
  }

  try {
    const meeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        title,
        meetingDate: new Date(meetingDate),
      },
    });

    return NextResponse.json({
      id: meeting.id,
      title: meeting.title,
      meetingDate: meeting.meetingDate.toISOString().split('T')[0],
      createdAt: meeting.createdAt.toISOString(),
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    throw error;
  }
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

  try {
    // Cascading delete removes activity rows too.
    await prisma.meeting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    throw error;
  }
}
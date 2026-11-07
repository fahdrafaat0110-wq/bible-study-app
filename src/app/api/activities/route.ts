
import { NextResponse } from 'next/server';
import { requireApprovedUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { activityPatchSchema } from '@/lib/validators';

/**
 * PATCH /api/activities
 *
 * The single atomic save point for the four independent checkboxes.
 */
export async function PATCH(req: Request) {
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

  const parsed = activityPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const {
    memberId,
    meetingId,
    attendance,
    bibleReading,
    spiritualNote,
    preparation,
  } = parsed.data;

  const data: any = {};

  if (attendance !== undefined) {
    data.attendanceStatus = attendance;
  }

  if (bibleReading !== undefined) {
    data.bibleReadingStatus = bibleReading;
  }

  if (spiritualNote !== undefined) {
    data.spiritualNoteStatus = spiritualNote;
  }

  if (preparation !== undefined) {
    data.preparationStatus = preparation;
  }

  try {
    const activity = await prisma.memberActivity.upsert({
      where: {
        member_meeting_unique: { memberId, meetingId },
      },
      update: data,
      create: {
        memberId,
        meetingId,
        attendanceStatus: data.attendanceStatus ?? false,
        bibleReadingStatus: data.bibleReadingStatus ?? false,
        spiritualNoteStatus: data.spiritualNoteStatus ?? false,
        preparationStatus: data.preparationStatus ?? false,
      },
      include: {
        member: true,
        meeting: true,
      },
    });

    return NextResponse.json({
      ok: true,
      activity: {
        id: activity.id,
        memberId: activity.memberId,
        meetingId: activity.meetingId,
        attendance: activity.attendanceStatus,
        bibleReading: activity.bibleReadingStatus,
        spiritualNote: activity.spiritualNoteStatus,
        preparation: activity.preparationStatus,
        updatedAt: activity.updatedAt.toISOString(),
        memberName: activity.member.fullName,
        meetingDate: activity.meeting.meetingDate
          .toISOString()
          .split('T')[0],
      },
    });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate record prevented by unique constraint' },
        { status: 409 }
      );
    }

    throw e;
  }
}
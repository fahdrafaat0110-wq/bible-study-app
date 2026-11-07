
import { NextResponse } from 'next/server';
import { requireApprovedUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { computeAge } from '@/lib/age';
import * as XLSX from 'xlsx';

type ExportType =
  | 'attendance'
  | 'bible-reading'
  | 'spiritual-notes'
  | 'members';

const VALID_TYPES: ExportType[] = [
  'attendance',
  'bible-reading',
  'spiritual-notes',
  'members',
];

export async function GET(
  req: Request,
  { params }: { params: { type: string } }
) {
  const session = await requireApprovedUser();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const type = params.type as ExportType;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: 'Invalid export type' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const meetingId = searchParams.get('meetingId') ?? undefined;

  try {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'members': {
        const members = await prisma.member.findMany({
          orderBy: { fullName: 'asc' },
        });

        data = members.map((m) => {
          const age = computeAge(m.dateOfBirth);

          return {
            Name: m.fullName,
            Phone: m.phoneNumber,
            Age: age,
            DateOfBirth: m.dateOfBirth.toISOString().split('T')[0],
            College: m.college,
            RegistrationDate: m.createdAt.toISOString().split('T')[0],
          };
        });

        filename = `members_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      }

      case 'attendance': {
        if (!meetingId) {
          return NextResponse.json(
            { error: 'meetingId required for attendance export' },
            { status: 400 }
          );
        }

        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
        });

        const activities = await prisma.memberActivity.findMany({
          where: { meetingId },
          include: { member: true },
        });

        data = activities.map((a) => ({
          Name: a.member.fullName,
          Phone: a.member.phoneNumber,
          Attendance: a.attendanceStatus ? 'Present' : 'Absent',
          MeetingDate:
            meeting?.meetingDate.toISOString().split('T')[0] || '',
        }));

        filename = `attendance_${meeting?.meetingDate.toISOString().split('T')[0] || 'unknown'}.xlsx`;
        break;
      }

      case 'bible-reading': {
        if (!meetingId) {
          return NextResponse.json(
            { error: 'meetingId required for bible-reading export' },
            { status: 400 }
          );
        }

        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
        });

        const activities = await prisma.memberActivity.findMany({
          where: { meetingId },
          include: { member: true },
        });

        data = activities.map((a) => ({
          Name: a.member.fullName,
          Phone: a.member.phoneNumber,
          BibleReading: a.bibleReadingStatus ? 'Completed' : 'Not Completed',
          MeetingDate:
            meeting?.meetingDate.toISOString().split('T')[0] || '',
        }));

        filename = `bible_reading_${meeting?.meetingDate.toISOString().split('T')[0] || 'unknown'}.xlsx`;
        break;
      }

      case 'spiritual-notes': {
        if (!meetingId) {
          return NextResponse.json(
            { error: 'meetingId required for spiritual-notes export' },
            { status: 400 }
          );
        }

        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
        });

        const activities = await prisma.memberActivity.findMany({
          where: { meetingId },
          include: { member: true },
        });

        data = activities.map((a) => ({
          Name: a.member.fullName,
          Phone: a.member.phoneNumber,
          SpiritualNote: a.spiritualNoteStatus ? 'Recorded' : 'Not Recorded',
          MeetingDate:
            meeting?.meetingDate.toISOString().split('T')[0] || '',
        }));

        filename = `spiritual_notes_${meeting?.meetingDate.toISOString().split('T')[0] || 'unknown'}.xlsx`;
        break;
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, 'Export');

    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (e) {
    console.error('Export error:', e);

    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
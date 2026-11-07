export interface Member {
  id: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  college: string;
  createdAt: string;
  updatedAt: string;
  age: number;
}

export interface Meeting {
  id: string;
  title: string;
  meetingDate: string;
  createdAt: string;
  memberCount: number;
  status: 'current' | 'upcoming' | 'past';
}

export interface MemberActivity {
  id: string;
  memberId: string;
  meetingId: string;
  attendanceStatus: boolean;
  bibleReadingStatus: boolean;
  spiritualNoteStatus: boolean;
  preparationStatus: boolean;
  createdAt: string;
  updatedAt: string;
  meetingDate: string;
  memberName?: string;
}

export interface MemberWithActivities extends Member {
  activities: MemberActivity[];
}
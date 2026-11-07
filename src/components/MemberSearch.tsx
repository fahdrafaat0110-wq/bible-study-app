'use client';

import { useState, useEffect, useMemo } from 'react';
import { MemberWithActivities } from '@/types';

interface MemberSearchProps {
  query: string;
  onChange: (q: string) => void;
  members: MemberWithActivities[];
  currentMeetingId: string | null;
  onActivityChange: (memberId: string, field: 'attendance' | 'bibleReading' | 'spiritualNote', value: boolean) => void;
  loading: boolean;
}

export default function MemberSearch({
  query,
  onChange,
  members,
  currentMeetingId,
  onActivityChange,
  loading,
}: MemberSearchProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Find the current meeting's activity for each member
  const membersWithCurrentActivity = useMemo(() => {
    return members.map((member) => {
      const activity = member.activities.find((a) => a.meetingId === currentMeetingId) || {
        attendanceStatus: false,
        bibleReadingStatus: false,
        spiritualNoteStatus: false,
      };
      return { ...member, currentActivity: activity };
    });
  }, [members, currentMeetingId]);

  // Debounced search - client-side filtering of already fetched members
  const filteredMembers = useMemo(() => {
    if (!query.trim()) return membersWithCurrentActivity;
    const q = query.trim().toLowerCase();
    return membersWithCurrentActivity.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.phoneNumber.includes(q)
    );
  }, [query, membersWithCurrentActivity]);

  const handleCheckbox = (
    memberId: string,
    field: 'attendance' | 'bibleReading' | 'spiritualNote',
    checked: boolean
  ) => {
    if (!currentMeetingId) return;
    onActivityChange(memberId, field, checked);
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-pulseSoft text-primary text-lg">جاري البحث...</div>
      </div>
    );
  }

  if (!currentMeetingId) {
    return (
      <div className="card p-8 text-center text-muted">
        لا يوجد اجتماع حالي محدد. اختر اجتماعاً من القائمة أعلاه.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-border bg-gray-50">
        <label htmlFor="search" className="sr-only">البحث عن عضو</label>
        <div className="relative">
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ابحث عن اسم العضو..."
            className="input pl-12 pr-4 py-3 text-lg"
            autoComplete="off"
            autoFocus
          />
          {query && (
            <button
              onClick={() => onChange('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              aria-label="مسح البحث"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-muted mt-2">
          {filteredMembers.length} من {members.length} عضو{' '}
          {query && <span className="text-primary">(تصفية: "{query}")</span>}
        </p>
      </div>

      {/* Results */}
      <div className="divide-y divide-border/50">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-muted">
            {query ? 'لا يوجد أعضاء مطابقون للبحث' : 'لا يوجد أعضاء مسجلون بعد'}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isExpanded={expandedId === member.id}
              onToggle={() => setExpandedId(expandedId === member.id ? null : member.id)}
              onActivityChange={handleCheckbox}
              currentMeetingId={currentMeetingId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MemberCard({
  member,
  isExpanded,
  onToggle,
  onActivityChange,
  currentMeetingId,
}: {
  member: MemberWithActivities & { currentActivity: any };
  isExpanded: boolean;
  onToggle: () => void;
  onActivityChange: (memberId: string, field: 'attendance' | 'bibleReading' | 'spiritualNote', value: boolean) => void;
  currentMeetingId: string | null;
}) {
  const { currentActivity, fullName, phoneNumber, age, dateOfBirth, college } = member;
  const isAttended = currentActivity.attendanceStatus;
  const isBibleRead = currentActivity.bibleReadingStatus;
  const isSpiritualNoted = currentActivity.spiritualNoteStatus;

  return (
    <div className={`bg-white transition-colors ${isExpanded ? 'bg-blue-50' : ''}`}>
      {/* Main row - clickable to expand */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-4 text-right hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-lg">
                {fullName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-text truncate">{fullName}</h3>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span>{phoneNumber}</span>
                <span>{age} سنة</span>
                <span>{college}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <ActivityBadge label="حضور" checked={isAttended} />
          <ActivityBadge label="قراءة" checked={isBibleRead} />
          <ActivityBadge label="نوتة" checked={isSpiritualNoted} />
          <svg
            className={`w-5 h-5 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded: Three large independent checkboxes */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-border/50 animate-fadeSlide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CheckboxCard
              label="الحضور"
              icon={<AttendanceIcon />}
              checked={isAttended}
              onChange={(checked) => onActivityChange(member.id, 'attendance', checked)}
            />
            <CheckboxCard
              label="قراءة الإنجيل"
              icon={<BibleIcon />}
              checked={isBibleRead}
              onChange={(checked) => onActivityChange(member.id, 'bibleReading', checked)}
            />
            <CheckboxCard
              label="النوتة الروحية"
              icon={<NoteIcon />}
              checked={isSpiritualNoted}
              onChange={(checked) => onActivityChange(member.id, 'spiritualNote', checked)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CheckboxCard({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="relative cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div
        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
          ${checked
            ? 'bg-green-50 border-success'
            : 'bg-white border-border hover:border-primary/50'}`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
          ${checked ? 'bg-success text-white' : 'bg-gray-100 text-muted'}`}>
          {icon}
        </div>
        <span className={`font-semibold text-sm ${checked ? 'text-success' : 'text-text'}`}>
          {label}
        </span>
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200
          ${checked
            ? 'bg-success border-success text-white'
            : 'bg-white border-border text-transparent peer-checked:text-white peer-checked:bg-primary peer-checked:border-primary'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </label>
  );
}

function ActivityBadge({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span
      className={`badge px-2 py-1 text-xs ${checked ? 'badge-success' : 'badge-incomplete'}`}
    >
      {label}
    </span>
  );
}

function AttendanceIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function BibleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
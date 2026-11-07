
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MemberSearch from '@/components/MemberSearch';
import StatsCards from '@/components/StatsCards';
import { MemberWithActivities, Meeting } from '@/types';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<MemberWithActivities[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Fetch meetings
  useEffect(() => {
    async function fetchMeetings() {
      try {
        const res = await fetch('/api/meetings');
        if (res.ok) {
          const data: Meeting[] = await res.json();
          setMeetings(data);
          // Auto-select current meeting
          const current = data.find((m) => m.status === 'current');
          if (current) setSelectedMeetingId(current.id);
          else if (data.length > 0) setSelectedMeetingId(data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch meetings:', e);
      }
    }
    fetchMeetings();
  }, []);

  // Fetch members (with search)
  const fetchMembers = useCallback(async () => {
    if (!selectedMeetingId) return;
    setLoading(true);
    try {
      const url = new URL('/api/members', window.location.origin);
      if (searchQuery) url.searchParams.set('q', searchQuery);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data: MemberWithActivities[] = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error('Failed to fetch members:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedMeetingId, searchQuery]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Activity save handler
  const handleActivityChange = async (
    memberId: string,
    field: 'attendance' | 'bibleReading' | 'spiritualNote',
    value: boolean
  ) => {
    if (!selectedMeetingId) return;
    try {
      const res = await fetch('/api/activities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, meetingId: selectedMeetingId, [field]: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? { ...m, activities: m.activities.map((a) => (a.meetingId === selectedMeetingId ? { ...a, [field]: value } : a)) }
              : m
          )
        );
        showToast(`تم ${value ? 'تسجيل' : 'إلغاء'} ${getFieldLabel(field)}`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'حدث خطأ', 'error');
        fetchMembers();
      }
    } catch {
      showToast('فشل الاتصال بالخادم', 'error');
      fetchMembers();
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-pulseSoft text-primary text-xl">جاري التحميل...</div>
      </div>
    );
  }

  const currentMeeting = meetings.find((m) => m.id === selectedMeetingId);
  const stats = computeStats(members);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">
                {session?.user?.name?.charAt(0) || 'د'}
              </span>
            </div>
            <span className="text-xl font-bold text-text">دراسة الكتاب المقدس</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Meeting Selector */}
            <select
              value={selectedMeetingId || ''}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="input w-auto min-w-[180px]"
            >
              <option value="">اختر اجتماعاً</option>
              {meetings.map((m: Meeting) => (
                <option key={m.id} value={m.id}>
                  {m.title} — {m.meetingDate}
                </option>
              ))}
            </select>
            {/* User menu */}
            <div className="text-sm">
              <span className="text-muted">مسجل الدخول: {session?.user?.name || session?.user?.email}</span>
            </div>
          </div>
        </div>
        <nav className="md:flex justify-center gap-1 px-4 py-3 border-t border-border -mt-px hidden">
          <NavLink href="/">الرئيسية</NavLink>
          <NavLink href="/members">جميع الأعضاء</NavLink>
          <NavLink href="/attendance">تقرير الحضور</NavLink>
          <NavLink href="/bible-reading">قراءة الإنجيل</NavLink>
          <NavLink href="/spiritual-notes">النوتة الروحية</NavLink>
          <NavLink href="/meetings">سجل الاجتماعات</NavLink>

          {(session?.user as any)?.isSuperAdmin && (
            <NavLink href="/admin/access">إدارة طلبات الدخول</NavLink>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <StatsCards stats={stats} meetingTitle={currentMeeting?.title} meetingDate={currentMeeting?.meetingDate} />

        {/* Smart Search */}
        <div className="mt-6 animate-fadeSlide">
          <MemberSearch
            query={searchQuery}
            onChange={setSearchQuery}
            members={members}
            currentMeetingId={selectedMeetingId}
            onActivityChange={handleActivityChange}
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3 animate-fadeSlide">
          <Link href="/members" className="btn-primary">
            جميع الأعضاء
          </Link>
          <Link href="/attendance" className="btn-ghost">
            تقرير الحضور
          </Link>
          <Link href="/bible-reading" className="btn-ghost">
            تقرير القراءة
          </Link>
          <Link href="/spiritual-notes" className="btn-ghost">
            تقرير النوتة
          </Link>
          <Link href="/meetings" className="btn-ghost">
            سجل الاجتماعات
          </Link>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert">
          <span className="text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-xl text-sm font-medium text-muted hover:text-text hover:bg-gray-100 transition-colors whitespace-nowrap"
    >
      {children}
    </Link>
  );
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    attendance: 'الحضور',
    bibleReading: 'قراءة الإنجيل',
    spiritualNote: 'النوتة الروحية',
  };
  return labels[field] || field;
}

function computeStats(members: MemberWithActivities[]) {
  const total = members.length;
  if (total === 0) return { total: 0, attended: 0, bibleRead: 0, spiritualNoted: 0 };
  const attended = members.filter(m => m.activities.some(a => a.attendanceStatus)).length;
  const bibleRead = members.filter(m => m.activities.some(a => a.bibleReadingStatus)).length;
  const spiritualNoted = members.filter(m => m.activities.some(a => a.spiritualNoteStatus)).length;
  return { total, attended, bibleRead, spiritualNoted };
}

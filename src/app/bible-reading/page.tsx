'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MemberWithActivities, Meeting } from '@/types';
import * as XLSX from 'xlsx';

export default function BibleReadingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<MemberWithActivities[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'not_completed'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [mRes, meetRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/meetings'),
        ]);
        if (mRes.ok) setMembers(await mRes.json());
        if (meetRes.ok) {
          const data = await meetRes.json();
          setMeetings(data);
          const current = data.find((m: Meeting) => m.status === 'current');
          if (current) setSelectedMeetingId(current.id);
          else if (data.length > 0) setSelectedMeetingId(data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const filteredMembers = useMemo(() => {
    if (!selectedMeetingId) return [];
    let list = members.filter((m) => m.activities.some((a) => a.meetingId === selectedMeetingId));
    if (filter === 'completed') list = list.filter((m) => m.activities.some((a) => a.meetingId === selectedMeetingId && a.bibleReadingStatus));
    if (filter === 'not_completed') list = list.filter((m) => !m.activities.some((a) => a.meetingId === selectedMeetingId && a.bibleReadingStatus));
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((m) => m.fullName.toLowerCase().includes(q) || m.phoneNumber.includes(q));
    }
    return list;
  }, [members, selectedMeetingId, filter, searchQuery]);

  const stats = useMemo(() => {
    if (!selectedMeetingId) return { total: 0, completed: 0, notCompleted: 0, pct: 0 };
    const total = members.length;
    const completed = members.filter((m) => m.activities.some((a) => a.meetingId === selectedMeetingId && a.bibleReadingStatus)).length;
    return { total, completed, notCompleted: total - completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [members, selectedMeetingId]);

  const exportExcel = () => {
    const meeting = meetings.find((m) => m.id === selectedMeetingId);
    const data = filteredMembers.map((m) => {
      const act = m.activities.find((a) => a.meetingId === selectedMeetingId);
      return {
        الاسم: m.fullName,
        الهاتف: m.phoneNumber,
        القراءة: act?.bibleReadingStatus ? 'أكمل' : 'لم يكمل',
        تاريخ_الاجتماع: meeting?.meetingDate || '',
      };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير القراءة');
    XLSX.writeFile(wb, `تقرير_القراءة_${meeting?.meetingDate || 'غير_محدد'}.xlsx`);
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="animate-pulseSoft text-primary text-xl">جاري التحميل...</div></div>;
  }

  const currentMeeting = meetings.find((m) => m.id === selectedMeetingId);

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="قراءة الإنجيل"
        subtitle={currentMeeting ? `${currentMeeting.title} — ${currentMeeting.meetingDate}` : 'اختر اجتماع'}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="btn-ghost" disabled={!selectedMeetingId || filteredMembers.length === 0}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              تصدير Excel
            </button>
            <Link href="/" className="btn-ghost">الرئيسية</Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 animate-fadeSlide">
          <StatCard label="إجمالي الأعضاء" value={stats.total} icon={<UsersIcon />} color="primary" />
          <StatCard label="أكمل القراءة" value={stats.completed} subValue={`${stats.pct}%`} icon={<BookIcon />} color="success" />
          <StatCard label="لم يكمل" value={stats.notCompleted} icon={<BookXIcon />} color="error" />
          <StatCard label="نسبة الإنجاز" value={`${stats.pct}%`} icon={<ChartIcon />} color="info" />
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف..."
                className="input pl-12"
              />
            </div>
            <select value={selectedMeetingId || ''} onChange={(e) => setSelectedMeetingId(e.target.value)} className="input w-auto min-w-[200px]">
              <option value="">جميع الاجتماعات</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>{m.title} — {m.meetingDate}</option>
              ))}
            </select>
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="input w-auto min-w-[180px]">
              <option value="all">الكل</option>
              <option value="completed">أكمل فقط</option>
              <option value="not_completed">لم يكمل فقط</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>الحالة</th>
                <th>تاريخ الاجتماع</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted">
                    {searchQuery ? 'لا توجد نتائج' : 'لا يوجد بيانات'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const act = member.activities.find((a) => a.meetingId === selectedMeetingId);
                  return (
                    <tr key={member.id}>
                      <td className="font-medium">{member.fullName}</td>
                      <td>{member.phoneNumber}</td>
                      <td>
                        <span className={`badge ${act?.bibleReadingStatus ? 'badge-success' : 'badge-incomplete'}`}>
                          {act?.bibleReadingStatus ? 'أكمل ✓' : 'لم يكمل ✗'}
                        </span>
                      </td>
                      <td>{currentMeeting?.meetingDate || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">{actions}</div>
      </div>
    </header>
  );
}

function StatCard({ label, value, subValue, icon, color }: { label: string; value: string | number; subValue?: string; icon: React.ReactNode; color: 'primary' | 'success' | 'error' | 'info' }) {
  const colors = { primary: 'bg-blue-50 text-primary', success: 'bg-green-50 text-success', error: 'bg-red-50 text-error', info: 'bg-purple-50 text-purple-600' };
  return (
    <div className={`card p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-text">{value}</p>
          {subValue && <p className="text-sm font-semibold mt-0.5">{subValue}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/70">{icon}</div>
      </div>
    </div>
  );
}

function UsersIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function BookIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>; }
function BookXIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>; }
function ChartIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
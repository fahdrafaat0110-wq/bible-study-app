'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Meeting } from '@/types';
import * as XLSX from 'xlsx';

export default function MeetingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const res = await fetch('/api/meetings');
        if (res.ok) setMeetings(await res.json());
      } catch (e) {
        console.error('Failed to fetch meetings:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (data: { title: string; meetingDate: string }) => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newMeeting = await res.json();
        setMeetings((prev) => [newMeeting, ...prev]);
        showToast('تم إنشاء الاجتماع', 'success');
        setShowAddModal(false);
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل الإنشاء', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('حذف الاجتماع سيحذف جميع سجلاته للأعضاء. هل أنت متأكد؟')) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
        showToast('تم حذف الاجتماع وسجلاته', 'success');
      } else {
        showToast('فشل الحذف', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال', 'error');
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="animate-pulseSoft text-primary text-xl">جاري التحميل...</div></div>;
  }

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="سجل الاجتماعات"
        subtitle={`${meetings.length} اجتماع`}
        actions={
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            اجتماع جديد
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>عدد الأعضاء</th>
                <th>تاريخ الإنشاء</th>
                <th className="text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {meetings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted">لا يوجد اجتماعات مسجلة</td>
                </tr>
              ) : (
                meetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="font-medium">{meeting.title}</td>
                    <td>{meeting.meetingDate}</td>
                    <td>
                      <span className={`badge ${statusColor(meeting.status)}`}>
                        {statusLabel(meeting.status)}
                      </span>
                    </td>
                    <td>{meeting.memberCount}</td>
                    <td>{new Date(meeting.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/attendance?meeting=${meeting.id}`}
                          className="p-2 rounded-lg text-muted hover:text-primary hover:bg-gray-100 transition-colors"
                          title="عرض الحضور"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/bible-reading?meeting=${meeting.id}`}
                          className="p-2 rounded-lg text-muted hover:text-primary hover:bg-gray-100 transition-colors"
                          title="عرض القراءة"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/spiritual-notes?meeting=${meeting.id}`}
                          className="p-2 rounded-lg text-muted hover:text-primary hover:bg-gray-100 transition-colors"
                          title="عرض النوتة"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(meeting.id)}
                          className="p-2 rounded-lg text-muted hover:text-error hover:bg-red-50 transition-colors"
                          title="حذف"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <MeetingModal onClose={() => setShowAddModal(false)} onSubmit={handleAdd} />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert">
          <span className="text-sm">{toast.message}</span>
        </div>
      )}
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

function statusLabel(status: string) {
  const labels: Record<string, string> = { current: 'الحالي', upcoming: 'قادم', past: 'سابق' };
  return labels[status] || status;
}

function statusColor(status: string) {
  const colors: Record<string, 'badge-primary' | 'badge-success' | 'badge-incomplete'> = {
    current: 'badge-primary',
    upcoming: 'badge-success',
    past: 'badge-incomplete',
  };
  return colors[status] || 'badge-incomplete';
}

function MeetingModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { title: string; meetingDate: string }) => void }) {
  const [form, setForm] = useState({ title: '', meetingDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="meeting-modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 id="meeting-modal-title" className="text-xl font-bold">اجتماع جديد</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-muted hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text mb-1">عنوان الاجتماع *</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              required
              maxLength={160}
              placeholder="مثال: اجتماع الشباب الأسبوعي"
            />
          </div>
          <div>
            <label htmlFor="meetingDate" className="block text-sm font-medium text-text mb-1">تاريخ الاجتماع *</label>
            <input
              id="meetingDate"
              type="date"
              value={form.meetingDate}
              onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={submitting}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'إنشاء الاجتماع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
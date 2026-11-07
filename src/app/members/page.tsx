
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MemberWithActivities, Meeting } from '@/types';

export default function MembersPage() {
  const { status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<MemberWithActivities[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithActivities | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);

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

        if (mRes.ok) {
          setMembers(await mRes.json());
        }

        if (meetRes.ok) {
          const data = await meetRes.json();
          setMeetings(data);

          const current = data.find((m: Meeting) => m.status === 'current');

          if (current) {
            setSelectedMeetingId(current.id);
          } else if (data.length > 0) {
            setSelectedMeetingId(data[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to fetch:', e);
      }
    }

    fetchAll();
  }, []);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;

    const q = searchQuery.trim().toLowerCase();

    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.phoneNumber.includes(q) ||
        m.college.toLowerCase().includes(q)
    );
  }, [searchQuery, members]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (data: {
    fullName: string;
    phoneNumber: string;
    dateOfBirth: string;
    college: string;
  }) => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const newMember = await res.json();
        setMembers((prev) => [newMember, ...prev]);
        showToast('تم إضافة العضو بنجاح', 'success');
        setShowAddModal(false);
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل الإضافة', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال', 'error');
    }
  };

  const handleUpdate = async (
    id: string,
    data: {
      fullName: string;
      phoneNumber: string;
      dateOfBirth: string;
      college: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated = await res.json();
        setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
        showToast('تم تحديث العضو', 'success');
        setEditingMember(null);
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل التحديث', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'فشل حذف العضو', 'error');
        return;
      }

      setMembers((prev) => prev.filter((member) => member.id !== id));
      showToast('تم حذف العضو بنجاح', 'success');
    } catch {
      showToast('حدث خطأ أثناء حذف العضو', 'error');
    }
  };

  const handleActivityToggle = async (
    memberId: string,
    field: 'attendance' | 'bibleReading' | 'spiritualNote' | 'preparation',
    checked: boolean
  ) => {
    if (!selectedMeetingId) {
      showToast('اختر اجتماعًا أولًا لتسجيل النشاط', 'error');
      return;
    }

    const key = `${memberId}-${field}`;
    setLoadingActivity(key);

    try {
      const res = await fetch('/api/activities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          meetingId: selectedMeetingId,
          [field]: !checked,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'فشل تحديث الحالة', 'error');
        return;
      }

      const membersRes = await fetch('/api/members');

      if (membersRes.ok) {
        setMembers(await membersRes.json());
      }

      showToast('تم تحديث الحالة بنجاح', 'success');
    } catch {
      showToast('حدث خطأ أثناء حفظ الحالة', 'error');
    } finally {
      setLoadingActivity(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-pulseSoft text-primary text-xl">
          جاري التحميل...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="جميع الأعضاء"
        subtitle={`إجمالي: ${members.length} عضو`}
        actions={
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة عضو
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1 md:min-w-0">
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الهاتف، أو الكلية..."
                className="input pl-12"
              />
            </div>

            <select
              value={selectedMeetingId || ''}
              onChange={(e) => setSelectedMeetingId(e.target.value || null)}
              className="input w-full md:flex-1 md:min-w-0"
            >
              <option value="">جميع الاجتماعات</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} — {m.meetingDate}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>العمر</th>
                <th>تاريخ الميلاد</th>
                <th>الكلية</th>
                <th>الحضور</th>
                <th>القراءة</th>
                <th>النوتة</th>
                <th>التحضير</th>
                <th className="text-center">إجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted">
                    {searchQuery ? 'لا توجد نتائج مطابقة' : 'لا يوجد أعضاء مسجلون'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const act = (member.activities ?? []).find(
                    (a) => a.meetingId === selectedMeetingId
                  ) || {
                    attendanceStatus: false,
                    bibleReadingStatus: false,
                    spiritualNoteStatus: false,
                    preparationStatus: false,
                  };

                  return (
                    <tr key={member.id}>
                      <td className="font-medium">{member.fullName}</td>
                      <td>{member.phoneNumber}</td>
                      <td>{member.age} سنة</td>
                      <td>{member.dateOfBirth}</td>
                      <td>{member.college}</td>

                      <td>
                        <ActivityBadge
                          checked={act.attendanceStatus}
                          disabled={loadingActivity === `${member.id}-attendance`}
                          onClick={() =>
                            handleActivityToggle(member.id, 'attendance', act.attendanceStatus)
                          }
                        />
                      </td>

                      <td>
                        <ActivityBadge
                          checked={act.bibleReadingStatus}
                          disabled={loadingActivity === `${member.id}-bibleReading`}
                          onClick={() =>
                            handleActivityToggle(member.id, 'bibleReading', act.bibleReadingStatus)
                          }
                        />
                      </td>

                      <td>
                        <ActivityBadge
                          checked={act.spiritualNoteStatus}
                          disabled={loadingActivity === `${member.id}-spiritualNote`}
                          onClick={() =>
                            handleActivityToggle(member.id, 'spiritualNote', act.spiritualNoteStatus)
                          }
                        />
                      </td>

                      <td>
                        <ActivityBadge
                          checked={act.preparationStatus}
                          disabled={loadingActivity === `${member.id}-preparation`}
                          onClick={() =>
                            handleActivityToggle(member.id, 'preparation', act.preparationStatus)
                          }
                        />
                      </td>

                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingMember(member)}
                            className="p-2 rounded-lg text-muted hover:text-primary hover:bg-gray-100 transition-colors"
                            title="تعديل"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDelete(member.id)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <MemberModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          title="إضافة عضو جديد"
        />
      )}

      {editingMember && (
        <MemberModal
          initialData={editingMember}
          onClose={() => setEditingMember(null)}
          onSubmit={(data) => handleUpdate(editingMember.id, data)}
          title="تعديل العضو"
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert">
          <span className="text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
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

function ActivityBadge({
  checked,
  onClick,
  disabled = false,
}: {
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={checked ? 'إلغاء التسجيل' : 'تسجيل النشاط'}
      title={checked ? 'اضغط لإلغاء التسجيل' : 'اضغط لتسجيل النشاط'}
      className={`
        inline-flex items-center justify-center
        w-9 h-9 rounded-full border-2
        font-bold text-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-wait
        ${
          checked
            ? 'bg-green-100 text-green-700 border-green-500 hover:bg-green-200'
            : 'bg-gray-100 text-gray-400 border-gray-300 hover:bg-gray-200 hover:text-gray-600'
        }
      `}
    >
      {checked ? '✓' : '✕'}
    </button>
  );
}

function MemberModal({
  initialData,
  onClose,
  onSubmit,
  title,
}: {
  initialData?: MemberWithActivities;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    phoneNumber: string;
    dateOfBirth: string;
    college: string;
  }) => void;
  title: string;
}) {
  const [form, setForm] = useState({
    fullName: initialData?.fullName || '',
    phoneNumber: initialData?.phoneNumber || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    college: initialData?.college || '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-text mb-1">
              الاسم بالكامل *
            </label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="input"
              required
              maxLength={120}
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-text mb-1">
              رقم الهاتف *
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              className="input"
              required
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-text mb-1">
              تاريخ الميلاد *
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="input"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label htmlFor="college" className="block text-sm font-medium text-text mb-1">
              الكلية *
            </label>
            <input
              id="college"
              type="text"
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
              className="input"
              required
              maxLength={120}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={submitting}
            >
              إلغاء
            </button>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting
                ? 'جاري الحفظ...'
                : initialData
                  ? 'حفظ التغييرات'
                  : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





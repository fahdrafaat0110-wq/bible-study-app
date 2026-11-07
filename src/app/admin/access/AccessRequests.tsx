
'use client';

import { useEffect, useState } from 'react';

type AccessRequest = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function AccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/admin/access');

      if (!res.ok) {
        throw new Error('فشل تحميل طلبات الدخول');
      }

      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'REVOKED'
  ) => {
    const confirmed = window.confirm(
      status === 'APPROVED'
        ? 'هل تريد الموافقة على هذا المستخدم؟'
        : status === 'REJECTED'
        ? 'هل تريد رفض طلب هذا المستخدم؟'
        : 'هل تريد سحب صلاحية هذا المستخدم؟'
    );

    if (!confirmed) return;

    try {
      setBusyId(id);
      setError('');

      const res = await fetch('/api/admin/access', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        throw new Error('فشل تحديث الصلاحية');
      }

      await fetchRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      );
    } finally {
      setBusyId(null);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'قيد الانتظار';
      case 'APPROVED':
        return 'تمت الموافقة';
      case 'REJECTED':
        return 'مرفوض';
      case 'REVOKED':
        return 'تم سحب الصلاحية';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        جاري تحميل طلبات الدخول...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text">
              إدارة طلبات الدخول
            </h1>
            <p className="text-muted mt-2">
              الموافقة على المستخدمين وإدارة صلاحياتهم
            </p>
          </div>

          <button
            onClick={fetchRequests}
            className="btn-primary"
          >
            تحديث الطلبات
          </button>
        </div>

        {error && (
          <div className="p-4 mb-4 rounded-xl bg-red-100 text-red-700">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center text-muted">
            لا توجد طلبات دخول حتى الآن
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {request.image ? (
                    <img
                      src={request.image}
                      alt=""
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(request.name || request.email)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h2 className="font-bold text-text">
                      {request.name || 'بدون اسم'}
                    </h2>
                    <p className="text-sm text-muted break-all">
                      {request.email}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      تاريخ الطلب:{' '}
                      {new Date(request.createdAt).toLocaleString('ar-EG')}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      الحالة: {statusLabel(request.status)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {request.status !== 'APPROVED' && (
                    <button
                      disabled={busyId === request.id}
                      onClick={() =>
                        updateStatus(request.id, 'APPROVED')
                      }
                      className="btn-primary disabled:opacity-50"
                    >
                      موافقة
                    </button>
                  )}

                  {request.status === 'PENDING' && (
                    <button
                      disabled={busyId === request.id}
                      onClick={() =>
                        updateStatus(request.id, 'REJECTED')
                      }
                      className="btn-ghost disabled:opacity-50"
                    >
                      رفض
                    </button>
                  )}

                  {request.status === 'APPROVED' && (
                    <button
                      disabled={busyId === request.id}
                      onClick={() =>
                        updateStatus(request.id, 'REVOKED')
                      }
                      className="btn-ghost disabled:opacity-50"
                    >
                      سحب الصلاحية
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <a href="/" className="text-primary hover:underline">
            العودة إلى الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
'use client';

interface StatsCardsProps {
  stats: { total: number; attended: number; bibleRead: number; spiritualNoted: number };
  meetingTitle?: string;
  meetingDate?: string;
}

export default function StatsCards({ stats, meetingTitle, meetingDate }: StatsCardsProps) {
  const { total, attended, bibleRead, spiritualNoted } = stats;
  const attendancePct = total > 0 ? Math.round((attended / total) * 100) : 0;
  const biblePct = total > 0 ? Math.round((bibleRead / total) * 100) : 0;
  const spiritualPct = total > 0 ? Math.round((spiritualNoted / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeSlide">
      <StatCard
        label="إجمالي الأعضاء"
        value={total}
        icon={<UsersIcon />}
        color="primary"
        trend={null}
      />
      <StatCard
        label="الحضور"
        value={`${attended} / ${total}`}
        subValue={`${attendancePct}%`}
        icon={<CheckCircleIcon />}
        color="success"
      />
      <StatCard
        label="قراءة الإنجيل"
        value={`${bibleRead} / ${total}`}
        subValue={`${biblePct}%`}
        icon={<BookIcon />}
        color="primary"
      />
      <StatCard
        label="النوتة الروحية"
        value={`${spiritualNoted} / ${total}`}
        subValue={`${spiritualPct}%`}
        icon={<FileTextIcon />}
        color="info"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'info' | 'error';
  trend?: string | null;
}) {
  const colors = {
    primary: 'bg-blue-50 text-primary border-blue-100',
    success: 'bg-green-50 text-success border-green-100',
    info: 'bg-purple-50 text-purple-600 border-purple-100',
    error: 'bg-red-50 text-error border-red-100',
  };

  return (
    <div className={`card p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-text">{value}</p>
          {subValue && <p className="text-sm font-semibold mt-0.5">{subValue}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/70">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-current/20 flex items-center gap-1 text-sm">
          <span className="text-success">{trend}</span>
        </div>
      )}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
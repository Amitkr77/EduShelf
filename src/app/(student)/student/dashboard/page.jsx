'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookMarked,
  CalendarCheck,
  AlertTriangle,
  Clock,
  BookOpen,
  ArrowRight,
  Star,
  Activity,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/shared/StatsCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

const statusBadgeMap = {
  requested: 'bg-[#E3F2FA] text-[#4A8DB7]',
  approved: 'bg-[#E8F0EC] text-[#6B8F83]',
  issued: 'bg-[#DDE7EA] text-[#5D7480]',
  returned: 'bg-[#E8F0EC] text-[#6B8F83]',
  overdue: 'bg-[#FDE8E6] text-[#C25B4F]',
  rejected: 'bg-[#FDE8E6] text-[#C25B4F]',
  closed: 'bg-[#F9FAFB] text-[#6B7280]',
};

const CHART_COLORS = ['#7CCB7A', '#F3C47A', '#84C7E8', '#A7C2B0', '#7C9AA5', '#6B8F83', '#C4952A'];

const borrowTrendConfig = {
  borrows: { label: 'Borrows', color: '#7C9AA5' },
  returns: { label: 'Returns', color: '#7CCB7A' },
};

const categoryConfig = {
  category: { label: 'Category', color: '#7C9AA5' },
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    borrowed: 0,
    reservations: 0,
    fines: 0,
    dueSoon: 0,
  });
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [allBorrows, setAllBorrows] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [borrowsRes, reservationsRes, finesRes, booksRes] =
          await Promise.all([
            apiFetch('/borrow?limit=50'),
            apiFetch('/reservations?status=active'),
            apiFetch('/fines?status=pending'),
            apiFetch('/books?sort=popularity&limit=6'),
          ]);

        const borrows = borrowsRes.data.items || [];
        const reservations = reservationsRes.data.items || [];
        const fines = finesRes.data.items || [];
        const books = booksRes.data.items || [];

        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        const active = borrows.filter(
          (b) => b.status === 'issued' || b.status === 'overdue'
        );
        const dueSoon = active.filter((b) => {
          if (!b.dueDate) return false;
          const due = new Date(b.dueDate);
          return due >= now && due <= threeDaysFromNow;
        });

        const totalFines = fines.reduce((sum, f) => sum + (f.amount || 0), 0);

        setStats({
          borrowed: active.length,
          reservations: reservations.length,
          fines: totalFines,
          dueSoon: dueSoon.length,
        });

        setActiveBorrows(active);
        setRecentActivity(borrows.slice(0, 5));
        setRecommendedBooks(books);
        setAllBorrows(borrows);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // Compute borrow trend data (last 7 months)
  const borrowTrendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
      });
    }

    return months.map(({ key, label }) => {
      const monthBorrows = allBorrows.filter((b) => {
        const date = new Date(b.createdAt);
        const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return mKey === key;
      });
      const borrowCount = monthBorrows.length;
      const returnCount = monthBorrows.filter(
        (b) => b.status === 'returned'
      ).length;
      return { name: label, borrows: borrowCount, returns: returnCount };
    });
  }, [allBorrows]);

  // Compute category distribution data
  const categoryData = useMemo(() => {
    const categoryMap = {};
    allBorrows.forEach((b) => {
      const book = b.bookId || {};
      const cat = book.category?.name || book.category || 'Uncategorized';
      const key = typeof cat === 'string' ? cat : 'Uncategorized';
      categoryMap[key] = (categoryMap[key] || 0) + 1;
    });
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allBorrows]);

  // Build dynamic category chart config
  const dynamicCategoryConfig = useMemo(() => {
    const config = {};
    categoryData.forEach((item, idx) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      };
    });
    return config;
  }, [categoryData]);

  // Compute reading progress for stats cards
  const readingProgress = useMemo(() => {
    const total = activeBorrows.length;
    if (total === 0) return { percentage: 0, label: 'No active borrows' };

    const now = new Date();
    let onTrack = 0;
    activeBorrows.forEach((b) => {
      if (b.dueDate) {
        const due = new Date(b.dueDate);
        if (due >= now) onTrack++;
      } else {
        onTrack++;
      }
    });

    const pct = Math.round((onTrack / total) * 100);
    return {
      percentage: pct,
      label: pct === 100 ? 'All on track' : `${total - onTrack} overdue`,
    };
  }, [activeBorrows]);

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function isOverdue(dueDate) {
    return dueDate && new Date(dueDate) < new Date();
  }

  function daysUntilDue(dueDate) {
    if (!dueDate) return null;
    return Math.ceil(
      (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">
          Dashboard
        </h1>
        <p className="text-[#6B7280] mt-1">
          Welcome back! Here&apos;s your library overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title="Borrowed Books"
          value={stats.borrowed}
          icon={BookMarked}
          color="emerald"
          comparison={readingProgress.label}
        />
        <StatsCard
          title="Active Reservations"
          value={stats.reservations}
          icon={CalendarCheck}
          color="teal"
        />
        <StatsCard
          title="Pending Fines"
          value={`$${stats.fines.toFixed(2)}`}
          icon={AlertTriangle}
          color="rose"
        />
        <StatsCard
          title="Due Soon"
          value={stats.dueSoon}
          icon={Clock}
          color="amber"
          comparison={readingProgress.percentage + '% on track'}
        />
      </div>

      {/* Reading Progress Bar */}
      {activeBorrows.length > 0 && (
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#7CCB7A]" />
              <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                Reading Progress
              </h2>
            </div>
            <span className="text-sm font-medium text-[#7CCB7A]">
              {readingProgress.percentage}% on track
            </span>
          </div>
          <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${readingProgress.percentage}%`,
                background:
                  readingProgress.percentage >= 80
                    ? 'linear-gradient(90deg, #7CCB7A, #6BBF69)'
                    : readingProgress.percentage >= 50
                    ? 'linear-gradient(90deg, #F3C47A, #E8B35E)'
                    : 'linear-gradient(90deg, #F28B82, #E06B60)',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-[#6B7280]">
              {activeBorrows.length} book{activeBorrows.length !== 1 ? 's' : ''} currently borrowed
            </p>
            <p className="text-xs text-[#6B7280]">
              {stats.dueSoon > 0
                ? `${stats.dueSoon} due within 3 days`
                : 'No urgent due dates'}
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borrow Activity Trend */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="p-4 sm:p-6 pb-2">
            <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">
              Borrow Activity
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
              Your borrowing & return trends over the past 7 months
            </p>
          </div>
          <div className="px-2 sm:px-6 pb-4 sm:pb-6">
            {allBorrows.length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-sm text-[#6B7280]">
                  No borrowing activity yet
                </p>
              </div>
            ) : (
              <ChartContainer config={borrowTrendConfig} className="h-[250px] w-full">
                <AreaChart data={borrowTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillBorrows" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C9AA5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7C9AA5" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillReturns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7CCB7A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7CCB7A" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="borrows"
                    stroke="#7C9AA5"
                    fill="url(#fillBorrows)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#7C9AA5', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#7C9AA5', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="returns"
                    stroke="#7CCB7A"
                    fill="url(#fillReturns)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#7CCB7A', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#7CCB7A', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* Books by Category */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="p-4 sm:p-6 pb-2">
            <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">
              Books by Category
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
              Distribution of your borrowed books across categories
            </p>
          </div>
          <div className="px-2 sm:px-6 pb-4 sm:pb-6">
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-sm text-[#6B7280]">
                  No category data available
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ChartContainer config={dynamicCategoryConfig} className="h-[220px] w-full sm:w-1/2">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-2">
                  {categoryData.map((entry, index) => {
                    const total = categoryData.reduce((s, e) => s + e.value, 0);
                    const pct = Math.round((entry.value / total) * 100);
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-sm text-[#1F2937] truncate flex-1">
                          {entry.name}
                        </span>
                        <span className="text-sm font-medium text-[#6B7280] shrink-0">
                          {entry.value} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Currently Borrowed Books */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2">
          <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">
            Borrowed Books
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#5D7480] hover:text-[#7C9AA5] hover:bg-transparent"
            onClick={() => router.push('/student/my-books')}
          >
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {activeBorrows.length === 0 ? (
            <EmptyState
              icon={BookMarked}
              title="No borrowed books"
              description="You don't have any active borrows right now. Browse the catalog to find your next read!"
              actionLabel="Browse Books"
              onAction={() => router.push('/student/books')}
            />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D1D5DB] [&::-webkit-scrollbar-thumb]:rounded-full">
              {activeBorrows.slice(0, 5).map((borrow) => {
                const overdue = isOverdue(borrow.dueDate);
                const daysLeft = daysUntilDue(borrow.dueDate);
                const book = borrow.bookId || {};

                // Mini progress: how much of the borrow period has elapsed
                let progressPct = null;
                if (borrow.issueDate && borrow.dueDate) {
                  const issue = new Date(borrow.issueDate).getTime();
                  const due = new Date(borrow.dueDate).getTime();
                  const now = Date.now();
                  const total = due - issue;
                  const elapsed = now - issue;
                  if (total > 0) {
                    progressPct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                  }
                }

                return (
                  <div
                    key={borrow._id}
                    className={`flex items-center justify-between rounded-2xl border p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                      overdue
                        ? 'border-[#F28B82]/40 bg-[#FDE8E6]/30'
                        : daysLeft <= 3
                        ? 'border-[#F3C47A]/40 bg-[#FEF3E2]/30'
                        : 'border-[#E5E7EB] bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          overdue
                            ? 'bg-[#FDE8E6] text-[#C25B4F]'
                            : 'bg-[#E8F0EC] text-[#6B8F83]'
                        }`}
                      >
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-[#1F2937] text-sm sm:text-base">
                          {book.title || 'Unknown Book'}
                        </p>
                        <p className="text-xs sm:text-sm text-[#6B7280]">
                          {book.author || 'Unknown Author'}
                        </p>
                        {/* Mini progress bar */}
                        {progressPct !== null && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden max-w-[120px]">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${progressPct}%`,
                                  backgroundColor:
                                    progressPct >= 90
                                      ? '#F28B82'
                                      : progressPct >= 70
                                      ? '#F3C47A'
                                      : '#7CCB7A',
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-[#6B7280]">
                              {progressPct}% elapsed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2 sm:ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-[#1F2937]">
                          Due: {formatDate(borrow.dueDate)}
                        </p>
                        {overdue ? (
                          <span className="inline-block mt-1 rounded-xl px-2 py-0.5 text-xs font-medium bg-[#FDE8E6] text-[#C25B4F]">
                            Overdue
                          </span>
                        ) : daysLeft <= 3 ? (
                          <span className="inline-block mt-1 rounded-xl px-2 py-0.5 text-xs font-medium bg-[#FEF3E2] text-[#C4952A]">
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                          </span>
                        ) : (
                          <span className="text-xs text-[#6B7280]">
                            {daysLeft} days left
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#5D7480] border-[#E5E7EB] hover:bg-[#DDE7EA] hover:text-[#5D7480] rounded-xl transition-all duration-200 text-xs sm:text-sm"
                        onClick={() => router.push('/student/my-books')}
                      >
                        Return
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Recent Activity + Recommended Books */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="p-4 sm:p-6 pb-2">
            <h2 className="text-base sm:text-lg font-semibold text-[#1F2937] flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#5D7480]" />
              Recent Activity
            </h2>
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No recent activity"
                description="Your borrowing activity will appear here."
              />
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D1D5DB] [&::-webkit-scrollbar-thumb]:rounded-full">
                {recentActivity.map((borrow) => {
                  const book = borrow.bookId || {};

                  return (
                    <div
                      key={borrow._id}
                      className="flex items-center justify-between py-3 border-b border-[#E5E7EB] last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DDE7EA] text-[#5D7480]">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-[#1F2937]">
                            {book.title || 'Unknown Book'}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {formatDate(borrow.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium rounded-xl px-2.5 py-1 ${
                          statusBadgeMap[borrow.status] || 'bg-[#F9FAFB] text-[#6B7280]'
                        }`}
                      >
                        {borrow.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Books */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between p-4 sm:p-6 pb-2">
            <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">
              Recommended for You
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#5D7480] hover:text-[#7C9AA5] hover:bg-transparent"
              onClick={() => router.push('/student/books')}
            >
              Browse All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {recommendedBooks.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No recommendations yet"
                description="Popular books will appear here as the library grows."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recommendedBooks.map((book) => (
                  <Link
                    key={book._id}
                    href={`/student/books/${book._id}`}
                    className="group rounded-2xl border border-[#E5E7EB] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#7C9AA5]/40"
                  >
                    <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-[#7C9AA5]/20 to-[#5D7480]/20 flex items-center justify-center mb-2 overflow-hidden">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-8 w-8 text-[#7C9AA5]/50" />
                      )}
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-[#5D7480] text-[#1F2937] transition-colors">
                      {book.title}
                    </p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {book.author}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-[#F3C47A] text-[#F3C47A]" />
                      <span className="text-xs text-[#6B7280]">
                        {book.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

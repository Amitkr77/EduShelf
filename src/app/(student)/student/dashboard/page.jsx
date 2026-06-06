'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
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
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Dashboard</h1>
        <p className="text-[#6B7280] mt-1">
          Welcome back! Here&apos;s your library overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatsCard
          title="Borrowed Books"
          value={stats.borrowed}
          icon={BookMarked}
          color="emerald"
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
        />
      </div>

      {/* Currently Borrowed Books */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-lg font-semibold text-[#1F2937]">
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
        <div className="px-6 pb-6">
          {activeBorrows.length === 0 ? (
            <EmptyState
              icon={BookMarked}
              title="No borrowed books"
              description="You don't have any active borrows right now. Browse the catalog to find your next read!"
              actionLabel="Browse Books"
              onAction={() => router.push('/student/books')}
            />
          ) : (
            <div className="space-y-3">
              {activeBorrows.slice(0, 5).map((borrow) => {
                const overdue = isOverdue(borrow.dueDate);
                const daysLeft = daysUntilDue(borrow.dueDate);
                const book = borrow.bookId || {};

                return (
                  <div
                    key={borrow._id}
                    className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                      overdue
                        ? 'border-[#F28B82]/40 bg-[#FDE8E6]/30'
                        : daysLeft <= 3
                        ? 'border-[#F3C47A]/40 bg-[#FEF3E2]/30'
                        : 'border-[#E5E7EB] bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          overdue
                            ? 'bg-[#FDE8E6] text-[#C25B4F]'
                            : 'bg-[#E8F0EC] text-[#6B8F83]'
                        }`}
                      >
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-[#1F2937]">
                          {book.title || 'Unknown Book'}
                        </p>
                        <p className="text-sm text-[#6B7280]">
                          {book.author || 'Unknown Author'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
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
                        className="text-[#5D7480] border-[#E5E7EB] hover:bg-[#DDE7EA] hover:text-[#5D7480] rounded-xl transition-all duration-200"
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#5D7480]" />
              Recent Activity
            </h2>
          </div>
          <div className="px-6 pb-6">
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No recent activity"
                description="Your borrowing activity will appear here."
              />
            ) : (
              <div className="space-y-3">
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
        <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-lg font-semibold text-[#1F2937]">
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
          <div className="px-6 pb-6">
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

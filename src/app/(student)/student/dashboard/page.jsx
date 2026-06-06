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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import StatsCard from '@/components/shared/StatsCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

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
    const diff = Math.ceil(
      (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your library overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">
            Currently Borrowed Books
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:text-emerald-700"
            onClick={() => router.push('/student/my-books')}
          >
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
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
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      overdue
                        ? 'border-rose-200 bg-rose-50'
                        : daysLeft <= 3
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          overdue
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {book.title || 'Unknown Book'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {book.author || 'Unknown Author'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">
                          Due: {formatDate(borrow.dueDate)}
                        </p>
                        {overdue ? (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        ) : daysLeft <= 3 ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {daysLeft} days left
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
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
        </CardContent>
      </Card>

      {/* Bottom Grid: Recent Activity + Recommended Books */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  const statusColors = {
                    requested: 'bg-blue-100 text-blue-700',
                    approved: 'bg-emerald-100 text-emerald-700',
                    issued: 'bg-teal-100 text-teal-700',
                    returned: 'bg-gray-100 text-gray-700',
                    overdue: 'bg-rose-100 text-rose-700',
                    rejected: 'bg-rose-100 text-rose-700',
                    closed: 'bg-gray-100 text-gray-700',
                  };

                  return (
                    <div
                      key={borrow._id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {book.title || 'Unknown Book'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(borrow.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`shrink-0 text-xs ${
                          statusColors[borrow.status] || 'bg-gray-100 text-gray-700'
                        }`}
                        variant="secondary"
                      >
                        {borrow.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Books */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Recommended for You
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700"
              onClick={() => router.push('/student/books')}
            >
              Browse All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
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
                    className="group rounded-lg border p-3 transition-all hover:shadow-md hover:border-emerald-200"
                  >
                    <div className="aspect-[3/4] rounded-md bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-2 overflow-hidden">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-8 w-8 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-emerald-600">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {book.author}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-muted-foreground">
                        {book.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

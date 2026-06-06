'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Users,
  ArrowRightLeft,
  AlertTriangle,
  CalendarCheck,
  DollarSign,
  CheckCircle,
  XCircle,
  Plus,
  RotateCcw,
  BookPlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function LibrarianDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalStudents: 0,
    issuedToday: 0,
    overdueBooks: 0,
    activeReservations: 0,
    totalFinesCollected: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', item: null });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const [
        booksRes,
        studentsRes,
        issuedRes,
        overdueRes,
        reservationsRes,
        finesRes,
        pendingRes,
      ] = await Promise.all([
        apiFetch('/books?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        apiFetch('/users?role=student&limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        apiFetch('/borrow?status=issued&limit=100').catch(() => ({ data: { items: [] } })),
        apiFetch('/borrow?status=overdue&limit=5').catch(() => ({ data: { items: [] } })),
        apiFetch('/reservations?status=active&limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        apiFetch('/fines?status=paid&limit=100').catch(() => ({ data: { items: [] } })),
        apiFetch('/borrow?status=requested&limit=10').catch(() => ({ data: { items: [] } })),
      ]);

      // Calculate issued today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const issuedToday = (issuedRes.data?.items || []).filter((b) => {
        if (!b.issueDate) return false;
        const issueDate = new Date(b.issueDate);
        return issueDate >= today;
      }).length;

      // Calculate total fines collected
      const totalFinesCollected = (finesRes.data?.items || []).reduce(
        (sum, f) => sum + (f.amount || 0),
        0
      );

      setStats({
        totalBooks: booksRes.data?.pagination?.total || 0,
        totalStudents: studentsRes.data?.pagination?.total || 0,
        issuedToday,
        overdueBooks: overdueRes.data?.pagination?.total || 0,
        activeReservations: reservationsRes.data?.pagination?.total || 0,
        totalFinesCollected: totalFinesCollected.toFixed(2),
      });

      setPendingRequests(pendingRes.data?.items || []);
      setOverdueBooks(overdueRes.data?.items || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(borrowId) {
    try {
      await apiFetch('/borrow/issue', {
        method: 'POST',
        body: { borrowId },
      });
      toast.success('Book issued successfully');
      setActionDialog({ open: false, type: '', item: null });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message || 'Failed to issue book');
    }
  }

  async function handleReject(borrowId) {
    try {
      await apiFetch(`/borrow/${borrowId}`, {
        method: 'PUT',
        body: { status: 'rejected' },
      });
      toast.success('Borrow request rejected');
      setActionDialog({ open: false, type: '', item: null });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message || 'Failed to reject request');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Librarian Dashboard</h1>
        <p className="text-muted-foreground">Manage your library operations at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Books"
          value={stats.totalBooks.toLocaleString()}
          icon={BookOpen}
          color="emerald"
        />
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={Users}
          color="teal"
        />
        <StatsCard
          title="Issued Today"
          value={stats.issuedToday}
          icon={ArrowRightLeft}
          color="amber"
        />
        <StatsCard
          title="Overdue Books"
          value={stats.overdueBooks}
          icon={AlertTriangle}
          color="rose"
        />
        <StatsCard
          title="Active Reservations"
          value={stats.activeReservations}
          icon={CalendarCheck}
          color="teal"
        />
        <StatsCard
          title="Fines Collected"
          value={`$${stats.totalFinesCollected}`}
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Borrow Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Pending Borrow Requests</CardTitle>
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {pendingRequests.length} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No pending requests"
                description="All borrow requests have been processed."
              />
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {request.bookId?.title || 'Unknown Book'}
                          </p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {request.bookId?.ISBN}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested by{' '}
                          <span className="font-medium text-foreground">
                            {request.userId?.name || 'Unknown Student'}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeDate(request.requestDate || request.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              type: 'approve',
                              item: request,
                            })
                          }
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              type: 'reject',
                              item: request,
                            })
                          }
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Overdue Books Alert */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Overdue Books Alert
              </CardTitle>
              {overdueBooks.length > 0 && (
                <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                  {stats.overdueBooks} overdue
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {overdueBooks.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No overdue books"
                description="All books have been returned on time."
              />
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {overdueBooks.map((borrow) => {
                    const dueDate = new Date(borrow.dueDate);
                    const now = new Date();
                    const daysOverdue = Math.ceil(
                      (now - dueDate) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={borrow._id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {borrow.bookId?.title || 'Unknown Book'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Borrowed by{' '}
                            <span className="font-medium text-foreground">
                              {borrow.userId?.name || 'Unknown'}
                            </span>
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Due: {formatDate(borrow.dueDate)}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {daysOverdue}d overdue
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-rose-600">
                            ${(daysOverdue * 2).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">estimated fine</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => router.push('/librarian/books/add')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
            <Button
              onClick={() => router.push('/librarian/issues')}
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <BookPlus className="h-4 w-4 mr-2" />
              Issue Book
            </Button>
            <Button
              onClick={() => router.push('/librarian/returns')}
              variant="outline"
              className="border-teal-200 text-teal-700 hover:bg-teal-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Process Return
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: '', item: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve'
                ? 'Approve & Issue Book'
                : 'Reject Borrow Request'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve'
                ? `Are you sure you want to approve and issue "${actionDialog.item?.bookId?.title}" to ${actionDialog.item?.userId?.name}?`
                : `Are you sure you want to reject the borrow request for "${actionDialog.item?.bookId?.title}" by ${actionDialog.item?.userId?.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, type: '', item: null })
              }
            >
              Cancel
            </Button>
            {actionDialog.type === 'approve' ? (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleApprove(actionDialog.item?._id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve & Issue
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => handleReject(actionDialog.item?._id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

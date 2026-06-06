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
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const issuedToday = (issuedRes.data?.items || []).filter((b) => {
        if (!b.issueDate) return false;
        const issueDate = new Date(b.issueDate);
        return issueDate >= today;
      }).length;

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
        <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Dashboard</h1>
        <p className="text-[#6B7280] mt-1">Manage your library operations at a glance.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5">
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
        {/* Pending Borrow Requests - Glass Card */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1F2937]">Pending Borrow Requests</h2>
              {pendingRequests.length > 0 && (
                <Badge className="bg-[#FEF3E2] text-[#C4952A] hover:bg-[#FEF3E2] border-0 rounded-full px-3">
                  {pendingRequests.length} pending
                </Badge>
              )}
            </div>
          </div>
          <div className="px-6 pb-6">
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
                      className="flex items-start justify-between gap-3 rounded-2xl border border-[#E5E7EB] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm bg-white"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#1F2937] truncate">
                            {request.bookId?.title || 'Unknown Book'}
                          </p>
                          <Badge variant="outline" className="text-xs shrink-0 border-[#E5E7EB] text-[#6B7280]">
                            {request.bookId?.ISBN}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">
                          Requested by{' '}
                          <span className="font-medium text-[#1F2937]">
                            {request.userId?.name || 'Unknown Student'}
                          </span>
                        </p>
                        <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(request.requestDate || request.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium bg-[#7CCB7A] text-white hover:opacity-90 transition-all duration-200"
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              type: 'approve',
                              item: request,
                            })
                          }
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium bg-[#FDE8E6] text-[#C25B4F] hover:opacity-90 transition-all duration-200"
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              type: 'reject',
                              item: request,
                            })
                          }
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Overdue Books Alert - Glass Card */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#C25B4F]" />
                Overdue Books Alert
              </h2>
              {overdueBooks.length > 0 && (
                <Badge className="bg-[#FDE8E6] text-[#C25B4F] hover:bg-[#FDE8E6] border-0 rounded-full px-3">
                  {stats.overdueBooks} overdue
                </Badge>
              )}
            </div>
          </div>
          <div className="px-6 pb-6">
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
                        className="flex items-start justify-between gap-3 rounded-2xl border border-[#F28B82]/30 bg-[#FDE8E6]/40 p-4 transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1F2937] truncate">
                            {borrow.bookId?.title || 'Unknown Book'}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-1">
                            Borrowed by{' '}
                            <span className="font-medium text-[#1F2937]">
                              {borrow.userId?.name || 'Unknown'}
                            </span>
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-[#6B7280]">
                              Due: {formatDate(borrow.dueDate)}
                            </span>
                            <Badge className="bg-[#FDE8E6] text-[#C25B4F] hover:bg-[#FDE8E6] border-0 text-xs">
                              {daysOverdue}d overdue
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-[#C25B4F]">
                            ${(daysOverdue * 2).toFixed(2)}
                          </p>
                          <p className="text-xs text-[#6B7280]">estimated fine</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Glass Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="p-6 pb-3">
          <h2 className="text-lg font-semibold text-[#1F2937]">Quick Actions</h2>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/librarian/books/add')}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480]"
            >
              <Plus className="h-4 w-4" />
              Add Book
            </button>
            <button
              onClick={() => router.push('/librarian/issues')}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl text-sm font-medium border-[#7C9AA5] border-2 text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480]"
            >
              <BookPlus className="h-4 w-4" />
              Issue Book
            </button>
            <button
              onClick={() => router.push('/librarian/returns')}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl text-sm font-medium border-[#7C9AA5] border-2 text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480]"
            >
              <RotateCcw className="h-4 w-4" />
              Process Return
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: '', item: null })
        }
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937]">
              {actionDialog.type === 'approve'
                ? 'Approve & Issue Book'
                : 'Reject Borrow Request'}
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              {actionDialog.type === 'approve'
                ? `Are you sure you want to approve and issue "${actionDialog.item?.bookId?.title}" to ${actionDialog.item?.userId?.name}?`
                : `Are you sure you want to reject the borrow request for "${actionDialog.item?.bookId?.title}" by ${actionDialog.item?.userId?.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="inline-flex items-center justify-center h-10 px-5 rounded-2xl text-sm font-medium border-[#7C9AA5] border-2 text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200"
              onClick={() =>
                setActionDialog({ open: false, type: '', item: null })
              }
            >
              Cancel
            </button>
            {actionDialog.type === 'approve' ? (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200"
                onClick={() => handleApprove(actionDialog.item?._id)}
              >
                <CheckCircle className="h-4 w-4" />
                Approve & Issue
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-2xl text-sm font-medium bg-[#F28B82] hover:opacity-90 text-white transition-all duration-200"
                onClick={() => handleReject(actionDialog.item?._id)}
              >
                <XCircle className="h-4 w-4" />
                Reject Request
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

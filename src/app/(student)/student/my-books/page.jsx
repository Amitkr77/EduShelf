'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BookMarked,
  BookOpen,
  Clock,
  RotateCcw,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  History,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

const statusBadgeMap = {
  requested: 'bg-[#E3F2FA] text-[#4A8DB7]',
  approved: 'bg-[#E8F0EC] text-[#6B8F83]',
  issued: 'bg-[#E8F0EC] text-[#6B8F83]',
  overdue: 'bg-[#FDE8E6] text-[#C25B4F]',
  returned: 'bg-[#E8F0EC] text-[#6B8F83]',
  closed: 'bg-[#F9FAFB] text-[#6B7280]',
  rejected: 'bg-[#FDE8E6] text-[#C25B4F]',
};

const statusIcons = {
  requested: Clock,
  approved: CheckCircle2,
  issued: BookOpen,
  overdue: AlertTriangle,
  returned: CheckCircle2,
  closed: CheckCircle2,
  rejected: AlertTriangle,
};

const statusIconColors = {
  requested: 'bg-[#E3F2FA] text-[#4A8DB7]',
  approved: 'bg-[#E8F0EC] text-[#6B8F83]',
  issued: 'bg-[#E8F0EC] text-[#6B8F83]',
  overdue: 'bg-[#FDE8E6] text-[#C25B4F]',
  returned: 'bg-[#E8F0EC] text-[#6B8F83]',
  closed: 'bg-[#F9FAFB] text-[#6B7280]',
  rejected: 'bg-[#FDE8E6] text-[#C25B4F]',
};

export default function MyBooksPage() {
  const [loading, setLoading] = useState(true);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [historyBorrows, setHistoryBorrows] = useState([]);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningBorrow, setReturningBorrow] = useState(null);
  const [returning, setReturning] = useState(false);

  const loadBorrows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/borrow?limit=100');
      const borrows = res.data.items || [];

      const active = borrows.filter(
        (b) =>
          b.status === 'issued' ||
          b.status === 'overdue' ||
          b.status === 'requested' ||
          b.status === 'approved'
      );
      const history = borrows.filter(
        (b) => b.status === 'returned' || b.status === 'closed' || b.status === 'rejected'
      );

      setActiveBorrows(active);
      setHistoryBorrows(history);
    } catch (error) {
      toast.error('Failed to load borrowed books');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBorrows();
  }, [loadBorrows]);

  async function handleReturn() {
    if (!returningBorrow) return;
    setReturning(true);
    try {
      const res = await apiFetch('/borrow/return', {
        method: 'POST',
        body: JSON.stringify({ borrowId: returningBorrow._id }),
      });
      toast.success(res.message || 'Book returned successfully!');
      setReturnDialogOpen(false);
      setReturningBorrow(null);
      loadBorrows();
    } catch (error) {
      toast.error(error.message || 'Failed to return book');
    } finally {
      setReturning(false);
    }
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

  if (loading) {
    return <LoadingSpinner message="Loading your books..." />;
  }

  return (
    <div className="page-enter space-y-4 sm:space-y-6">
      {/* Header */}
     

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl sm:rounded-2xl p-1  ">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white rounded-lg sm:rounded-xl px-3 sm:px-4 transition-all duration-200 flex-1 sm:flex-initial text-sm"
          >
            Active ({activeBorrows.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white rounded-lg sm:rounded-xl px-3 sm:px-4 transition-all duration-200 flex-1 sm:flex-initial text-sm"
          >
            History ({historyBorrows.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Borrows Tab */}
        <TabsContent value="active">
          {activeBorrows.length === 0 ? (
            <EmptyState
              icon={BookMarked}
              title="No active borrows"
              description="You don't have any active borrows right now. Browse the catalog to find your next read!"
              actionLabel="Browse Books"
              onAction={() => (window.location.href = '/student/books')}
            />
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {activeBorrows.map((borrow) => {
                const book = borrow.bookId || {};
                const overdue = borrow.status === 'overdue' || isOverdue(borrow.dueDate);
                const daysLeft = daysUntilDue(borrow.dueDate);
                const StatusIcon = statusIcons[borrow.status] || BookOpen;
                const iconColor = statusIconColors[borrow.status] || 'bg-[#DDE7EA] text-[#5D7480]';
                const canReturn =
                  borrow.status === 'issued' || borrow.status === 'overdue';

                return (
                  <div
                    key={borrow._id}
                    className={`rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-3 sm:p-4 md:p-6 transition-all duration-200 hover:-translate-y-0.5 ${
                      overdue
                        ? 'border-[#F28B82]/40'
                        : borrow.status === 'requested' || borrow.status === 'approved'
                        ? 'border-[#84C7E8]/40'
                        : 'border-white/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div
                          className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
                        >
                          <StatusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/student/books/${book._id}`}
                            className="font-semibold hover:text-[#5D7480] transition-colors truncate block text-sm sm:text-base text-[#1F2937]"
                          >
                            {book.title || 'Unknown Book'}
                          </Link>
                          <p className="text-xs sm:text-sm text-[#6B7280]">
                            {book.author || 'Unknown Author'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                            <span
                              className={`text-xs font-medium rounded-lg sm:rounded-xl px-2 py-0.5 ${
                                statusBadgeMap[borrow.status] || 'bg-[#F9FAFB] text-[#6B7280]'
                              }`}
                            >
                              {borrow.status}
                            </span>
                            {borrow.status === 'issued' && (
                              <>
                                <span className="text-[10px] sm:text-xs text-[#6B7280] flex items-center gap-1 hidden sm:flex">
                                  <Calendar className="h-3 w-3" />
                                  Issued: {formatDate(borrow.issueDate)}
                                </span>
                                <span className="text-[#E5E7EB] hidden sm:inline">|</span>
                                <span
                                  className={`text-[10px] sm:text-xs flex items-center gap-1 ${
                                    overdue
                                      ? 'text-[#C25B4F] font-medium'
                                      : daysLeft <= 3
                                      ? 'text-[#C4952A] font-medium'
                                      : 'text-[#6B7280]'
                                  }`}
                                >
                                  <Clock className="h-3 w-3" />
                                  <span className="hidden sm:inline">Due: </span>{formatDate(borrow.dueDate)}
                                  {overdue && ' (Overdue!)'}
                                  {!overdue && daysLeft <= 3 && ` (${daysLeft}d left)`}
                                </span>
                              </>
                            )}
                            {borrow.status === 'requested' && (
                              <span className="text-[10px] sm:text-xs text-[#4A8DB7]">
                                Waiting for approval
                              </span>
                            )}
                            {borrow.status === 'approved' && (
                              <span className="text-[10px] sm:text-xs text-[#6B8F83]">
                                Approved — awaiting pickup
                              </span>
                            )}
                            {overdue && borrow.dueDate && (
                              <span className="text-[10px] sm:text-xs text-[#C25B4F] font-medium">
                                Overdue by {Math.abs(daysLeft)} day
                                {Math.abs(daysLeft) !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canReturn && (
                        <Button
                          size="sm"
                          className="shrink-0 bg-[#F28B82] hover:bg-[#C25B4F] text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto"
                          onClick={() => {
                            setReturningBorrow(borrow);
                            setReturnDialogOpen(true);
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Return Book
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {historyBorrows.length === 0 ? (
            <EmptyState
              icon={History}
              title="No borrowing history"
              description="Your returned books will appear here."
            />
          ) : (
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
              {/* Desktop table */}
              <div className="hidden sm:block table-responsive overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]/80">
                      <th className="text-left text-sm font-medium text-[#6B7280] p-4">
                        Book
                      </th>
                      <th className="text-left text-sm font-medium text-[#6B7280] p-4">
                        Issue Date
                      </th>
                      <th className="text-left text-sm font-medium text-[#6B7280] p-4">
                        Return Date
                      </th>
                      <th className="text-left text-sm font-medium text-[#6B7280] p-4">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyBorrows.map((borrow) => {
                      const book = borrow.bookId || {};
                      return (
                        <tr key={borrow._id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]/50 transition-colors">
                          <td className="p-4">
                            <Link
                              href={`/student/books/${book._id}`}
                              className="font-medium hover:text-[#5D7480] transition-colors text-[#1F2937]"
                            >
                              {book.title || 'Unknown Book'}
                            </Link>
                            <p className="text-xs text-[#6B7280]">
                              {book.author || 'Unknown Author'}
                            </p>
                          </td>
                          <td className="p-4 text-sm text-[#6B7280]">
                            {formatDate(borrow.issueDate || borrow.requestDate)}
                          </td>
                          <td className="p-4 text-sm text-[#6B7280]">
                            {formatDate(borrow.returnDate)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-xs font-medium rounded-xl px-2.5 py-0.5 ${
                                statusBadgeMap[borrow.status] || 'bg-[#F9FAFB] text-[#6B7280]'
                              }`}
                            >
                              {borrow.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[#E5E7EB]">
                {historyBorrows.map((borrow) => {
                  const book = borrow.bookId || {};
                  return (
                    <div key={borrow._id} className="p-3 sm:p-4 space-y-2">
                      <div>
                        <Link
                          href={`/student/books/${book._id}`}
                          className="font-medium hover:text-[#5D7480] text-sm text-[#1F2937]"
                        >
                          {book.title || 'Unknown Book'}
                        </Link>
                        <p className="text-xs text-[#6B7280]">
                          {book.author || 'Unknown Author'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#6B7280] text-xs">
                          {formatDate(borrow.issueDate || borrow.requestDate)} —{' '}
                          {formatDate(borrow.returnDate)}
                        </span>
                        <span
                          className={`text-xs font-medium rounded-lg px-2 py-0.5 ${
                            statusBadgeMap[borrow.status] || 'bg-[#F9FAFB] text-[#6B7280]'
                          }`}
                        >
                          {borrow.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Return Confirmation Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="rounded-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937]">Return Book</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Are you sure you want to return &quot;{returningBorrow?.bookId?.title || 'this book'}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {returningBorrow?.status === 'overdue' && (
            <div className="rounded-xl sm:rounded-2xl bg-[#FDE8E6]/60 border border-[#F28B82]/30 p-3 text-sm text-[#C25B4F]">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              This book is overdue. A fine may be applied upon return.
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl sm:rounded-2xl border-[#E5E7EB] text-[#6B7280] transition-all duration-200">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="bg-[#F28B82] hover:bg-[#C25B4F] text-white rounded-xl sm:rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              onClick={handleReturn}
              disabled={returning}
            >
              {returning ? 'Returning...' : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

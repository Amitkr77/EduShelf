'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  RotateCcw,
  Search,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function ReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: '',
    item: null,
  });
  const [processing, setProcessing] = useState(false);

  const fetchIssuedBooks = useCallback(async () => {
    try {
      setLoading(true);
      const [issuedRes, overdueRes] = await Promise.all([
        apiFetch('/borrow?status=issued&limit=100').catch(() => ({
          data: { items: [] },
        })),
        apiFetch('/borrow?status=overdue&limit=100').catch(() => ({
          data: { items: [] },
        })),
      ]);

      const allBooks = [
        ...(issuedRes.data?.items || []),
        ...(overdueRes.data?.items || []),
      ];
      setIssuedBooks(allBooks);
    } catch (error) {
      toast.error('Failed to load issued books');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssuedBooks();
  }, [fetchIssuedBooks]);

  async function handleReturn(borrowId) {
    try {
      setProcessing(true);
      const res = await apiFetch('/borrow/return', {
        method: 'POST',
        body: { borrowId },
      });
      const daysOverdue = res.data?.daysOverdue || 0;
      if (daysOverdue > 0) {
        toast.success(
          `Book returned successfully. Fine of $${(
            daysOverdue * 2
          ).toFixed(2)} applied for ${daysOverdue} day(s) overdue.`
        );
      } else {
        toast.success('Book returned successfully');
      }
      setActionDialog({ open: false, type: '', item: null });
      fetchIssuedBooks();
    } catch (error) {
      toast.error(error.message || 'Failed to process return');
    } finally {
      setProcessing(false);
    }
  }

  async function handleRenew(borrowId, currentDueDate) {
    try {
      setProcessing(true);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + 14);
      await apiFetch(`/borrow/${borrowId}`, {
        method: 'PUT',
        body: { dueDate: newDueDate.toISOString() },
      });
      toast.success('Book renewed successfully. Due date extended by 14 days.');
      setActionDialog({ open: false, type: '', item: null });
      fetchIssuedBooks();
    } catch (error) {
      toast.error(error.message || 'Failed to renew book');
    } finally {
      setProcessing(false);
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

  function getDaysOverdue(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.max(0, Math.ceil((now - due) / (1000 * 60 * 60 * 24)));
  }

  function getEstimatedFine(dueDate) {
    const days = getDaysOverdue(dueDate);
    return (days * 2).toFixed(2);
  }

  const filteredBooks = issuedBooks.filter((borrow) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (borrow.bookId?.title || '').toLowerCase().includes(q) ||
      (borrow.userId?.name || '').toLowerCase().includes(q) ||
      (borrow.userId?.email || '').toLowerCase().includes(q) ||
      (borrow.bookId?.ISBN || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <LoadingSpinner message="Loading issued books..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Process Returns</h1>
        <p className="text-[#6B7280] mt-1">
          Manage book returns and renewals.
        </p>
      </div>

      {/* Search - Glass Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <input
            placeholder="Search by book title, student name, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] pl-10 pr-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
          />
        </div>
      </div>

      {/* Books Table */}
      <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1F2937]">Currently Issued Books</h2>
            <Badge className="bg-[#E3F2FA] text-[#4A8DB7] hover:bg-[#E3F2FA] border-0 rounded-full px-3">
              {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        {filteredBooks.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={RotateCcw}
              title="No issued books found"
              description={
                searchQuery
                  ? 'Try adjusting your search query.'
                  : 'There are no books currently issued.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F4F8F9] hover:bg-[#F4F8F9]">
                  <TableHead className="text-[#6B7280] font-semibold">Book Title</TableHead>
                  <TableHead className="text-[#6B7280] font-semibold">Student</TableHead>
                  <TableHead className="hidden md:table-cell text-[#6B7280] font-semibold">
                    Issue Date
                  </TableHead>
                  <TableHead className="text-[#6B7280] font-semibold">Due Date</TableHead>
                  <TableHead className="text-[#6B7280] font-semibold">Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-[#6B7280] font-semibold">
                    Fine Estimate
                  </TableHead>
                  <TableHead className="text-right text-[#6B7280] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((borrow) => {
                  const isOverdue = borrow.status === 'overdue' || getDaysOverdue(borrow.dueDate) > 0;
                  const daysOverdue = getDaysOverdue(borrow.dueDate);
                  const estimatedFine = getEstimatedFine(borrow.dueDate);

                  return (
                    <TableRow
                      key={borrow._id}
                      className={`${isOverdue ? 'bg-[#FDE8E6]/60' : ''} hover:bg-[#F4F8F9] transition-colors border-[#E5E7EB]`}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[#1F2937] truncate max-w-[180px]">
                            {borrow.bookId?.title || 'Unknown'}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {borrow.bookId?.author}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-[#1F2937]">
                          {borrow.userId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {borrow.userId?.email}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#6B7280]">
                        {formatDate(borrow.issueDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#6B7280]" />
                          <span className="text-sm text-[#1F2937]">
                            {formatDate(borrow.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isOverdue ? (
                          <Badge className="bg-[#FDE8E6] text-[#C25B4F] hover:bg-[#FDE8E6] border-0 gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {daysOverdue}d overdue
                          </Badge>
                        ) : (
                          <Badge className="bg-[#E3F2FA] text-[#4A8DB7] hover:bg-[#E3F2FA] border-0">
                            Issued
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {isOverdue ? (
                          <div className="flex items-center gap-1 text-[#C25B4F]">
                            <DollarSign className="h-3 w-3" />
                            <span className="text-sm font-medium">
                              ${estimatedFine}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#6B7280]">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                type: 'renew',
                                item: borrow,
                              })
                            }
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Renew
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium bg-[#7CCB7A] text-white hover:opacity-90 transition-all duration-200"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                type: 'return',
                                item: borrow,
                              })
                            }
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Return
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
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
              {actionDialog.type === 'return'
                ? 'Process Return'
                : 'Renew Book'}
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              {actionDialog.type === 'return'
                ? (() => {
                    const isOverdue =
                      actionDialog.item &&
                      getDaysOverdue(actionDialog.item.dueDate) > 0;
                    return isOverdue
                      ? `Are you sure you want to return "${actionDialog.item?.bookId?.title}"? This book is overdue by ${getDaysOverdue(actionDialog.item?.dueDate)} day(s). A fine of $${getEstimatedFine(actionDialog.item?.dueDate)} will be applied.`
                      : `Are you sure you want to return "${actionDialog.item?.bookId?.title}" borrowed by ${actionDialog.item?.userId?.name}?`;
                  })()
                : `Are you sure you want to renew "${actionDialog.item?.bookId?.title}"? The due date will be extended by 14 days from the current due date (${formatDate(actionDialog.item?.dueDate)}).`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="inline-flex items-center justify-center h-10 px-5 rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200"
              onClick={() =>
                setActionDialog({ open: false, type: '', item: null })
              }
            >
              Cancel
            </button>
            {actionDialog.type === 'return' ? (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-2xl text-sm font-medium bg-[#7CCB7A] hover:opacity-90 text-white transition-all duration-200"
                onClick={() => handleReturn(actionDialog.item?._id)}
                disabled={processing}
              >
                <RotateCcw className="h-4 w-4" />
                {processing ? 'Processing...' : 'Confirm Return'}
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200"
                onClick={() =>
                  handleRenew(
                    actionDialog.item?._id,
                    actionDialog.item?.dueDate
                  )
                }
                disabled={processing}
              >
                <RefreshCw className="h-4 w-4" />
                {processing ? 'Renewing...' : 'Confirm Renewal'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

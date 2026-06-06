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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      // Fetch both issued and overdue books
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
        <h1 className="text-2xl font-bold tracking-tight">Process Returns</h1>
        <p className="text-muted-foreground">
          Manage book returns and renewals.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by book title, student name, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Currently Issued Books</CardTitle>
            <Badge variant="secondary" className="bg-teal-100 text-teal-700">
              {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBooks.length === 0 ? (
            <div className="p-6">
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
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Issue Date
                    </TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Fine Estimate
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        className={isOverdue ? 'bg-rose-50/50' : ''}
                      >
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[180px]">
                              {borrow.bookId?.title || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {borrow.bookId?.author}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {borrow.userId?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {borrow.userId?.email}
                          </p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {formatDate(borrow.issueDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(borrow.dueDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOverdue ? (
                            <Badge
                              variant="destructive"
                              className="gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {daysOverdue}d overdue
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                              Issued
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {isOverdue ? (
                            <div className="flex items-center gap-1 text-rose-600">
                              <DollarSign className="h-3 w-3" />
                              <span className="text-sm font-medium">
                                ${estimatedFine}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-teal-200 text-teal-700 hover:bg-teal-50"
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  type: 'renew',
                                  item: borrow,
                                })
                              }
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Renew
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  type: 'return',
                                  item: borrow,
                                })
                              }
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Return
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
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
              {actionDialog.type === 'return'
                ? 'Process Return'
                : 'Renew Book'}
            </DialogTitle>
            <DialogDescription>
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
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, type: '', item: null })
              }
            >
              Cancel
            </Button>
            {actionDialog.type === 'return' ? (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleReturn(actionDialog.item?._id)}
                disabled={processing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {processing ? 'Processing...' : 'Confirm Return'}
              </Button>
            ) : (
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() =>
                  handleRenew(
                    actionDialog.item?._id,
                    actionDialog.item?.dueDate
                  )
                }
                disabled={processing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {processing ? 'Renewing...' : 'Confirm Renewal'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

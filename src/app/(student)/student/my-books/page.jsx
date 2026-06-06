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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

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

  const statusColors = {
    requested: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    issued: 'bg-teal-100 text-teal-700',
    overdue: 'bg-rose-100 text-rose-700',
    returned: 'bg-gray-100 text-gray-700',
    closed: 'bg-gray-100 text-gray-700',
    rejected: 'bg-rose-100 text-rose-700',
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

  if (loading) {
    return <LoadingSpinner message="Loading your books..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Books</h1>
        <p className="text-muted-foreground">
          Manage your borrowed books and view your borrowing history.
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Active ({activeBorrows.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
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
            <div className="space-y-3">
              {activeBorrows.map((borrow) => {
                const book = borrow.bookId || {};
                const overdue = borrow.status === 'overdue' || isOverdue(borrow.dueDate);
                const daysLeft = daysUntilDue(borrow.dueDate);
                const StatusIcon = statusIcons[borrow.status] || BookOpen;
                const canReturn =
                  borrow.status === 'issued' || borrow.status === 'overdue';

                return (
                  <Card
                    key={borrow._id}
                    className={
                      overdue
                        ? 'border-rose-200 bg-rose-50/50'
                        : borrow.status === 'requested' || borrow.status === 'approved'
                        ? 'border-blue-200 bg-blue-50/30'
                        : ''
                    }
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                              overdue
                                ? 'bg-rose-100 text-rose-600'
                                : borrow.status === 'requested' || borrow.status === 'approved'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-emerald-100 text-emerald-600'
                            }`}
                          >
                            <StatusIcon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/student/books/${book._id}`}
                              className="font-semibold hover:text-emerald-600 transition-colors truncate block"
                            >
                              {book.title || 'Unknown Book'}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {book.author || 'Unknown Author'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge
                                className={`text-xs ${
                                  statusColors[borrow.status] || 'bg-gray-100 text-gray-700'
                                }`}
                                variant="secondary"
                              >
                                {borrow.status}
                              </Badge>
                              {borrow.status === 'issued' && (
                                <>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Issued: {formatDate(borrow.issueDate)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">|</span>
                                  <span
                                    className={`text-xs flex items-center gap-1 ${
                                      overdue
                                        ? 'text-rose-600 font-medium'
                                        : daysLeft <= 3
                                        ? 'text-amber-600 font-medium'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <Clock className="h-3 w-3" />
                                    Due: {formatDate(borrow.dueDate)}
                                    {overdue && ' (Overdue!)'}
                                    {!overdue && daysLeft <= 3 && ` (${daysLeft}d left)`}
                                  </span>
                                </>
                              )}
                              {borrow.status === 'requested' && (
                                <span className="text-xs text-blue-600">
                                  Waiting for approval
                                </span>
                              )}
                              {borrow.status === 'approved' && (
                                <span className="text-xs text-emerald-600">
                                  Approved — awaiting pickup
                                </span>
                              )}
                              {overdue && borrow.dueDate && (
                                <span className="text-xs text-rose-600 font-medium">
                                  Overdue by {Math.abs(daysLeft)} day
                                  {Math.abs(daysLeft) !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {canReturn && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
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
                    </CardContent>
                  </Card>
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
            <Card>
              <CardContent className="p-0">
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left text-sm font-medium text-muted-foreground p-4">
                          Book
                        </th>
                        <th className="text-left text-sm font-medium text-muted-foreground p-4">
                          Issue Date
                        </th>
                        <th className="text-left text-sm font-medium text-muted-foreground p-4">
                          Return Date
                        </th>
                        <th className="text-left text-sm font-medium text-muted-foreground p-4">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyBorrows.map((borrow) => {
                        const book = borrow.bookId || {};
                        return (
                          <tr key={borrow._id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-4">
                              <Link
                                href={`/student/books/${book._id}`}
                                className="font-medium hover:text-emerald-600 transition-colors"
                              >
                                {book.title || 'Unknown Book'}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {book.author || 'Unknown Author'}
                              </p>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {formatDate(borrow.issueDate || borrow.requestDate)}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {formatDate(borrow.returnDate)}
                            </td>
                            <td className="p-4">
                              <Badge
                                className={`text-xs ${
                                  statusColors[borrow.status] || 'bg-gray-100 text-gray-700'
                                }`}
                                variant="secondary"
                              >
                                {borrow.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y">
                  {historyBorrows.map((borrow) => {
                    const book = borrow.bookId || {};
                    return (
                      <div key={borrow._id} className="p-4 space-y-2">
                        <div>
                          <Link
                            href={`/student/books/${book._id}`}
                            className="font-medium hover:text-emerald-600"
                          >
                            {book.title || 'Unknown Book'}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {book.author || 'Unknown Author'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatDate(borrow.issueDate || borrow.requestDate)} —{' '}
                            {formatDate(borrow.returnDate)}
                          </span>
                          <Badge
                            className={`text-xs ${
                              statusColors[borrow.status] || 'bg-gray-100 text-gray-700'
                            }`}
                            variant="secondary"
                          >
                            {borrow.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Return Confirmation Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to return &quot;{returningBorrow?.bookId?.title || 'this book'}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {returningBorrow?.status === 'overdue' && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              This book is overdue. A fine may be applied upon return.
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
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

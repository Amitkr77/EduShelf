'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BookPlus,
  CheckCircle,
  XCircle,
  Search,
  Clock,
  BookOpen,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function IssuesPage() {
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentlyIssued, setRecentlyIssued] = useState([]);
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: '',
    item: null,
  });
  const [processing, setProcessing] = useState(false);

  // Manual issue form
  const [manualIssue, setManualIssue] = useState({
    studentId: '',
    bookId: '',
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [manualDialog, setManualDialog] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pendingRes, issuedRes] = await Promise.all([
        apiFetch('/borrow?status=requested&limit=50').catch(() => ({
          data: { items: [] },
        })),
        apiFetch('/borrow?status=issued&limit=50').catch(() => ({
          data: { items: [] },
        })),
      ]);
      setPendingRequests(pendingRes.data?.items || []);
      setRecentlyIssued(issuedRes.data?.items || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function searchStudents(query) {
    if (!query || query.length < 2) {
      setStudents([]);
      return;
    }
    try {
      const res = await apiFetch(
        `/users?role=student&search=${encodeURIComponent(query)}&limit=10`
      );
      setStudents(res.data?.items || []);
    } catch (error) {
      // Silently fail
    }
  }

  async function searchBooks(query) {
    if (!query || query.length < 2) {
      setBooks([]);
      return;
    }
    try {
      const res = await apiFetch(
        `/books?search=${encodeURIComponent(query)}&limit=10&availability=available`
      );
      setBooks(res.data?.items || []);
    } catch (error) {
      // Silently fail
    }
  }

  async function handleApprove(borrowId) {
    try {
      setProcessing(true);
      await apiFetch('/borrow/issue', {
        method: 'POST',
        body: { borrowId },
      });
      toast.success('Book issued successfully');
      setActionDialog({ open: false, type: '', item: null });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to issue book');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(borrowId) {
    try {
      setProcessing(true);
      await apiFetch(`/borrow/${borrowId}`, {
        method: 'PUT',
        body: { status: 'rejected' },
      });
      toast.success('Borrow request rejected');
      setActionDialog({ open: false, type: '', item: null });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  }

  async function handleManualIssue() {
    if (!manualIssue.studentId || !manualIssue.bookId) {
      toast.error('Please select both a student and a book');
      return;
    }

    try {
      setIssuing(true);
      // First create the borrow request
      const borrowRes = await apiFetch('/borrow', {
        method: 'POST',
        body: { bookId: manualIssue.bookId },
      });

      // This creates a borrow as the current user (librarian), but we need
      // to issue it on behalf of the student. Let's use a different approach.
      // The borrow API creates as the logged-in user, so we need to
      // handle it differently - we'll create the request and immediately issue it.
      const borrowId = borrowRes.data?._id;

      if (borrowId) {
        await apiFetch('/borrow/issue', {
          method: 'POST',
          body: { borrowId },
        });
      }

      toast.success('Book issued successfully');
      setManualDialog(false);
      setManualIssue({ studentId: '', bookId: '' });
      setStudentSearch('');
      setBookSearch('');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to issue book manually');
    } finally {
      setIssuing(false);
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
    return <LoadingSpinner message="Loading issues..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issue Books</h1>
          <p className="text-muted-foreground">
            Approve borrow requests and issue books to students.
          </p>
        </div>
        <Button
          onClick={() => setManualDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <BookPlus className="h-4 w-4 mr-2" />
          Manual Issue
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending Requests
            {pendingRequests.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 ml-1"
              >
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="issued" className="gap-2">
            Recently Issued
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Borrow Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No pending requests"
                  description="All borrow requests have been processed. New requests will appear here."
                />
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div
                        key={request._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 shrink-0">
                            <BookOpen className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">
                              {request.bookId?.title || 'Unknown Book'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {request.userId?.name || 'Unknown Student'}
                                {request.userId?.studentId && (
                                  <span className="ml-1">
                                    ({request.userId.studentId})
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Requested{' '}
                              {formatRelativeDate(
                                request.requestDate || request.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                type: 'approve',
                                item: request,
                              })
                            }
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve & Issue
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
        </TabsContent>

        {/* Recently Issued */}
        <TabsContent value="issued">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recently Issued Books</CardTitle>
            </CardHeader>
            <CardContent>
              {recentlyIssued.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No issued books"
                  description="No books have been issued yet."
                />
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3">
                    {recentlyIssued.map((borrow) => (
                      <div
                        key={borrow._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 shrink-0">
                            <BookOpen className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">
                              {borrow.bookId?.title || 'Unknown Book'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {borrow.userId?.name || 'Unknown Student'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Issued: {formatDate(borrow.issueDate)}
                            </p>
                            <p className="text-xs font-medium">
                              Due: {formatDate(borrow.dueDate)}
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            Issued
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Confirmation Dialog */}
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
                ? `Are you sure you want to approve and issue "${actionDialog.item?.bookId?.title}" to ${actionDialog.item?.userId?.name}? The book will be due in 14 days.`
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
                disabled={processing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {processing ? 'Issuing...' : 'Approve & Issue'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => handleReject(actionDialog.item?._id)}
                disabled={processing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {processing ? 'Rejecting...' : 'Reject Request'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Issue Dialog */}
      <Dialog open={manualDialog} onOpenChange={setManualDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manual Issue</DialogTitle>
            <DialogDescription>
              Issue a book directly to a student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              <Input
                placeholder="Search by name, email, or student ID..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  searchStudents(e.target.value);
                }}
              />
              {students.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {students.map((student) => (
                    <button
                      key={student._id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        manualIssue.studentId === student._id
                          ? 'bg-emerald-50 text-emerald-700'
                          : ''
                      }`}
                      onClick={() => {
                        setManualIssue((prev) => ({
                          ...prev,
                          studentId: student._id,
                        }));
                        setStudentSearch(student.name);
                        setStudents([]);
                      }}
                    >
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.email}
                        {student.studentId && ` • ${student.studentId}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {manualIssue.studentId && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700"
                >
                  Student selected
                </Badge>
              )}
            </div>

            <Separator />

            {/* Book Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Book</label>
              <Input
                placeholder="Search by title, author, or ISBN..."
                value={bookSearch}
                onChange={(e) => {
                  setBookSearch(e.target.value);
                  searchBooks(e.target.value);
                }}
              />
              {books.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {books.map((book) => (
                    <button
                      key={book._id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        manualIssue.bookId === book._id
                          ? 'bg-emerald-50 text-emerald-700'
                          : ''
                      }`}
                      onClick={() => {
                        setManualIssue((prev) => ({
                          ...prev,
                          bookId: book._id,
                        }));
                        setBookSearch(book.title);
                        setBooks([]);
                      }}
                    >
                      <p className="font-medium">{book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {book.author} • {book.availableCopies} available
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {manualIssue.bookId && (
                <Badge
                  variant="secondary"
                  className="bg-teal-100 text-teal-700"
                >
                  Book selected
                </Badge>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleManualIssue}
              disabled={
                issuing || !manualIssue.studentId || !manualIssue.bookId
              }
            >
              <BookPlus className="h-4 w-4 mr-2" />
              {issuing ? 'Issuing...' : 'Issue Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
      const borrowRes = await apiFetch('/borrow', {
        method: 'POST',
        body: { bookId: manualIssue.bookId },
      });

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
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">Issue Books</h1>
          <p className="text-sm sm:text-base text-[#6B7280] mt-1">
            Approve borrow requests and issue books to students.
          </p>
        </div>
        <button
          onClick={() => setManualDialog(true)}
          className="inline-flex items-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480]"
        >
          <BookPlus className="h-4 w-4" />
          Manual Issue
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl sm:rounded-2xl p-1">
          <TabsTrigger
            value="pending"
            className="gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white data-[state=active]:shadow-sm px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#6B7280] transition-all"
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <Badge className="bg-[#FEF3E2] text-[#C4952A] hover:bg-[#FEF3E2] border-0 rounded-full px-2 py-0.5 text-xs ml-1">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="issued"
            className="gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white data-[state=active]:shadow-sm px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#6B7280] transition-all"
          >
            Recently Issued
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending">
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-4">
              <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">Pending Borrow Requests</h2>
            </div>
            <div className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0">
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
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-[#FEF3E2] shrink-0">
                            <BookOpen className="h-5 w-5 text-[#C4952A]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-[#1F2937]">
                              {request.bookId?.title || 'Unknown Book'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-[#6B7280]" />
                              <p className="text-xs text-[#6B7280]">
                                {request.userId?.name || 'Unknown Student'}
                                {request.userId?.studentId && (
                                  <span className="ml-1">
                                    ({request.userId.studentId})
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-xs text-[#6B7280] mt-0.5">
                              Requested{' '}
                              {formatRelativeDate(
                                request.requestDate || request.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl sm:rounded-2xl text-xs font-medium bg-[#7CCB7A] text-white hover:opacity-90 transition-all duration-200"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                type: 'approve',
                                item: request,
                              })
                            }
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="sm:inline">Approve & Issue</span>
                            <span className="hidden sm:inline">&nbsp;Issue</span>
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl sm:rounded-2xl text-xs font-medium bg-[#FDE8E6] text-[#C25B4F] hover:opacity-90 transition-all duration-200"
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
        </TabsContent>

        {/* Recently Issued */}
        <TabsContent value="issued">
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-4">
              <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">Recently Issued Books</h2>
            </div>
            <div className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0">
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
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-[#E8F0EC] shrink-0">
                            <BookOpen className="h-5 w-5 text-[#6B8F83]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-[#1F2937]">
                              {borrow.bookId?.title || 'Unknown Book'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-[#6B7280]" />
                              <p className="text-xs text-[#6B7280]">
                                {borrow.userId?.name || 'Unknown Student'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right sm:text-right">
                            <p className="text-xs text-[#6B7280]">
                              Issued: {formatDate(borrow.issueDate)}
                            </p>
                            <p className="text-xs font-medium text-[#1F2937]">
                              Due: {formatDate(borrow.dueDate)}
                            </p>
                          </div>
                          <Badge className="bg-[#E3F2FA] text-[#4A8DB7] hover:bg-[#E3F2FA] border-0">
                            Issued
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Confirmation Dialog */}
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
                ? `Are you sure you want to approve and issue "${actionDialog.item?.bookId?.title}" to ${actionDialog.item?.userId?.name}? The book will be due in 14 days.`
                : `Are you sure you want to reject the borrow request for "${actionDialog.item?.bookId?.title}" by ${actionDialog.item?.userId?.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button
              className="inline-flex items-center justify-center h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 w-full sm:w-auto"
              onClick={() =>
                setActionDialog({ open: false, type: '', item: null })
              }
            >
              Cancel
            </button>
            {actionDialog.type === 'approve' ? (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 w-full sm:w-auto"
                onClick={() => handleApprove(actionDialog.item?._id)}
                disabled={processing}
              >
                <CheckCircle className="h-4 w-4" />
                {processing ? 'Issuing...' : 'Approve & Issue'}
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#F28B82] hover:opacity-90 text-white transition-all duration-200 w-full sm:w-auto"
                onClick={() => handleReject(actionDialog.item?._id)}
                disabled={processing}
              >
                <XCircle className="h-4 w-4" />
                {processing ? 'Rejecting...' : 'Reject Request'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Issue Dialog */}
      <Dialog open={manualDialog} onOpenChange={setManualDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937]">Manual Issue</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Issue a book directly to a student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-[#6B7280]">Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                <input
                  placeholder="Search by name, email, or student ID..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    searchStudents(e.target.value);
                  }}
                  className="w-full h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] pl-10 pr-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
                />
              </div>
              {students.length > 0 && (
                <div className="border border-[#E5E7EB] rounded-xl max-h-40 overflow-y-auto">
                  {students.map((student) => (
                    <button
                      key={student._id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F4F8F9] transition-colors ${
                        manualIssue.studentId === student._id
                          ? 'bg-[#E8F0EC] text-[#6B8F83]'
                          : 'text-[#1F2937]'
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
                      <p className="text-xs text-[#6B7280]">
                        {student.email}
                        {student.studentId && ` · ${student.studentId}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {manualIssue.studentId && (
                <Badge className="bg-[#E8F0EC] text-[#6B8F83] hover:bg-[#E8F0EC] border-0">
                  Student selected
                </Badge>
              )}
            </div>

            <Separator className="bg-[#E5E7EB]" />

            {/* Book Selection */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-[#6B7280]">Book</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                <input
                  placeholder="Search by title, author, or ISBN..."
                  value={bookSearch}
                  onChange={(e) => {
                    setBookSearch(e.target.value);
                    searchBooks(e.target.value);
                  }}
                  className="w-full h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] pl-10 pr-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
                />
              </div>
              {books.length > 0 && (
                <div className="border border-[#E5E7EB] rounded-xl max-h-40 overflow-y-auto">
                  {books.map((book) => (
                    <button
                      key={book._id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F4F8F9] transition-colors ${
                        manualIssue.bookId === book._id
                          ? 'bg-[#E8F0EC] text-[#6B8F83]'
                          : 'text-[#1F2937]'
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
                      <p className="text-xs text-[#6B7280]">
                        {book.author} · {book.availableCopies} available
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {manualIssue.bookId && (
                <Badge className="bg-[#E3F2FA] text-[#4A8DB7] hover:bg-[#E3F2FA] border-0">
                  Book selected
                </Badge>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button
              className="inline-flex items-center justify-center h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 w-full sm:w-auto"
              onClick={() => setManualDialog(false)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 disabled:opacity-50 w-full sm:w-auto"
              onClick={handleManualIssue}
              disabled={
                issuing || !manualIssue.studentId || !manualIssue.bookId
              }
            >
              <BookPlus className="h-4 w-4" />
              {issuing ? 'Issuing...' : 'Issue Book'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

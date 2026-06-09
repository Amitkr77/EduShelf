'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  IndianRupee as RupeeSign,
  Search,
  CheckCircle,
  Ban,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function FinesPage() {
  const [loading, setLoading] = useState(true);
  const [fines, setFines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({
    total: 0,
    collected: 0,
    pending: 0,
    waived: 0,
  });
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: '',
    fine: null,
  });
  const [processing, setProcessing] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (statusFilter && statusFilter !== 'all')
        params.set('status', statusFilter);

      const [finesRes, allPaidRes, allPendingRes, allWaivedRes, allRes] =
        await Promise.all([
          apiFetch(`/fines?${params.toString()}`),
          apiFetch('/fines?status=paid&limit=1000').catch(() => ({
            data: { items: [] },
          })),
          apiFetch('/fines?status=pending&limit=1000').catch(() => ({
            data: { items: [] },
          })),
          apiFetch('/fines?status=waived&limit=1000').catch(() => ({
            data: { items: [] },
          })),
          apiFetch('/fines?limit=1000').catch(() => ({
            data: { items: [] },
          })),
        ]);

      setFines(finesRes.data?.items || []);
      setPagination(
        finesRes.data?.pagination || { page: 1, pages: 1, total: 0 }
      );

      const totalAmount = (allRes.data?.items || []).reduce(
        (sum, f) => sum + (f.amount || 0),
        0
      );
      const collectedAmount = (allPaidRes.data?.items || []).reduce(
        (sum, f) => sum + (f.amount || 0),
        0
      );
      const pendingAmount = (allPendingRes.data?.items || []).reduce(
        (sum, f) => sum + (f.amount || 0),
        0
      );
      const waivedAmount = (allWaivedRes.data?.items || []).reduce(
        (sum, f) => sum + (f.amount || 0),
        0
      );

      setSummary({
        total: totalAmount,
        collected: collectedAmount,
        pending: pendingAmount,
        waived: waivedAmount,
      });
    } catch (error) {
      toast.error('Failed to load fines data');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleMarkPaid(fineId) {
    try {
      setProcessing(true);
      await apiFetch(`/fines/${fineId}`, {
        method: 'PUT',
        body: { status: 'paid' },
      });
      toast.success('Fine marked as paid');
      setActionDialog({ open: false, type: '', fine: null });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to update fine');
    } finally {
      setProcessing(false);
    }
  }

  async function handleWaiveFine(fineId) {
    try {
      setProcessing(true);
      await apiFetch(`/fines/${fineId}`, {
        method: 'PUT',
        body: { status: 'waived' },
      });
      toast.success('Fine waived successfully');
      setActionDialog({ open: false, type: '', fine: null });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to waive fine');
    } finally {
      setProcessing(false);
    }
  }

  async function handleCalculateOverdue() {
    try {
      setCalculating(true);
      const res = await apiFetch('/fines', { method: 'POST' });
      const processed = res.data?.processed || 0;
      toast.success(
        processed > 0
          ? `${processed} overdue fine(s) calculated successfully`
          : 'No new overdue fines to calculate'
      );
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to calculate fines');
    } finally {
      setCalculating(false);
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

  function getStatusBadge(status) {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-[#FEF3E2] text-[#C4952A] hover:bg-[#FEF3E2] border-0">
            Pending
          </Badge>
        );
      case 'paid':
        return (
          <Badge className="bg-[#E8F0EC] text-[#6B8F83] hover:bg-[#E8F0EC] border-0">
            Paid
          </Badge>
        );
      case 'waived':
        return (
          <Badge className="bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F9FAFB] border-0">
            Waived
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  const filteredFines = fines.filter((fine) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (fine.userId?.name || '').toLowerCase().includes(q) ||
      (fine.bookId?.title || '').toLowerCase().includes(q) ||
      (fine.userId?.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* <div>
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">Fine Management</h1>
          <p className="text-sm sm:text-base text-[#6B7280] mt-1">
            Track and manage overdue fines.
          </p>
        </div> */}
        <button
          onClick={handleCalculateOverdue}
          disabled={calculating}
          className="inline-flex items-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480] disabled:opacity-50"
        >
          <Calculator className="h-4 w-4" />
          {calculating ? 'Calculating...' : 'Calculate Overdue Fines'}
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-3 sm:gap-5 grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Fines"
          value={`₹${summary.total.toFixed(2)}`}
          icon={Receipt}
          color="emerald"
        />
        <StatsCard
          title="Collected"
          value={`₹${summary.collected.toFixed(2)}`}
          icon={RupeeSign}
          color="teal"
        />
        <StatsCard
          title="Pending"
          value={`₹${summary.pending.toFixed(2)}`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatsCard
          title="Waived"
          value={`₹${summary.waived.toFixed(2)}`}
          icon={Ban}
          color="rose"
        />
      </div>

      {/* Search/Filter - Glass Card */}
      <div className="rounded-2xl sm:rounded-3xl  backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 ">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <input
              placeholder="Search by student name or book title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] pl-10 pr-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl h-11 sm:h-12 bg-[#F9FAFB] border border-[#E5E7EB]">
              <Filter className="h-4 w-4 mr-2 text-[#6B7280]" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fines Table / Cards */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading fines..." />
        ) : filteredFines.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Receipt}
              title="No fines found"
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No overdue fines have been recorded yet.'
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile: Card Layout */}
            <div className="sm:hidden p-3 space-y-3 max-h-[70vh] overflow-y-auto">
              {filteredFines.map((fine) => (
                <div
                  key={fine._id}
                  className="rounded-xl border border-[#E5E7EB] p-3 bg-white transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-[#1F2937] truncate">
                        {fine.userId?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-[#6B7280] truncate">
                        {fine.bookId?.title || 'Unknown Book'}
                      </p>
                    </div>
                    {getStatusBadge(fine.status)}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1F2937]">
                      ₹{fine.amount?.toFixed(2)}
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      {fine.daysOverdue}d overdue
                    </span>
                  </div>
                  {fine.status === 'pending' && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-xs font-medium bg-[#7CCB7A] text-white hover:opacity-90 transition-all duration-200"
                        onClick={() =>
                          setActionDialog({
                            open: true,
                            type: 'pay',
                            fine,
                          })
                        }
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Paid
                      </button>
                      <button
                        className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-xs font-medium bg-[#F3C47A] text-[#1F2937] hover:opacity-90 transition-all duration-200"
                        onClick={() =>
                          setActionDialog({
                            open: true,
                            type: 'waive',
                            fine,
                          })
                        }
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Waive
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden sm:block overflow-x-auto table-responsive">
              <Table className="min-w-[600px] sm:min-w-0">
                <TableHeader>
                  <TableRow className="bg-[#F4F8F9] hover:bg-[#F4F8F9]">
                    <TableHead className="text-[#6B7280] font-semibold">Student</TableHead>
                    <TableHead className="text-[#6B7280] font-semibold">Book</TableHead>
                    <TableHead className="text-center text-[#6B7280] font-semibold">Amount</TableHead>
                    <TableHead className="text-center hidden sm:table-cell text-[#6B7280] font-semibold">
                      Days Overdue
                    </TableHead>
                    <TableHead className="text-[#6B7280] font-semibold">Status</TableHead>
                    <TableHead className="hidden md:table-cell text-[#6B7280] font-semibold">Date</TableHead>
                    <TableHead className="text-right text-[#6B7280] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((fine) => (
                    <TableRow key={fine._id} className="hover:bg-[#F4F8F9] transition-colors border-[#E5E7EB]">
                      <TableCell>
                        <p className="font-medium text-sm text-[#1F2937]">
                          {fine.userId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {fine.userId?.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-[#1F2937] truncate max-w-[150px]">
                          {fine.bookId?.title || 'Unknown Book'}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-[#1F2937]">
                          ₹{fine.amount?.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs border-[#E5E7EB] text-[#6B7280]">
                          {fine.daysOverdue}d
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(fine.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[#6B7280]">
                        {formatDate(fine.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fine.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium bg-[#7CCB7A] text-white hover:opacity-90 transition-all duration-200"
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  type: 'pay',
                                  fine,
                                })
                              }
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Paid
                            </button>
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium bg-[#F3C47A] text-[#1F2937] hover:opacity-90 transition-all duration-200"
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  type: 'waive',
                                  fine,
                                })
                              }
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Waive
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6B7280]">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E5E7EB] px-3 sm:px-4 py-3 gap-2">
                <p className="text-sm text-[#6B7280]">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1 h-9 px-4 rounded-xl sm:rounded-2xl text-sm font-medium border border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    className="inline-flex items-center gap-1 h-9 px-4 rounded-xl sm:rounded-2xl text-sm font-medium border border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: '', fine: null })
        }
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937]">
              {actionDialog.type === 'pay'
                ? 'Mark Fine as Paid'
                : 'Waive Fine'}
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              {actionDialog.type === 'pay'
                ? `Are you sure you want to mark the fine of ₹${actionDialog.fine?.amount?.toFixed(2)} for "${actionDialog.fine?.bookId?.title}" (borrowed by ${actionDialog.fine?.userId?.name}) as paid?`
                : `Are you sure you want to waive the fine of ₹${actionDialog.fine?.amount?.toFixed(2)} for "${actionDialog.fine?.bookId?.title}" (borrowed by ${actionDialog.fine?.userId?.name})? The student will no longer be required to pay this fine.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button
              className="inline-flex items-center justify-center h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 w-full sm:w-auto"
              onClick={() =>
                setActionDialog({ open: false, type: '', fine: null })
              }
            >
              Cancel
            </button>
            {actionDialog.type === 'pay' ? (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#7CCB7A] text-white hover:opacity-90 transition-all duration-200 w-full sm:w-auto"
                onClick={() => handleMarkPaid(actionDialog.fine?._id)}
                disabled={processing}
              >
                <CheckCircle className="h-4 w-4" />
                {processing ? 'Processing...' : 'Mark as Paid'}
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#F3C47A] text-[#1F2937] hover:opacity-90 transition-all duration-200 w-full sm:w-auto"
                onClick={() => handleWaiveFine(actionDialog.fine?._id)}
                disabled={processing}
              >
                <Ban className="h-4 w-4" />
                {processing ? 'Processing...' : 'Waive Fine'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  DollarSign,
  Search,
  CheckCircle,
  Ban,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

      const [finesRes, paidRes, pendingRes, waivedRes] = await Promise.all([
        apiFetch(`/fines?${params.toString()}`),
        apiFetch('/fines?status=paid&limit=1').catch(() => ({
          data: { pagination: { total: 0 }, items: [] },
        })),
        apiFetch('/fines?status=pending&limit=1').catch(() => ({
          data: { pagination: { total: 0 }, items: [] },
        })),
        apiFetch('/fines?status=waived&limit=1').catch(() => ({
          data: { pagination: { total: 0 }, items: [] },
        })),
      ]);

      setFines(finesRes.data?.items || []);
      setPagination(
        finesRes.data?.pagination || { page: 1, pages: 1, total: 0 }
      );

      // We need actual totals for amounts. Let's fetch all fines for summary
      const [allPaidRes, allPendingRes, allWaivedRes, allRes] =
        await Promise.all([
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
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            Pending
          </Badge>
        );
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Paid
          </Badge>
        );
      case 'waived':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fine Management</h1>
          <p className="text-muted-foreground">
            Track and manage overdue fines.
          </p>
        </div>
        <Button
          onClick={handleCalculateOverdue}
          disabled={calculating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {calculating ? 'Calculating...' : 'Calculate Overdue Fines'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Fines"
          value={`$${summary.total.toFixed(2)}`}
          icon={Receipt}
          color="emerald"
        />
        <StatsCard
          title="Collected"
          value={`$${summary.collected.toFixed(2)}`}
          icon={DollarSign}
          color="teal"
        />
        <StatsCard
          title="Pending"
          value={`$${summary.pending.toFixed(2)}`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatsCard
          title="Waived"
          value={`$${summary.waived.toFixed(2)}`}
          icon={Ban}
          color="rose"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or book title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
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
        </CardContent>
      </Card>

      {/* Fines Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner message="Loading fines..." />
          ) : filteredFines.length === 0 ? (
            <div className="p-6">
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead className="text-center">Amount</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">
                        Days Overdue
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFines.map((fine) => (
                      <TableRow key={fine._id}>
                        <TableCell>
                          <p className="font-medium text-sm">
                            {fine.userId?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fine.userId?.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[150px]">
                            {fine.bookId?.title || 'Unknown Book'}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-semibold">
                            ${fine.amount?.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {fine.daysOverdue}d
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(fine.status)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(fine.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {fine.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'pay',
                                    fine,
                                  })
                                }
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Paid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-200 text-gray-600 hover:bg-gray-50 h-8"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'waive',
                                    fine,
                                  })
                                }
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Waive
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
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
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: '', fine: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'pay'
                ? 'Mark Fine as Paid'
                : 'Waive Fine'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'pay'
                ? `Are you sure you want to mark the fine of $${actionDialog.fine?.amount?.toFixed(2)} for "${actionDialog.fine?.bookId?.title}" (borrowed by ${actionDialog.fine?.userId?.name}) as paid?`
                : `Are you sure you want to waive the fine of $${actionDialog.fine?.amount?.toFixed(2)} for "${actionDialog.fine?.bookId?.title}" (borrowed by ${actionDialog.fine?.userId?.name})? The student will no longer be required to pay this fine.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, type: '', fine: null })
              }
            >
              Cancel
            </Button>
            {actionDialog.type === 'pay' ? (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleMarkPaid(actionDialog.fine?._id)}
                disabled={processing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {processing ? 'Processing...' : 'Mark as Paid'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => handleWaiveFine(actionDialog.fine?._id)}
                disabled={processing}
              >
                <Ban className="h-4 w-4 mr-2" />
                {processing ? 'Processing...' : 'Waive Fine'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

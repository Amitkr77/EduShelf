'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart3,
  BookOpen,
  AlertTriangle,
  DollarSign,
  Activity,
  Calendar,
  Printer,
  TrendingUp,
  Users,
  Receipt,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function SimpleBarChart({ data, valueKey, labelKey, maxValue, color = 'bg-[#7C9AA5]' }) {
  if (!data || data.length === 0) return null;
  const max = maxValue || Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-[#6B7280] w-20 text-right shrink-0">
            {item[labelKey]}
          </span>
          <div className="flex-1 bg-[#F4F8F9] rounded-full h-6 overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
              style={{
                width: `${Math.max(((item[valueKey] || 0) / max) * 100, 2)}%`,
              }}
            >
              <span className="text-xs font-medium text-white">
                {item[valueKey]}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('borrow');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const initialFetchDone = useRef(false);

  // Borrow report data
  const [borrowReport, setBorrowReport] = useState(null);
  // Overdue report data
  const [overdueReport, setOverdueReport] = useState(null);
  // Financial report data
  const [financialReport, setFinancialReport] = useState(null);
  // Activity log data
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityPagination, setActivityPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  async function fetchAllData() {
    setLoading(true);
    try {
      const borrowParams = new URLSearchParams();
      const financialParams = new URLSearchParams();
      const activityParams = new URLSearchParams({ page: '1', limit: '15' });

      if (dateRange.startDate) {
        borrowParams.set('startDate', dateRange.startDate);
        financialParams.set('startDate', dateRange.startDate);
        activityParams.set('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        borrowParams.set('endDate', dateRange.endDate);
        financialParams.set('endDate', dateRange.endDate);
        activityParams.set('endDate', dateRange.endDate);
      }

      const [borrowRes, overdueRes, financialRes, activityRes] =
        await Promise.all([
          apiFetch(`/reports/borrow?${borrowParams.toString()}`),
          apiFetch('/reports/overdue?limit=20'),
          apiFetch(`/reports/financial?${financialParams.toString()}`),
          apiFetch(`/reports/activity?${activityParams.toString()}`),
        ]);

      setBorrowReport(borrowRes.data);
      setOverdueReport(overdueRes.data);
      setFinancialReport(financialRes.data);
      setActivityLogs(activityRes.data?.items || []);
      setActivityPagination(
        activityRes.data?.pagination || { page: 1, pages: 1, total: 0 }
      );
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchAllData();
    }
  }, []);

  async function fetchActivityLogs(page = 1) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (dateRange.startDate) params.set('startDate', dateRange.startDate);
      if (dateRange.endDate) params.set('endDate', dateRange.endDate);
      const res = await apiFetch(`/reports/activity?${params.toString()}`);
      setActivityLogs(res.data?.items || []);
      setActivityPagination(
        res.data?.pagination || { page: 1, pages: 1, total: 0 }
      );
    } catch (error) {
      toast.error('Failed to load activity logs');
    }
  }

  function handleApplyDateFilter() {
    fetchAllData();
  }

  function handleClearDateFilter() {
    setDateRange({ startDate: '', endDate: '' });
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getActionBadge(action) {
    const actionMap = {
      borrow_request: { label: 'Request', color: 'bg-[#FEF3E2] text-[#C4952A]' },
      borrow_issue: { label: 'Issued', color: 'bg-[#E3F2FA] text-[#4A8DB7]' },
      borrow_return: { label: 'Returned', color: 'bg-[#E8F0EC] text-[#6B8F83]' },
      fine_create: { label: 'Fine', color: 'bg-[#FDE8E6] text-[#C25B4F]' },
      fine_pay: { label: 'Paid', color: 'bg-[#E8F0EC] text-[#6B8F83]' },
      fine_waive: { label: 'Waived', color: 'bg-[#F9FAFB] text-[#6B7280]' },
      reservation_create: {
        label: 'Reserved',
        color: 'bg-[#E3F2FA] text-[#4A8DB7]',
      },
    };
    const info = actionMap[action] || { label: action, color: 'bg-[#F9FAFB] text-[#6B7280]' };
    return (
      <Badge className={`${info.color} hover:${info.color} border-0`}>{info.label}</Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Reports</h1>
          <p className="text-[#6B7280] mt-1">
            Library analytics and activity reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 h-10 px-5 rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480]"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Date Range Filter - Glass Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-medium text-[#6B7280]">Start Date</Label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] px-4 text-sm text-[#1F2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-medium text-[#6B7280]">End Date</Label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] px-4 text-sm text-[#1F2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyDateFilter}
              className="inline-flex items-center gap-2 h-12 px-5 rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480]"
            >
              <Calendar className="h-4 w-4" />
              Apply
            </button>
            <button
              onClick={handleClearDateFilter}
              className="inline-flex items-center justify-center h-12 px-5 rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-1">
          <TabsTrigger
            value="borrow"
            className="gap-1.5 rounded-xl data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium text-[#6B7280] transition-all"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Borrow</span>
          </TabsTrigger>
          <TabsTrigger
            value="overdue"
            className="gap-1.5 rounded-xl data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium text-[#6B7280] transition-all"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Overdue</span>
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="gap-1.5 rounded-xl data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium text-[#6B7280] transition-all"
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financial</span>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="gap-1.5 rounded-xl data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium text-[#6B7280] transition-all"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* Borrow Reports Tab */}
        <TabsContent value="borrow" className="space-y-6">
          {loading ? (
            <LoadingSpinner message="Loading borrow report..." />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Borrows"
                  value={borrowReport?.summary?.totalBorrows || 0}
                  icon={BookOpen}
                  color="emerald"
                />
                <StatsCard
                  title="Active Borrows"
                  value={borrowReport?.summary?.activeBorrows || 0}
                  icon={TrendingUp}
                  color="teal"
                />
                <StatsCard
                  title="Overdue Borrows"
                  value={borrowReport?.summary?.overdueBorrows || 0}
                  icon={AlertTriangle}
                  color="rose"
                />
                <StatsCard
                  title="Returned"
                  value={borrowReport?.summary?.statusBreakdown?.returned || 0}
                  icon={Activity}
                  color="amber"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Borrow Chart - Glass Card */}
                <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Borrows by Month</h2>
                  </div>
                  <div className="px-6 pb-6">
                    {borrowReport?.borrowsByMonth?.length > 0 ? (
                      <SimpleBarChart
                        data={borrowReport.borrowsByMonth.slice(-12)}
                        valueKey="count"
                        labelKey="period"
                        color="bg-[#7C9AA5]"
                      />
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="No data available"
                        description="Borrow data will appear here as books are borrowed."
                      />
                    )}
                  </div>
                </div>

                {/* Popular Books - Glass Card */}
                <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Most Popular Books</h2>
                  </div>
                  <div className="px-6 pb-6">
                    {borrowReport?.popularBooks?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[#F4F8F9] hover:bg-[#F4F8F9]">
                              <TableHead className="text-[#6B7280] font-semibold">#</TableHead>
                              <TableHead className="text-[#6B7280] font-semibold">Title</TableHead>
                              <TableHead className="hidden md:table-cell text-[#6B7280] font-semibold">
                                Author
                              </TableHead>
                              <TableHead className="text-right text-[#6B7280] font-semibold">Borrows</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {borrowReport.popularBooks.map((book, i) => (
                              <TableRow key={book.bookId || i} className="hover:bg-[#F4F8F9] border-[#E5E7EB]">
                                <TableCell className="font-medium text-sm text-[#1F2937]">
                                  {i + 1}
                                </TableCell>
                                <TableCell className="text-sm text-[#1F2937] truncate max-w-[150px]">
                                  {book.title}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-[#6B7280]">
                                  {book.author}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    className="bg-[#E8F0EC] text-[#6B8F83] hover:bg-[#E8F0EC] border-0"
                                  >
                                    {book.borrowCount}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <EmptyState
                        icon={BookOpen}
                        title="No popular books data"
                        description="Popular books will appear as borrowing activity increases."
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Status Breakdown - Glass Card */}
              {borrowReport?.summary?.statusBreakdown && (
                <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Borrow Status Breakdown</h2>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(borrowReport.summary.statusBreakdown).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] px-4 py-2 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                          >
                            <span className="text-sm font-medium capitalize text-[#1F2937]">
                              {status}
                            </span>
                            <Badge className="bg-[#E3F2FA] text-[#4A8DB7] hover:bg-[#E3F2FA] border-0">{count}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Overdue Reports Tab */}
        <TabsContent value="overdue" className="space-y-6">
          {loading ? (
            <LoadingSpinner message="Loading overdue report..." />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Overdue"
                  value={overdueReport?.summary?.totalOverdue || 0}
                  icon={AlertTriangle}
                  color="rose"
                />
                <StatsCard
                  title="Total Fines"
                  value={`$${(overdueReport?.summary?.totalCalculatedFines || 0).toFixed(2)}`}
                  icon={DollarSign}
                  color="amber"
                />
                <StatsCard
                  title="Avg Days Overdue"
                  value={overdueReport?.summary?.averageDaysOverdue || 0}
                  icon={Calendar}
                  color="teal"
                />
                <StatsCard
                  title="Pending Fines"
                  value={`$${(overdueReport?.summary?.pendingFinesAmount || 0).toFixed(2)}`}
                  icon={Receipt}
                  color="emerald"
                />
              </div>

              {/* Overdue Books Table - Glass Card */}
              <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-6 pb-4">
                  <h2 className="text-lg font-semibold text-[#1F2937]">Overdue Books</h2>
                </div>
                {overdueReport?.items?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F4F8F9] hover:bg-[#F4F8F9]">
                          <TableHead className="text-[#6B7280] font-semibold">Student</TableHead>
                          <TableHead className="text-[#6B7280] font-semibold">Book</TableHead>
                          <TableHead className="hidden md:table-cell text-[#6B7280] font-semibold">
                            Due Date
                          </TableHead>
                          <TableHead className="text-center text-[#6B7280] font-semibold">
                            Days Overdue
                          </TableHead>
                          <TableHead className="text-right text-[#6B7280] font-semibold">
                            Fine Amount
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overdueReport.items.map((item) => (
                          <TableRow key={item._id} className="bg-[#FDE8E6]/30 hover:bg-[#F4F8F9] border-[#E5E7EB]">
                            <TableCell>
                              <p className="font-medium text-sm text-[#1F2937]">
                                {item.user?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-[#6B7280]">
                                {item.user?.department}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm text-[#1F2937]">
                              {item.book?.title || 'Unknown'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-[#6B7280]">
                              {formatDate(item.dueDate)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-[#FDE8E6] text-[#C25B4F] hover:bg-[#FDE8E6] border-0">
                                {item.daysOverdue}d
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-[#C25B4F] text-sm">
                              ${item.calculatedFine?.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="px-6 pb-6">
                    <EmptyState
                      icon={AlertTriangle}
                      title="No overdue books"
                      description="All books have been returned on time."
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="space-y-6">
          {loading ? (
            <LoadingSpinner message="Loading financial report..." />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Grand Total"
                  value={`$${(financialReport?.summary?.grandTotal || 0).toFixed(2)}`}
                  icon={DollarSign}
                  color="emerald"
                />
                <StatsCard
                  title="Collected"
                  value={`$${(financialReport?.summary?.totalCollected || 0).toFixed(2)}`}
                  icon={TrendingUp}
                  color="teal"
                />
                <StatsCard
                  title="Pending"
                  value={`$${(financialReport?.summary?.totalPending || 0).toFixed(2)}`}
                  icon={AlertTriangle}
                  color="amber"
                />
                <StatsCard
                  title="Waived"
                  value={`$${(financialReport?.summary?.totalWaived || 0).toFixed(2)}`}
                  icon={Activity}
                  color="rose"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Revenue Chart - Glass Card */}
                <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Monthly Revenue</h2>
                  </div>
                  <div className="px-6 pb-6">
                    {financialReport?.monthlyBreakdown?.length > 0 ? (
                      <SimpleBarChart
                        data={financialReport.monthlyBreakdown.slice(-12)}
                        valueKey="totalAmount"
                        labelKey="period"
                        color="bg-[#7C9AA5]"
                      />
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="No financial data"
                        description="Revenue data will appear as fines are collected."
                      />
                    )}
                  </div>
                </div>

                {/* Monthly Breakdown Table - Glass Card */}
                <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Monthly Breakdown</h2>
                  </div>
                  <div className="px-6 pb-6">
                    {financialReport?.monthlyBreakdown?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[#F4F8F9] hover:bg-[#F4F8F9]">
                              <TableHead className="text-[#6B7280] font-semibold">Month</TableHead>
                              <TableHead className="text-right text-[#6B7280] font-semibold">Total</TableHead>
                              <TableHead className="text-right hidden sm:table-cell text-[#6B7280] font-semibold">
                                Paid
                              </TableHead>
                              <TableHead className="text-right hidden md:table-cell text-[#6B7280] font-semibold">
                                Pending
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {financialReport.monthlyBreakdown
                              .slice(-12)
                              .map((item, i) => (
                                <TableRow key={i} className="hover:bg-[#F4F8F9] border-[#E5E7EB]">
                                  <TableCell className="text-sm font-medium text-[#1F2937]">
                                    {item.period}
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-[#1F2937]">
                                    ${item.totalAmount?.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-[#6B8F83] hidden sm:table-cell">
                                    ${item.paidAmount?.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-[#C4952A] hidden md:table-cell">
                                    ${item.pendingAmount?.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <EmptyState
                        icon={DollarSign}
                        title="No monthly data"
                        description="Financial data will be available as fines are generated."
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-6">
          {loading ? (
            <LoadingSpinner message="Loading activity logs..." />
          ) : (
            <>
              <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Activity Log</h2>
                    <Badge className="bg-[#E3F2FA] text-[#4A8DB7] hover:bg-[#E3F2FA] border-0 rounded-full px-3">
                      {activityPagination.total} entries
                    </Badge>
                  </div>
                </div>
                {activityLogs.length === 0 ? (
                  <div className="px-6 pb-6">
                    <EmptyState
                      icon={Activity}
                      title="No activity logs"
                      description="Activity logs will appear as users interact with the library."
                    />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[#F4F8F9] hover:bg-[#F4F8F9]">
                            <TableHead className="text-[#6B7280] font-semibold">Timestamp</TableHead>
                            <TableHead className="text-[#6B7280] font-semibold">User</TableHead>
                            <TableHead className="text-[#6B7280] font-semibold">Action</TableHead>
                            <TableHead className="hidden md:table-cell text-[#6B7280] font-semibold">
                              Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log._id} className="hover:bg-[#F4F8F9] border-[#E5E7EB]">
                              <TableCell className="text-xs text-[#6B7280] whitespace-nowrap">
                                {formatDateTime(log.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E3F2FA] shrink-0">
                                    <Users className="h-3.5 w-3.5 text-[#4A8DB7]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-[#1F2937]">
                                      {log.userId?.name || 'System'}
                                    </p>
                                    <p className="text-xs text-[#6B7280] hidden lg:block">
                                      {log.userId?.role || ''}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getActionBadge(log.action)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-[#6B7280] max-w-[250px] truncate">
                                {log.details}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {activityPagination.pages > 1 && (
                      <div className="flex items-center justify-between border-t border-[#E5E7EB] px-4 py-3">
                        <p className="text-sm text-[#6B7280]">
                          Page {activityPagination.page} of{' '}
                          {activityPagination.pages}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            className="inline-flex items-center gap-1 h-9 px-4 rounded-2xl text-sm font-medium border border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={activityPagination.page <= 1}
                            onClick={() =>
                              fetchActivityLogs(activityPagination.page - 1)
                            }
                          >
                            Previous
                          </button>
                          <button
                            className="inline-flex items-center gap-1 h-9 px-4 rounded-2xl text-sm font-medium border border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={
                              activityPagination.page >= activityPagination.pages
                            }
                            onClick={() =>
                              fetchActivityLogs(activityPagination.page + 1)
                            }
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

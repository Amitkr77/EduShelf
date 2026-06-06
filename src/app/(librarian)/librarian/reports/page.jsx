'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart3,
  BookOpen,
  AlertTriangle,
  DollarSign,
  Activity,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

function SimpleBarChart({ data, valueKey, labelKey, maxValue, color = 'bg-emerald-500' }) {
  if (!data || data.length === 0) return null;
  const max = maxValue || Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
            {item[labelKey]}
          </span>
          <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
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
      borrow_request: { label: 'Request', color: 'bg-amber-100 text-amber-700' },
      borrow_issue: { label: 'Issued', color: 'bg-blue-100 text-blue-700' },
      borrow_return: { label: 'Returned', color: 'bg-emerald-100 text-emerald-700' },
      fine_create: { label: 'Fine', color: 'bg-rose-100 text-rose-700' },
      fine_pay: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
      fine_waive: { label: 'Waived', color: 'bg-gray-100 text-gray-700' },
      reservation_create: {
        label: 'Reserved',
        color: 'bg-teal-100 text-teal-700',
      },
    };
    const info = actionMap[action] || { label: action, color: 'bg-gray-100 text-gray-700' };
    return (
      <Badge className={`${info.color} hover:${info.color}`}>{info.label}</Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Library analytics and activity reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApplyDateFilter}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Apply
              </Button>
              <Button variant="outline" onClick={handleClearDateFilter}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="borrow" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Borrow</span>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Overdue</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financial</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                {/* Monthly Borrow Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Borrows by Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {borrowReport?.borrowsByMonth?.length > 0 ? (
                      <SimpleBarChart
                        data={borrowReport.borrowsByMonth.slice(-12)}
                        valueKey="count"
                        labelKey="period"
                        color="bg-emerald-500"
                      />
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="No data available"
                        description="Borrow data will appear here as books are borrowed."
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Popular Books */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Most Popular Books</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {borrowReport?.popularBooks?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Title</TableHead>
                              <TableHead className="hidden md:table-cell">
                                Author
                              </TableHead>
                              <TableHead className="text-right">Borrows</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {borrowReport.popularBooks.map((book, i) => (
                              <TableRow key={book.bookId || i}>
                                <TableCell className="font-medium text-sm">
                                  {i + 1}
                                </TableCell>
                                <TableCell className="text-sm truncate max-w-[150px]">
                                  {book.title}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                  {book.author}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant="secondary"
                                    className="bg-emerald-100 text-emerald-700"
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
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              {borrowReport?.summary?.statusBreakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Borrow Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(borrowReport.summary.statusBreakdown).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="flex items-center gap-2 rounded-lg border px-4 py-2"
                          >
                            <span className="text-sm font-medium capitalize">
                              {status}
                            </span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

              {/* Overdue Books Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overdue Books</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {overdueReport?.items?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Book</TableHead>
                            <TableHead className="hidden md:table-cell">
                              Due Date
                            </TableHead>
                            <TableHead className="text-center">
                              Days Overdue
                            </TableHead>
                            <TableHead className="text-right">
                              Fine Amount
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overdueReport.items.map((item) => (
                            <TableRow key={item._id} className="bg-rose-50/30">
                              <TableCell>
                                <p className="font-medium text-sm">
                                  {item.user?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.user?.department}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.book?.title || 'Unknown'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {formatDate(item.dueDate)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="destructive">
                                  {item.daysOverdue}d
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-rose-600 text-sm">
                                ${item.calculatedFine?.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-6">
                      <EmptyState
                        icon={AlertTriangle}
                        title="No overdue books"
                        description="All books have been returned on time."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                {/* Monthly Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financialReport?.monthlyBreakdown?.length > 0 ? (
                      <SimpleBarChart
                        data={financialReport.monthlyBreakdown.slice(-12)}
                        valueKey="totalAmount"
                        labelKey="period"
                        color="bg-teal-500"
                      />
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="No financial data"
                        description="Revenue data will appear as fines are collected."
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Breakdown Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financialReport?.monthlyBreakdown?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-right hidden sm:table-cell">
                                Paid
                              </TableHead>
                              <TableHead className="text-right hidden md:table-cell">
                                Pending
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {financialReport.monthlyBreakdown
                              .slice(-12)
                              .map((item, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-sm font-medium">
                                    {item.period}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    ${item.totalAmount?.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-emerald-600 hidden sm:table-cell">
                                    ${item.paidAmount?.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-amber-600 hidden md:table-cell">
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
                  </CardContent>
                </Card>
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Activity Log</CardTitle>
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                      {activityPagination.total} entries
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {activityLogs.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={Activity}
                        title="No activity logs"
                        description="Activity logs will appear as users interact with the library."
                      />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead className="hidden md:table-cell">
                              Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log._id}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDateTime(log.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 shrink-0">
                                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {log.userId?.name || 'System'}
                                    </p>
                                    <p className="text-xs text-muted-foreground hidden lg:block">
                                      {log.userId?.role || ''}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getActionBadge(log.action)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[250px] truncate">
                                {log.details}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Pagination */}
                  {activityPagination.pages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        Page {activityPagination.page} of{' '}
                        {activityPagination.pages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={activityPagination.page <= 1}
                          onClick={() =>
                            fetchActivityLogs(activityPagination.page - 1)
                          }
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            activityPagination.page >= activityPagination.pages
                          }
                          onClick={() =>
                            fetchActivityLogs(activityPagination.page + 1)
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

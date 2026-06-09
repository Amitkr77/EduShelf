'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

// Chart color palette
const CHART_COLORS = {
  primary: '#7C9AA5',
  green: '#7CCB7A',
  amber: '#F3C47A',
  blue: '#84C7E8',
  sage: '#A7C2B0',
  destructive: '#F28B82',
};

// Chart configs for shadcn ChartContainer
const borrowMonthlyConfig = {
  count: { label: 'Borrows', color: CHART_COLORS.primary },
};

const popularBooksConfig = {
  borrowCount: { label: 'Borrow Count', color: CHART_COLORS.green },
};

const statusBreakdownConfig = {
  issued: { label: 'Issued', color: CHART_COLORS.blue },
  returned: { label: 'Returned', color: CHART_COLORS.green },
  overdue: { label: 'Overdue', color: CHART_COLORS.destructive },
  approved: { label: 'Approved', color: CHART_COLORS.amber },
  requested: { label: 'Requested', color: CHART_COLORS.sage },
  rejected: { label: 'Rejected', color: CHART_COLORS.primary },
};

const overdueTrendConfig = {
  count: { label: 'Overdue Count', color: CHART_COLORS.destructive },
};

const daysDistributionConfig = {
  count: { label: 'Books', color: CHART_COLORS.primary },
};

const revenueConfig = {
  totalAmount: { label: 'Total Revenue', color: CHART_COLORS.primary },
  paidAmount: { label: 'Collected', color: CHART_COLORS.green },
  pendingAmount: { label: 'Pending', color: CHART_COLORS.amber },
};

const paymentStatusConfig = {
  paid: { label: 'Paid', color: CHART_COLORS.green },
  pending: { label: 'Pending', color: CHART_COLORS.amber },
  waived: { label: 'Waived', color: CHART_COLORS.sage },
};

const activityTimelineConfig = {
  count: { label: 'Activities', color: CHART_COLORS.blue },
};

const PIE_COLORS = [
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.destructive,
  CHART_COLORS.amber,
  CHART_COLORS.sage,
  CHART_COLORS.primary,
];

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[11px] font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
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

  // Derived data for charts
  const borrowMonthlyData = useMemo(() => {
    if (!borrowReport?.borrowsByMonth) return [];
    return borrowReport.borrowsByMonth.slice(-12).map((item) => ({
      ...item,
      period: item.period || 'N/A',
      count: item.count || 0,
    }));
  }, [borrowReport]);

  const popularBooksData = useMemo(() => {
    if (!borrowReport?.popularBooks) return [];
    return borrowReport.popularBooks.slice(0, 8).map((book) => ({
      name: book.title?.length > 20 ? book.title.substring(0, 20) + '...' : book.title || 'Unknown',
      borrowCount: book.borrowCount || 0,
    }));
  }, [borrowReport]);

  const statusBreakdownData = useMemo(() => {
    if (!borrowReport?.summary?.statusBreakdown) return [];
    return Object.entries(borrowReport.summary.statusBreakdown).map(
      ([status, count], index) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      })
    );
  }, [borrowReport]);

  const overdueTrendData = useMemo(() => {
    if (!overdueReport?.items || overdueReport.items.length === 0) return [];
    // Group by due date month
    const monthMap = {};
    overdueReport.items.forEach((item) => {
      if (item.dueDate) {
        const date = new Date(item.dueDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = (monthMap[key] || 0) + 1;
      }
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, count]) => ({ period, count }));
  }, [overdueReport]);

  const daysDistributionData = useMemo(() => {
    if (!overdueReport?.items || overdueReport.items.length === 0) return [];
    // Create buckets for days overdue
    const buckets = {
      '1-7': 0,
      '8-14': 0,
      '15-30': 0,
      '31-60': 0,
      '60+': 0,
    };
    overdueReport.items.forEach((item) => {
      const days = item.daysOverdue || 0;
      if (days <= 7) buckets['1-7']++;
      else if (days <= 14) buckets['8-14']++;
      else if (days <= 30) buckets['15-30']++;
      else if (days <= 60) buckets['31-60']++;
      else buckets['60+']++;
    });
    return Object.entries(buckets)
      .filter(([, count]) => count > 0)
      .map(([range, count]) => ({ range, count }));
  }, [overdueReport]);

  const revenueMonthlyData = useMemo(() => {
    if (!financialReport?.monthlyBreakdown) return [];
    return financialReport.monthlyBreakdown.slice(-12).map((item) => ({
      ...item,
      period: item.period || 'N/A',
      totalAmount: Number((item.totalAmount || 0).toFixed(2)),
      paidAmount: Number((item.paidAmount || 0).toFixed(2)),
      pendingAmount: Number((item.pendingAmount || 0).toFixed(2)),
    }));
  }, [financialReport]);

  const paymentStatusData = useMemo(() => {
    if (!financialReport?.summary) return [];
    const data = [];
    const s = financialReport.summary;
    if (s.totalCollected > 0) {
      data.push({ name: 'Paid', value: Number(s.totalCollected.toFixed(2)), fill: CHART_COLORS.green });
    }
    if (s.totalPending > 0) {
      data.push({ name: 'Pending', value: Number(s.totalPending.toFixed(2)), fill: CHART_COLORS.amber });
    }
    if (s.totalWaived > 0) {
      data.push({ name: 'Waived', value: Number(s.totalWaived.toFixed(2)), fill: CHART_COLORS.sage });
    }
    return data;
  }, [financialReport]);

  const activityTimelineData = useMemo(() => {
    if (!activityLogs || activityLogs.length === 0) return [];
    // Group by day
    const dayMap = {};
    activityLogs.forEach((log) => {
      if (log.createdAt) {
        const date = new Date(log.createdAt);
        const key = `${date.getMonth() + 1}/${date.getDate()}`;
        dayMap[key] = (dayMap[key] || 0) + 1;
      }
    });
    return Object.entries(dayMap)
      .slice(-14)
      .map(([day, count]) => ({ day, count }));
  }, [activityLogs]);

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* <div>
          <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Reports</h1>
          <p className="text-[#6B7280] mt-1">
            Library analytics and activity reports.
          </p>
        </div> */}
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
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4">
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

        {/* ============================================= */}
        {/* Borrow Reports Tab */}
        {/* ============================================= */}
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
                {/* Monthly Borrow Chart - AreaChart */}
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Borrows by Month</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Monthly borrowing trends</p>
                  </div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {borrowMonthlyData.length > 0 ? (
                      <ChartContainer config={borrowMonthlyConfig} className="h-[200px] sm:h-[280px] w-full">
                        <AreaChart data={borrowMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="borrowGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={(v) => {
                              const parts = v.split('-');
                              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                              return months[parseInt(parts[1]) - 1] + " '" + parts[0].slice(2);
                            }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            allowDecimals={false}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke={CHART_COLORS.primary}
                            strokeWidth={2.5}
                            fill="url(#borrowGradient)"
                            dot={{ r: 3, fill: CHART_COLORS.primary, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ChartContainer>
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="No data available"
                        description="Borrow data will appear here as books are borrowed."
                      />
                    )}
                  </div>
                </div>

                {/* Popular Books - Horizontal BarChart + Table */}
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Most Popular Books</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Top borrowed books</p>
                  </div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {borrowReport?.popularBooks?.length > 0 ? (
                      <>
                        {/* Horizontal Bar Chart */}
                        {popularBooksData.length > 0 && (
                          <div className="mb-4">
                            <ChartContainer config={popularBooksConfig} className="h-[180px] sm:h-[220px] w-full">
                              <BarChart
                                data={popularBooksData}
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                                <XAxis
                                  type="number"
                                  tickLine={false}
                                  axisLine={false}
                                  tick={{ fontSize: 11, fill: '#6B7280' }}
                                  allowDecimals={false}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  tickLine={false}
                                  axisLine={false}
                                  tick={{ fontSize: 10, fill: '#6B7280' }}
                                  width={90}
                                />
                                <ChartTooltip
                                  content={<ChartTooltipContent />}
                                />
                                <Bar
                                  dataKey="borrowCount"
                                  fill={CHART_COLORS.green}
                                  radius={[0, 6, 6, 0]}
                                  barSize={16}
                                />
                              </BarChart>
                            </ChartContainer>
                          </div>
                        )}
                        {/* Table */}
                        <div className="overflow-x-auto table-responsive">
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
                      </>
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

              {/* Status Breakdown - DonutChart */}
              {borrowReport?.summary?.statusBreakdown && (
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Borrow Status Breakdown</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Distribution of borrow statuses</p>
                  </div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {statusBreakdownData.length > 0 ? (
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-full sm:w-1/2">
                          <ChartContainer config={statusBreakdownConfig} className="h-[200px] sm:h-[260px] w-full">
                            <PieChart>
                              <ChartTooltip
                                content={<ChartTooltipContent nameKey="name" hideLabel />}
                              />
                              <Pie
                                data={statusBreakdownData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                                labelLine={false}
                                label={CustomPieLabel}
                                strokeWidth={0}
                              >
                                {statusBreakdownData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                        </div>
                        <div className="w-full sm:w-1/2 space-y-3">
                          {statusBreakdownData.map((item, index) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-2.5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{ backgroundColor: item.fill }}
                                />
                                <span className="text-sm font-medium text-[#1F2937]">
                                  {item.name}
                                </span>
                              </div>
                              <Badge className="bg-[#F4F8F9] text-[#1F2937] hover:bg-[#F4F8F9] border-0 font-semibold">
                                {item.value}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ============================================= */}
        {/* Overdue Reports Tab */}
        {/* ============================================= */}
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
                  value={`₹${(overdueReport?.summary?.totalCalculatedFines || 0).toFixed(2)}`}
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
                  value={`₹${(overdueReport?.summary?.pendingFinesAmount || 0).toFixed(2)}`}
                  icon={Receipt}
                  color="emerald"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Overdue Trend - LineChart */}
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Overdue Trend</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Overdue count by due date month</p>
                  </div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {overdueTrendData.length > 0 ? (
                      <ChartContainer config={overdueTrendConfig} className="h-[200px] sm:h-[280px] w-full">
                        <LineChart data={overdueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={(v) => {
                              const parts = v.split('-');
                              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                              return months[parseInt(parts[1]) - 1] + " '" + parts[0].slice(2);
                            }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            allowDecimals={false}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke={CHART_COLORS.destructive}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: CHART_COLORS.destructive, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: CHART_COLORS.destructive, stroke: '#fff', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <EmptyState
                        icon={TrendingUp}
                        title="No overdue trend data"
                        description="Overdue trend data will appear when there are overdue books."
                      />
                    )}
                  </div>
                </div>

                {/* Days Overdue Distribution - BarChart */}
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Days Overdue Distribution</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">How long books are overdue</p>
                  </div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {daysDistributionData.length > 0 ? (
                      <ChartContainer config={daysDistributionConfig} className="h-[200px] sm:h-[280px] w-full">
                        <BarChart data={daysDistributionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis
                            dataKey="range"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={(v) => v + ' days'}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            allowDecimals={false}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                          />
                          <Bar
                            dataKey="count"
                            fill={CHART_COLORS.primary}
                            radius={[6, 6, 0, 0]}
                            barSize={40}
                          />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="No distribution data"
                        description="Days overdue distribution will appear when there are overdue books."
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Overdue Books Table */}
              <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <h2 className="text-lg font-semibold text-[#1F2937]">Overdue Books</h2>
                </div>
                {overdueReport?.items?.length > 0 ? (
                  <div className="overflow-x-auto table-responsive">
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

        {/* ============================================= */}
        {/* Financial Reports Tab */}
        {/* ============================================= */}
        <TabsContent value="financial" className="space-y-6">
          {loading ? (
            <LoadingSpinner message="Loading financial report..." />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Grand Total"
                  value={`₹${(financialReport?.summary?.grandTotal || 0).toFixed(2)}`}
                  icon={DollarSign}
                  color="emerald"
                />
                <StatsCard
                  title="Collected"
                  value={`₹${(financialReport?.summary?.totalCollected || 0).toFixed(2)}`}
                  icon={TrendingUp}
                  color="teal"
                />
                <StatsCard
                  title="Pending"
                  value={`₹${(financialReport?.summary?.totalPending || 0).toFixed(2)}`}
                  icon={AlertTriangle}
                  color="amber"
                />
                <StatsCard
                  title="Waived"
                  value={`₹${(financialReport?.summary?.totalWaived || 0).toFixed(2)}`}
                  icon={Activity}
                  color="rose"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Revenue - AreaChart with gradient */}
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Monthly Revenue</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Revenue breakdown by month</p>
                  </div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {revenueMonthlyData.length > 0 ? (
                      <ChartContainer config={revenueConfig} className="h-[200px] sm:h-[280px] w-full">
                        <AreaChart data={revenueMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revenueGradientTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="revenueGradientPaid" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={(v) => {
                              const parts = v.split('-');
                              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                              return months[parseInt(parts[1]) - 1] + " '" + parts[0].slice(2);
                            }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={(v) => '$' + v}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area
                            type="monotone"
                            dataKey="totalAmount"
                            stroke={CHART_COLORS.primary}
                            strokeWidth={2}
                            fill="url(#revenueGradientTotal)"
                            dot={{ r: 3, fill: CHART_COLORS.primary, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="paidAmount"
                            stroke={CHART_COLORS.green}
                            strokeWidth={2}
                            fill="url(#revenueGradientPaid)"
                            dot={{ r: 3, fill: CHART_COLORS.green, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: CHART_COLORS.green, stroke: '#fff', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ChartContainer>
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="No financial data"
                        description="Revenue data will appear as fines are collected."
                      />
                    )}
                  </div>
                </div>

                {/* Payment Status Breakdown - DonutChart */}
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Payment Status Breakdown</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Fine payment distribution</p>
                  </div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {paymentStatusData.length > 0 ? (
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-full sm:w-1/2">
                          <ChartContainer config={paymentStatusConfig} className="h-[200px] sm:h-[260px] w-full">
                            <PieChart>
                              <ChartTooltip
                                content={<ChartTooltipContent nameKey="name" hideLabel formatter={(value) => `$${Number(value).toFixed(2)}`} />}
                              />
                              <Pie
                                data={paymentStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                                labelLine={false}
                                label={CustomPieLabel}
                                strokeWidth={0}
                              >
                                {paymentStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                        </div>
                        <div className="w-full sm:w-1/2 space-y-3">
                          {paymentStatusData.map((item, index) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-2.5 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{ backgroundColor: item.fill }}
                                />
                                <span className="text-sm font-medium text-[#1F2937]">
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-[#1F2937]">
                                ₹{item.value.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon={DollarSign}
                        title="No payment data"
                        description="Payment status data will appear as fines are generated."
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <h2 className="text-lg font-semibold text-[#1F2937]">Monthly Breakdown</h2>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  {financialReport?.monthlyBreakdown?.length > 0 ? (
                    <div className="overflow-x-auto table-responsive">
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
                                  ₹{item.totalAmount?.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-sm text-[#6B8F83] hidden sm:table-cell">
                                  ₹{item.paidAmount?.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-sm text-[#C4952A] hidden md:table-cell">
                                  ₹{item.pendingAmount?.toFixed(2)}
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
            </>
          )}
        </TabsContent>

        {/* ============================================= */}
        {/* Activity Logs Tab */}
        {/* ============================================= */}
        <TabsContent value="activity" className="space-y-6">
          {loading ? (
            <LoadingSpinner message="Loading activity logs..." />
          ) : (
            <>
              {/* Activity Timeline Mini Chart */}
              {activityTimelineData.length > 0 && (
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937]">Activity Timeline</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Daily activity counts</p>
                  </div>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <ChartContainer config={activityTimelineConfig} className="h-[160px] sm:h-[220px] w-full">
                      <BarChart data={activityTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          allowDecimals={false}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                        />
                        <Bar
                          dataKey="count"
                          fill={CHART_COLORS.blue}
                          radius={[4, 4, 0, 0]}
                          barSize={24}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              )}

              {/* Activity Log Table */}
              <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-4 sm:p-6 pb-2 sm:pb-4">
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
                    <div className="overflow-x-auto table-responsive">
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

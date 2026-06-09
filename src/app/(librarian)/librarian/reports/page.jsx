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

const CHART_COLORS = {
  primary: '#64748b',
  green: '#22c55e',
  amber: '#f59e0b',
  blue: '#3b82f6',
  sage: '#94a3b8',
  destructive: '#ef4444',
};

const PIE_COLORS = [
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.destructive,
  CHART_COLORS.amber,
  CHART_COLORS.sage,
  CHART_COLORS.primary,
];

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

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text
      x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      className="text-[11px] font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-neutral-200/80 bg-white overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }) {
  return (
    <div className="px-5 pt-5 pb-0">
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartWrapper({ children, className = '' }) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>;
}

const MONTH_FMT = (v) => {
  const parts = v.split('-');
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m[parseInt(parts[1]) - 1] + " '" + parts[0].slice(2);
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('borrow');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const initialFetchDone = useRef(false);

  const [borrowReport, setBorrowReport] = useState(null);
  const [overdueReport, setOverdueReport] = useState(null);
  const [financialReport, setFinancialReport] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityPagination, setActivityPagination] = useState({ page: 1, pages: 1, total: 0 });

  async function fetchAllData() {
    setLoading(true);
    try {
      const bp = new URLSearchParams();
      const fp = new URLSearchParams();
      const ap = new URLSearchParams({ page: '1', limit: '15' });
      if (dateRange.startDate) { bp.set('startDate', dateRange.startDate); fp.set('startDate', dateRange.startDate); ap.set('startDate', dateRange.startDate); }
      if (dateRange.endDate) { bp.set('endDate', dateRange.endDate); fp.set('endDate', dateRange.endDate); ap.set('endDate', dateRange.endDate); }

      const [borrowRes, overdueRes, financialRes, activityRes] = await Promise.all([
        apiFetch(`/reports/borrow?${bp.toString()}`),
        apiFetch('/reports/overdue?limit=20'),
        apiFetch(`/reports/financial?${fp.toString()}`),
        apiFetch(`/reports/activity?${ap.toString()}`),
      ]);

      setBorrowReport(borrowRes.data);
      setOverdueReport(overdueRes.data);
      setFinancialReport(financialRes.data);
      setActivityLogs(activityRes.data?.items || []);
      setActivityPagination(activityRes.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialFetchDone.current) { initialFetchDone.current = true; fetchAllData(); }
  }, []);

  async function fetchActivityLogs(page = 1) {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (dateRange.startDate) params.set('startDate', dateRange.startDate);
      if (dateRange.endDate) params.set('endDate', dateRange.endDate);
      const res = await apiFetch(`/reports/activity?${params.toString()}`);
      setActivityLogs(res.data?.items || []);
      setActivityPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error('Failed to load activity logs');
    }
  }

  function handleApplyDateFilter() { fetchAllData(); }
  function handleClearDateFilter() { setDateRange({ startDate: '', endDate: '' }); }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function getActionBadge(action) {
    const map = {
      borrow_request: { label: 'Request', cls: 'bg-blue-50 text-blue-600' },
      borrow_issue: { label: 'Issued', cls: 'bg-sky-50 text-sky-600' },
      borrow_return: { label: 'Returned', cls: 'bg-emerald-50 text-emerald-600' },
      fine_create: { label: 'Fine', cls: 'bg-red-50 text-red-600' },
      fine_pay: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-600' },
      fine_waive: { label: 'Waived', cls: 'bg-neutral-100 text-neutral-500' },
      reservation_create: { label: 'Reserved', cls: 'bg-sky-50 text-sky-600' },
    };
    const info = map[action] || { label: action, cls: 'bg-neutral-100 text-neutral-500' };
    return <Badge variant="secondary" className={`${info.cls} hover:${info.cls} border-0 rounded-md`}>{info.label}</Badge>;
  }

  const borrowMonthlyData = useMemo(() => {
    if (!borrowReport?.borrowsByMonth) return [];
    return borrowReport.borrowsByMonth.slice(-12).map((i) => ({ ...i, period: i.period || 'N/A', count: i.count || 0 }));
  }, [borrowReport]);

  const popularBooksData = useMemo(() => {
    if (!borrowReport?.popularBooks) return [];
    return borrowReport.popularBooks.slice(0, 8).map((b) => ({
      name: b.title?.length > 20 ? b.title.substring(0, 20) + '…' : b.title || 'Unknown',
      borrowCount: b.borrowCount || 0,
    }));
  }, [borrowReport]);

  const statusBreakdownData = useMemo(() => {
    if (!borrowReport?.summary?.statusBreakdown) return [];
    return Object.entries(borrowReport.summary.statusBreakdown).map(([s, c], i) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1), value: c, fill: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [borrowReport]);

  const overdueTrendData = useMemo(() => {
    if (!overdueReport?.items?.length) return [];
    const m = {};
    overdueReport.items.forEach((i) => {
      if (i.dueDate) {
        const d = new Date(i.dueDate);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        m[k] = (m[k] || 0) + 1;
      }
    });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([period, count]) => ({ period, count }));
  }, [overdueReport]);

  const daysDistributionData = useMemo(() => {
    if (!overdueReport?.items?.length) return [];
    const b = { '1–7': 0, '8–14': 0, '15–30': 0, '31–60': 0, '60+': 0 };
    overdueReport.items.forEach((i) => {
      const d = i.daysOverdue || 0;
      if (d <= 7) b['1–7']++; else if (d <= 14) b['8–14']++; else if (d <= 30) b['15–30']++; else if (d <= 60) b['31–60']++; else b['60+']++;
    });
    return Object.entries(b).filter(([, c]) => c > 0).map(([range, count]) => ({ range, count }));
  }, [overdueReport]);

  const revenueMonthlyData = useMemo(() => {
    if (!financialReport?.monthlyBreakdown) return [];
    return financialReport.monthlyBreakdown.slice(-12).map((i) => ({
      ...i, period: i.period || 'N/A',
      totalAmount: Number((i.totalAmount || 0).toFixed(2)),
      paidAmount: Number((i.paidAmount || 0).toFixed(2)),
      pendingAmount: Number((i.pendingAmount || 0).toFixed(2)),
    }));
  }, [financialReport]);

  const paymentStatusData = useMemo(() => {
    if (!financialReport?.summary) return [];
    const d = [], s = financialReport.summary;
    if (s.totalCollected > 0) d.push({ name: 'Paid', value: Number(s.totalCollected.toFixed(2)), fill: CHART_COLORS.green });
    if (s.totalPending > 0) d.push({ name: 'Pending', value: Number(s.totalPending.toFixed(2)), fill: CHART_COLORS.amber });
    if (s.totalWaived > 0) d.push({ name: 'Waived', value: Number(s.totalWaived.toFixed(2)), fill: CHART_COLORS.sage });
    return d;
  }, [financialReport]);

  const activityTimelineData = useMemo(() => {
    if (!activityLogs?.length) return [];
    const m = {};
    activityLogs.forEach((l) => {
      if (l.createdAt) {
        const d = new Date(l.createdAt);
        const k = `${d.getMonth() + 1}/${d.getDate()}`;
        m[k] = (m[k] || 0) + 1;
      }
    });
    return Object.entries(m).slice(-14).map(([day, count]) => ({ day, count }));
  }, [activityLogs]);

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500 pb-30">
      {/* Header */}
      <div className="flex justify-end">
        {/* <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Reports</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Library analytics and activity</p>
        </div> */}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium border border-neutral-200 text-white hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          
        </button>
      </div>

      {/* Date Filter */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 space-y-1.5 w-full">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">From</Label>
            <input
              type="date" value={dateRange.startDate}
              onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))}
              className="w-full h-10 rounded-lg bg-neutral-50 border border-neutral-200 px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-300 transition-shadow"
            />
          </div>
          <div className="flex-1 space-y-1.5 w-full">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">To</Label>
            <input
              type="date" value={dateRange.endDate}
              onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))}
              className="w-full h-10 rounded-lg bg-neutral-50 border border-neutral-200 px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-300 transition-shadow"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
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
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-neutral-100 rounded-xl p-1 h-auto ">
          {[
            { value: 'borrow', icon: BookOpen, label: 'Borrow' },
            { value: 'overdue', icon: AlertTriangle, label: 'Overdue' },
            { value: 'financial', icon: DollarSign, label: 'Financial' },
            { value: 'activity', icon: Activity, label: 'Activity' },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-500 transition-all"
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Borrow ── */}
        <TabsContent value="borrow" className="space-y-5">
          {loading ? (
            <LoadingSpinner message="Loading borrow report..." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Borrows" value={borrowReport?.summary?.totalBorrows || 0} icon={BookOpen} color="emerald" />
                <StatsCard title="Active" value={borrowReport?.summary?.activeBorrows || 0} icon={TrendingUp} color="teal" />
                <StatsCard title="Overdue" value={borrowReport?.summary?.overdueBorrows || 0} icon={AlertTriangle} color="rose" />
                <StatsCard title="Returned" value={borrowReport?.summary?.statusBreakdown?.returned || 0} icon={Activity} color="amber" />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Borrows by Month" subtitle="Monthly borrowing trends" />
                  <ChartWrapper>
                    {borrowMonthlyData.length > 0 ? (
                      <ChartContainer config={borrowMonthlyConfig} className="h-[240px] w-full">
                        <AreaChart data={borrowMonthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="bG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} tickFormatter={MONTH_FMT} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="count" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#bG)" dot={false} activeDot={{ r: 4, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                      </ChartContainer>
                    ) : (
                      <EmptyState icon={BarChart3} title="No data" description="Borrow data will appear here." />
                    )}
                  </ChartWrapper>
                </Card>

                <Card>
                  <CardHeader title="Most Popular Books" subtitle="Top borrowed titles" />
                  <ChartWrapper>
                    {borrowReport?.popularBooks?.length > 0 ? (
                      <>
                        {popularBooksData.length > 0 && (
                          <ChartContainer config={popularBooksConfig} className="h-[180px] w-full mb-4">
                            <BarChart data={popularBooksData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#a3a3a3' }} allowDecimals={false} />
                              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#a3a3a3' }} width={85} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="borrowCount" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} barSize={14} />
                            </BarChart>
                          </ChartContainer>
                        )}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-neutral-100">
                                <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">#</TableHead>
                                <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Title</TableHead>
                                <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">Author</TableHead>
                                <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider text-right">Borrows</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {borrowReport.popularBooks.map((b, i) => (
                                <TableRow key={b.bookId || i} className="border-neutral-100">
                                  <TableCell className="text-xs text-neutral-400 tabular-nums">{i + 1}</TableCell>
                                  <TableCell className="text-sm text-neutral-900 truncate max-w-[140px]">{b.title}</TableCell>
                                  <TableCell className="text-sm text-neutral-500 hidden md:table-cell">{b.author}</TableCell>
                                  <TableCell className="text-right text-sm font-medium text-neutral-900 tabular-nums">{b.borrowCount}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    ) : (
                      <EmptyState icon={BookOpen} title="No data" description="Popular books will appear here." />
                    )}
                  </ChartWrapper>
                </Card>
              </div>

              {borrowReport?.summary?.statusBreakdown && (
                <Card>
                  <CardHeader title="Status Breakdown" subtitle="Distribution of borrow statuses" />
                  <ChartWrapper>
                    {statusBreakdownData.length > 0 ? (
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="w-full sm:w-[240px] shrink-0">
                          <ChartContainer config={statusBreakdownConfig} className="h-[220px] w-full">
                            <PieChart>
                              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                              <Pie data={statusBreakdownData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value" labelLine={false} label={CustomPieLabel} strokeWidth={0}>
                                {statusBreakdownData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          {statusBreakdownData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                              <div className="flex items-center gap-2.5">
                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                <span className="text-sm text-neutral-700">{item.name}</span>
                              </div>
                              <span className="text-sm font-semibold text-neutral-900 tabular-nums">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(borrowReport.summary.statusBreakdown).map(([s, c]) => (
                          <div key={s} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5">
                            <span className="text-sm capitalize text-neutral-700">{s}</span>
                            <span className="text-sm font-semibold text-neutral-900">{c}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ChartWrapper>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Overdue ── */}
        <TabsContent value="overdue" className="space-y-5">
          {loading ? (
            <LoadingSpinner message="Loading overdue report..." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Overdue" value={overdueReport?.summary?.totalOverdue || 0} icon={AlertTriangle} color="rose" />
                <StatsCard title="Total Fines" value={`₹${(overdueReport?.summary?.totalCalculatedFines || 0).toFixed(2)}`} icon={DollarSign} color="amber" />
                <StatsCard title="Avg Days" value={overdueReport?.summary?.averageDaysOverdue || 0} icon={Calendar} color="teal" />
                <StatsCard title="Pending" value={`₹${(overdueReport?.summary?.pendingFinesAmount || 0).toFixed(2)}`} icon={Receipt} color="emerald" />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Overdue Trend" subtitle="Count by due date month" />
                  <ChartWrapper>
                    {overdueTrendData.length > 0 ? (
                      <ChartContainer config={overdueTrendConfig} className="h-[240px] w-full">
                        <LineChart data={overdueTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} tickFormatter={MONTH_FMT} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="count" stroke={CHART_COLORS.destructive} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: CHART_COLORS.destructive, stroke: '#fff', strokeWidth: 2 }} />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <EmptyState icon={TrendingUp} title="No data" description="Overdue trends will appear here." />
                    )}
                  </ChartWrapper>
                </Card>

                <Card>
                  <CardHeader title="Days Overdue" subtitle="Distribution of overdue duration" />
                  <ChartWrapper>
                    {daysDistributionData.length > 0 ? (
                      <ChartContainer config={daysDistributionConfig} className="h-[240px] w-full">
                        <BarChart data={daysDistributionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} barSize={36} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <EmptyState icon={BarChart3} title="No data" description="Distribution will appear here." />
                    )}
                  </ChartWrapper>
                </Card>
              </div>

              <Card>
                <CardHeader title="Overdue Books" />
                {overdueReport?.items?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-neutral-100">
                          <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Student</TableHead>
                          <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Book</TableHead>
                          <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">Due</TableHead>
                          <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider text-center">Days</TableHead>
                          <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider text-right">Fine</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overdueReport.items.map((item) => (
                          <TableRow key={item._id} className="border-neutral-100">
                            <TableCell>
                              <p className="text-sm font-medium text-neutral-900">{item.user?.name || '—'}</p>
                              <p className="text-xs text-neutral-400">{item.user?.department}</p>
                            </TableCell>
                            <TableCell className="text-sm text-neutral-700">{item.book?.title || '—'}</TableCell>
                            <TableCell className="text-sm text-neutral-500 hidden md:table-cell">{formatDate(item.dueDate)}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-block text-xs font-medium text-red-600 bg-red-50 rounded-md px-2 py-0.5 tabular-nums">{item.daysOverdue}d</span>
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-red-600 tabular-nums">₹{item.calculatedFine?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="px-5 pb-5">
                    <EmptyState icon={AlertTriangle} title="No overdue books" description="All books returned on time." />
                  </div>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Financial ── */}
        <TabsContent value="financial" className="space-y-5">
          {loading ? (
            <LoadingSpinner message="Loading financial report..." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Grand Total" value={`₹${(financialReport?.summary?.grandTotal || 0).toFixed(2)}`} icon={DollarSign} color="emerald" />
                <StatsCard title="Collected" value={`₹${(financialReport?.summary?.totalCollected || 0).toFixed(2)}`} icon={TrendingUp} color="teal" />
                <StatsCard title="Pending" value={`₹${(financialReport?.summary?.totalPending || 0).toFixed(2)}`} icon={AlertTriangle} color="amber" />
                <StatsCard title="Waived" value={`₹${(financialReport?.summary?.totalWaived || 0).toFixed(2)}`} icon={Activity} color="rose" />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Monthly Revenue" subtitle="Fine collection by month" />
                  <ChartWrapper>
                    {revenueMonthlyData.length > 0 ? (
                      <ChartContainer config={revenueConfig} className="h-[240px] w-full">
                        <AreaChart data={revenueMonthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="rGT" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="rGP" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} tickFormatter={MONTH_FMT} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} tickFormatter={(v) => '₹' + v} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area type="monotone" dataKey="totalAmount" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#rGT)" dot={false} activeDot={{ r: 4, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="paidAmount" stroke={CHART_COLORS.green} strokeWidth={2} fill="url(#rGP)" dot={false} activeDot={{ r: 4, fill: CHART_COLORS.green, stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                      </ChartContainer>
                    ) : (
                      <EmptyState icon={BarChart3} title="No data" description="Revenue data will appear here." />
                    )}
                  </ChartWrapper>
                </Card>

                <Card>
                  <CardHeader title="Payment Status" subtitle="Fine payment distribution" />
                  <ChartWrapper>
                    {paymentStatusData.length > 0 ? (
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="w-full sm:w-[240px] shrink-0">
                          <ChartContainer config={paymentStatusConfig} className="h-[220px] w-full">
                            <PieChart>
                              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel formatter={(v) => `₹${Number(v).toFixed(2)}`} />} />
                              <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value" labelLine={false} label={CustomPieLabel} strokeWidth={0}>
                                {paymentStatusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          {paymentStatusData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                              <div className="flex items-center gap-2.5">
                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                <span className="text-sm text-neutral-700">{item.name}</span>
                              </div>
                              <span className="text-sm font-semibold text-neutral-900 tabular-nums">₹{item.value.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyState icon={DollarSign} title="No data" description="Payment data will appear here." />
                    )}
                  </ChartWrapper>
                </Card>
              </div>

              <Card>
                <CardHeader title="Monthly Breakdown" />
                <ChartWrapper>
                  {financialReport?.monthlyBreakdown?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-neutral-100">
                            <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Month</TableHead>
                            <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider text-right">Total</TableHead>
                            <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider text-right hidden sm:table-cell">Paid</TableHead>
                            <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider text-right hidden md:table-cell">Pending</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialReport.monthlyBreakdown.slice(-12).map((item, i) => (
                            <TableRow key={i} className="border-neutral-100">
                              <TableCell className="text-sm font-medium text-neutral-900">{item.period}</TableCell>
                              <TableCell className="text-right text-sm text-neutral-900 tabular-nums">₹{item.totalAmount?.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-sm text-emerald-600 tabular-nums hidden sm:table-cell">₹{item.paidAmount?.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-sm text-amber-600 tabular-nums hidden md:table-cell">₹{item.pendingAmount?.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyState icon={DollarSign} title="No data" description="Financial data will appear here." />
                  )}
                </ChartWrapper>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Activity ── */}
        <TabsContent value="activity" className="space-y-5">
          {loading ? (
            <LoadingSpinner message="Loading activity logs..." />
          ) : (
            <>
              {activityTimelineData.length > 0 && (
                <Card>
                  <CardHeader title="Activity Timeline" subtitle="Daily activity counts" />
                  <ChartWrapper>
                    <ChartContainer config={activityTimelineConfig} className="h-[180px] w-full">
                      <BarChart data={activityTimelineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} barSize={20} />
                      </BarChart>
                    </ChartContainer>
                  </ChartWrapper>
                </Card>
              )}

              <Card>
                <div className="px-5 pt-5 pb-0 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-900">Activity Log</h2>
                  <span className="text-xs text-neutral-400 tabular-nums">{activityPagination.total} entries</span>
                </div>
                {activityLogs.length === 0 ? (
                  <div className="px-5 pb-5">
                    <EmptyState icon={Activity} title="No logs" description="Activity will appear as users interact." />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-neutral-100">
                            <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Time</TableHead>
                            <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">User</TableHead>
                            <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Action</TableHead>
                            <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log._id} className="border-neutral-100">
                              <TableCell className="text-xs text-neutral-400 whitespace-nowrap tabular-nums">{formatDateTime(log.createdAt)}</TableCell>
                              <TableCell>
                                <p className="text-sm text-neutral-900">{log.userId?.name || 'System'}</p>
                                <p className="text-xs text-neutral-400 hidden lg:block">{log.userId?.role || ''}</p>
                              </TableCell>
                              <TableCell>{getActionBadge(log.action)}</TableCell>
                              <TableCell className="text-sm text-neutral-500 max-w-[220px] truncate hidden md:table-cell">{log.details}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {activityPagination.pages > 1 && (
                      <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3">
                        <span className="text-xs text-neutral-400 tabular-nums">Page {activityPagination.page} of {activityPagination.pages}</span>
                        <div className="flex gap-2">
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={activityPagination.page <= 1}
                            onClick={() => fetchActivityLogs(activityPagination.page - 1)}
                          >
                            Prev
                          </button>
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={activityPagination.page >= activityPagination.pages}
                            onClick={() => fetchActivityLogs(activityPagination.page + 1)}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
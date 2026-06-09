"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  ArrowRightLeft,
  AlertTriangle,
  CalendarCheck,
  DollarSign,
  CheckCircle,
  XCircle,
  Plus,
  RotateCcw,
  BookPlus,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
  IndianRupee,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatsCard from "@/components/shared/StatsCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import apiFetch from "@/lib/fetcher";
import { toast } from "sonner";

// ── Chart configs using EduShelf design system ──────────────────────────
const borrowTrendConfig = {
  borrows: { label: "Borrows", color: "#7C9AA5" },
};

const categoryConfig = {
  value: { label: "Books" },
  category0: { label: "Fiction", color: "#7C9AA5" },
  category1: { label: "Science", color: "#7CCB7A" },
  category2: { label: "Technology", color: "#F3C47A" },
  category3: { label: "History", color: "#84C7E8" },
  category4: { label: "Philosophy", color: "#A7C2B0" },
  category5: { label: "Arts", color: "#C4952A" },
  category6: { label: "Other", color: "#F28B82" },
};

const overdueConfig = {
  onTime: { label: "On-Time", color: "#7CCB7A" },
  overdue: { label: "Overdue", color: "#F28B82" },
};

const fineConfig = {
  collected: { label: "Collected", color: "#7CCB7A" },
  pending: { label: "Pending", color: "#F3C47A" },
  waived: { label: "Waived", color: "#A7C2B0" },
};

const PIE_COLORS = [
  "#7C9AA5",
  "#7CCB7A",
  "#F3C47A",
  "#84C7E8",
  "#A7C2B0",
  "#C4952A",
  "#F28B82",
];

// ── Shared card class ───────────────────────────────────────────────────
const glassCard =
  "rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]";

// ── Month name helper ───────────────────────────────────────────────────
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function periodToLabel(period) {
  if (!period) return "";
  const [y, m] = period.split("-");
  return MONTH_NAMES[parseInt(m, 10) - 1] || period;
}

export default function LibrarianDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalStudents: 0,
    issuedToday: 0,
    overdueBooks: 0,
    activeReservations: 0,
    totalFinesCollected: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: "",
    item: null,
  });

  // Chart data state
  const [borrowTrend, setBorrowTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [overdueChartData, setOverdueChartData] = useState([]);
  const [fineTrend, setFineTrend] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const [
        booksRes,
        studentsRes,
        issuedRes,
        overdueRes,
        reservationsRes,
        finesRes,
        pendingRes,
        borrowReportRes,
        financialReportRes,
        booksForCatRes,
        categoriesRes,
      ] = await Promise.all([
        apiFetch("/books?limit=1").catch(() => ({
          data: { pagination: { total: 0 } },
        })),
        apiFetch("/users?role=student&limit=1").catch(() => ({
          data: { pagination: { total: 0 } },
        })),
        apiFetch("/borrow?status=issued&limit=100").catch(() => ({
          data: { items: [] },
        })),
        apiFetch("/borrow?status=overdue&limit=5").catch(() => ({
          data: { items: [] },
        })),
        apiFetch("/reservations?status=active&limit=1").catch(() => ({
          data: { pagination: { total: 0 } },
        })),
        apiFetch("/fines?status=paid&limit=100").catch(() => ({
          data: { items: [] },
        })),
        apiFetch("/borrow?status=requested&limit=10").catch(() => ({
          data: { items: [] },
        })),
        apiFetch("/reports/borrow").catch(() => ({ data: {} })),
        apiFetch("/reports/financial").catch(() => ({ data: {} })),
        apiFetch("/books?limit=200").catch(() => ({ data: { items: [] } })),
        apiFetch("/books/categories").catch(() => ({ data: [] })),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const issuedToday = (issuedRes.data?.items || []).filter((b) => {
        if (!b.issueDate) return false;
        const issueDate = new Date(b.issueDate);
        return issueDate >= today;
      }).length;

      const totalFinesCollected = (finesRes.data?.items || []).reduce(
        (sum, f) => sum + (f.amount || 0),
        0,
      );

      setStats({
        totalBooks: booksRes.data?.pagination?.total || 0,
        totalStudents: studentsRes.data?.pagination?.total || 0,
        issuedToday,
        overdueBooks: overdueRes.data?.pagination?.total || 0,
        activeReservations: reservationsRes.data?.pagination?.total || 0,
        totalFinesCollected: totalFinesCollected.toFixed(2),
      });

      setPendingRequests(pendingRes.data?.items || []);
      setOverdueBooks(overdueRes.data?.items || []);

      // ── Borrow Trend (LineChart) ─────────────────────────────────
      const monthlyBorrows = borrowReportRes.data?.borrowsByMonth || [];
      if (monthlyBorrows.length > 0) {
        setBorrowTrend(
          monthlyBorrows.map((m) => ({
            period: periodToLabel(m.period),
            borrows: m.count,
          })),
        );
      } else {
        // Generate placeholder last-7-days from issued items
        const issued = issuedRes.data?.items || [];
        const dayMap = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString("en-US", { weekday: "short" });
          dayMap[key] = 0;
        }
        issued.forEach((b) => {
          if (b.issueDate) {
            const key = new Date(b.issueDate).toLocaleDateString("en-US", {
              weekday: "short",
            });
            if (key in dayMap) dayMap[key]++;
          }
        });
        setBorrowTrend(
          Object.entries(dayMap).map(([period, borrows]) => ({
            period,
            borrows,
          })),
        );
      }

      // ── Category Distribution (PieChart) ─────────────────────────
      const booksList = booksForCatRes.data?.items || [];
      const catList = categoriesRes.data || [];
      if (booksList.length > 0) {
        const catMap = {};
        booksList.forEach((b) => {
          const name = b.category?.name || "Uncategorized";
          catMap[name] = (catMap[name] || 0) + 1;
        });
        const pieData = Object.entries(catMap).map(([name, value], idx) => ({
          name,
          value,
          fill: PIE_COLORS[idx % PIE_COLORS.length],
        }));
        setCategoryData(pieData);
      } else if (catList.length > 0) {
        setCategoryData(
          catList.map((c, idx) => ({
            name: c.name,
            value: 0,
            fill: PIE_COLORS[idx % PIE_COLORS.length],
          })),
        );
      }

      // ── Overdue vs On-Time (Stacked BarChart) ────────────────────
      const statusBreakdown =
        borrowReportRes.data?.summary?.statusBreakdown || {};
      const returned = statusBreakdown.returned || 0;
      const closed = statusBreakdown.closed || 0;
      const overdue = statusBreakdown.overdue || 0;
      const onTimeTotal = returned + closed;
      if (onTimeTotal > 0 || overdue > 0) {
        setOverdueChartData([
          { name: "Returns", onTime: onTimeTotal, overdue },
        ]);
      } else {
        setOverdueChartData([{ name: "Returns", onTime: 0, overdue: 0 }]);
      }

      // ── Fine Collection Trend (AreaChart) ────────────────────────
      const monthlyFines = financialReportRes.data?.monthlyBreakdown || [];
      if (monthlyFines.length > 0) {
        setFineTrend(
          monthlyFines.map((m) => ({
            period: periodToLabel(m.period),
            collected: m.paidAmount || 0,
            pending: m.pendingAmount || 0,
            waived: m.waivedAmount || 0,
          })),
        );
      } else {
        // Single data point from the summary
        const finSummary = financialReportRes.data?.summary || {};
        setFineTrend([
          {
            period: "Now",
            collected: finSummary.totalCollected || 0,
            pending: finSummary.totalPending || 0,
            waived: finSummary.totalWaived || 0,
          },
        ]);
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(borrowId) {
    try {
      await apiFetch("/borrow/issue", {
        method: "POST",
        body: { borrowId },
      });
      toast.success("Book issued successfully");
      setActionDialog({ open: false, type: "", item: null });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message || "Failed to issue book");
    }
  }

  async function handleReject(borrowId) {
    try {
      await apiFetch(`/borrow/${borrowId}`, {
        method: "PUT",
        body: { status: "rejected" },
      });
      toast.success("Borrow request rejected");
      setActionDialog({ open: false, type: "", item: null });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message || "Failed to reject request");
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatRelativeDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  // ── Dynamic category config for chart ──────────────────────────────────
  const dynamicCategoryConfig = useMemo(() => {
    const cfg = { value: { label: "Books" } };
    categoryData.forEach((item, idx) => {
      cfg[`cat_${idx}`] = { label: item.name, color: item.fill };
    });
    return cfg;
  }, [categoryData]);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6 page-enter pb-30">
      {/* Page Header */}
      {/* <div>
        <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Dashboard</h1>
        <p className="text-[#6B7280] mt-1">Manage your library operations at a glance.</p>
      </div> */}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5">
        <StatsCard
          title="Total Books"
          value={stats.totalBooks.toLocaleString()}
          icon={BookOpen}
          color="emerald"
        />
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={Users}
          color="teal"
        />
        <StatsCard
          title="Issued Today"
          value={stats.issuedToday}
          icon={ArrowRightLeft}
          color="amber"
        />
        <StatsCard
          title="Overdue Books"
          value={stats.overdueBooks}
          icon={AlertTriangle}
          color="rose"
        />
        <StatsCard
          title="Active Reservations"
          value={stats.activeReservations}
          icon={CalendarCheck}
          color="teal"
        />
        <StatsCard
          title="Fines Collected"
          value={`₹${stats.totalFinesCollected}`}
          icon={IndianRupee}
          color="emerald"
        />
      </div>

      {/* ── Charts Section ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borrow Trends — LineChart */}
        <div className={glassCard}>
          <div className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DDE7EA]">
                <TrendingUp className="h-4 w-4 text-[#5D7480]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1F2937]">
                Borrow Trends
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Monthly borrowing activity
            </p>
          </div>
          <div className="px-4 pb-4">
            {borrowTrend.length > 0 &&
            borrowTrend.some((d) => d.borrows > 0) ? (
              <ChartContainer
                config={borrowTrendConfig}
                className="h-[260px] w-full"
              >
                <LineChart
                  data={borrowTrend}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="borrows"
                    stroke="var(--color-borrows)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--color-borrows)", strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-[#6B7280]">
                <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No borrow trend data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution — PieChart (Donut) */}
        <div className={glassCard}>
          <div className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F0EC]">
                <PieChartIcon className="h-4 w-4 text-[#6B8F83]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1F2937]">
                Category Distribution
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Books by category</p>
          </div>
          <div className="px-4 pb-4">
            {categoryData.length > 0 &&
            categoryData.some((d) => d.value > 0) ? (
              <ChartContainer
                config={dynamicCategoryConfig}
                className="h-[260px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                  />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-[#6B7280]">
                <PieChartIcon className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No category data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue vs On-Time — Stacked BarChart */}
        <div className={glassCard}>
          <div className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDE8E6]">
                <BarChart3 className="h-4 w-4 text-[#C25B4F]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1F2937]">
                Overdue vs On-Time
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Return performance comparison
            </p>
          </div>
          <div className="px-4 pb-4">
            {overdueChartData.some((d) => d.onTime > 0 || d.overdue > 0) ? (
              <ChartContainer
                config={overdueConfig}
                className="h-[260px] w-full"
              >
                <BarChart
                  data={overdueChartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="onTime"
                    stackId="returns"
                    fill="var(--color-onTime)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="overdue"
                    stackId="returns"
                    fill="var(--color-overdue)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-[#6B7280]">
                <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No return data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Fine Collection Trend — AreaChart */}
        <div className={glassCard}>
          <div className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF3E2]">
                <AreaChartIcon className="h-4 w-4 text-[#C4952A]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1F2937]">
                Fine Collection Trend
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Monthly fine amounts</p>
          </div>
          <div className="px-4 pb-4">
            {fineTrend.length > 0 &&
            fineTrend.some(
              (d) => d.collected > 0 || d.pending > 0 || d.waived > 0,
            ) ? (
              <ChartContainer config={fineConfig} className="h-[260px] w-full">
                <AreaChart
                  data={fineTrend}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stackId="fines"
                    stroke="var(--color-collected)"
                    fill="var(--color-collected)"
                    fillOpacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stackId="fines"
                    stroke="var(--color-pending)"
                    fill="var(--color-pending)"
                    fillOpacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="waived"
                    stackId="fines"
                    stroke="var(--color-waived)"
                    fill="var(--color-waived)"
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-[#6B7280]">
                <AreaChartIcon className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No fine data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid — Pending Requests & Overdue Books */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Pending Borrow Requests */}
        <div className={glassCard}>
          <div className="p-4 sm:p-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">
                Pending Borrow Requests
              </h2>

              {pendingRequests.length > 0 && (
                <Badge className="w-fit bg-[#FEF3E2] text-[#C4952A] hover:bg-[#FEF3E2] border-0 rounded-full px-3">
                  {pendingRequests.length} pending
                </Badge>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No pending requests"
                description="All borrow requests have been processed."
              />
            ) : (
              <ScrollArea className="h-[350px] sm:h-[384px]">
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-2xl border border-[#E5E7EB] p-4 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-[#1F2937] break-words">
                            {request.bookId?.title || "Unknown Book"}
                          </p>

                          {request.bookId?.ISBN && (
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0 border-[#E5E7EB] text-[#6B7280]"
                            >
                              {request.bookId.ISBN}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-[#6B7280] mt-1">
                          Requested by{" "}
                          <span className="font-medium text-[#1F2937]">
                            {request.userId?.name || "Unknown Student"}
                          </span>
                        </p>

                        <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {formatRelativeDate(
                            request.requestDate || request.createdAt,
                          )}
                        </p>
                      </div>

                      <div className="flex w-full sm:w-auto gap-2 shrink-0">
                        <button
                          className="
                      flex-1 sm:flex-none
                      inline-flex items-center justify-center gap-1.5
                      px-3 py-2
                      rounded-xl
                      text-xs font-medium
                      bg-[#7CCB7A]
                      text-white
                      hover:opacity-90
                      transition-all
                    "
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              type: "approve",
                              item: request,
                            })
                          }
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>

                        <button
                          className="
                      flex-1 sm:flex-none
                      inline-flex items-center justify-center gap-1.5
                      px-3 py-2
                      rounded-xl
                      text-xs font-medium
                      bg-[#FDE8E6]
                      text-[#C25B4F]
                      hover:opacity-90
                      transition-all
                    "
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              type: "reject",
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

        {/* Overdue Books Alert */}
        <div className={glassCard}>
          <div className="p-4 sm:p-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#C25B4F] shrink-0" />
                Overdue Books Alert
              </h2>

              {overdueBooks.length > 0 && (
                <Badge className="w-fit bg-[#FDE8E6] text-[#C25B4F] hover:bg-[#FDE8E6] border-0 rounded-full px-3">
                  {stats.overdueBooks} overdue
                </Badge>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {overdueBooks.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No overdue books"
                description="All books have been returned on time."
              />
            ) : (
              <ScrollArea className="h-[350px] sm:h-[384px]">
                <div className="space-y-3">
                  {overdueBooks.map((borrow) => {
                    const dueDate = new Date(borrow.dueDate);
                    const now = new Date();

                    const daysOverdue = Math.ceil(
                      (now - dueDate) / (1000 * 60 * 60 * 24),
                    );

                    return (
                      <div
                        key={borrow._id}
                        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-2xl border border-[#F28B82]/30 bg-[#FDE8E6]/40 p-4 transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1F2937] break-words">
                            {borrow.bookId?.title || "Unknown Book"}
                          </p>

                          <p className="text-xs text-[#6B7280] mt-1">
                            Borrowed by{" "}
                            <span className="font-medium text-[#1F2937]">
                              {borrow.userId?.name || "Unknown"}
                            </span>
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs text-[#6B7280]">
                              Due: {formatDate(borrow.dueDate)}
                            </span>

                            <Badge className="bg-[#FDE8E6] text-[#C25B4F] hover:bg-[#FDE8E6] border-0 text-xs">
                              {daysOverdue}d overdue
                            </Badge>
                          </div>
                        </div>

                        <div className="flex sm:block items-center justify-between sm:text-right shrink-0">
                          <p className="text-sm font-semibold text-[#C25B4F]">
                            ${(daysOverdue * 2).toFixed(2)}
                          </p>

                          <p className="text-xs text-[#6B7280]">
                            estimated fine
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Glass Card */}
      <div className={glassCard}>
        <div className="p-4 sm:p-6 pb-3">
          <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">
            Quick Actions
          </h2>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {/* Add Book */}
            <button
              onClick={() => router.push("/librarian/books/add")}
              className="
          flex items-center justify-center gap-2
          h-12 sm:h-14
          w-full
          rounded-2xl
          text-sm font-medium
          bg-[#7C9AA5]
          hover:bg-[#5D7480]
          text-white
          transition-all duration-200
          hover:-translate-y-0.5
          focus-visible:ring-2
          focus-visible:ring-[#5D7480]
        "
            >
              <Plus className="h-4 w-4 shrink-0" />
              Add Book
            </button>

            {/* Issue Book */}
            <button
              onClick={() => router.push("/librarian/issues")}
              className="
          flex items-center justify-center gap-2
          h-12 sm:h-14
          w-full
          rounded-2xl
          text-sm font-medium
          border-2 border-[#7C9AA5]
          text-[#7C9AA5]
          hover:bg-[#7C9AA5]/10
          transition-all duration-200
          hover:-translate-y-0.5
          focus-visible:ring-2
          focus-visible:ring-[#5D7480]
        "
            >
              <BookPlus className="h-4 w-4 shrink-0" />
              Issue Book
            </button>

            {/* Process Return */}
            <button
              onClick={() => router.push("/librarian/returns")}
              className="
          flex items-center justify-center gap-2
          h-12 sm:h-14
          w-full
          rounded-2xl
          text-sm font-medium
          border-2 border-[#7C9AA5]
          text-[#7C9AA5]
          hover:bg-[#7C9AA5]/10
          transition-all duration-200
          hover:-translate-y-0.5
          focus-visible:ring-2
          focus-visible:ring-[#5D7480]
        "
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              Process Return
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: "", item: null })
        }
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937]">
              {actionDialog.type === "approve"
                ? "Approve & Issue Book"
                : "Reject Borrow Request"}
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              {actionDialog.type === "approve"
                ? `Are you sure you want to approve and issue "${actionDialog.item?.bookId?.title}" to ${actionDialog.item?.userId?.name}?`
                : `Are you sure you want to reject the borrow request for "${actionDialog.item?.bookId?.title}" by ${actionDialog.item?.userId?.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="inline-flex items-center justify-center h-10 px-5 rounded-2xl text-sm font-medium border-[#7C9AA5] border-2 text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200"
              onClick={() =>
                setActionDialog({ open: false, type: "", item: null })
              }
            >
              Cancel
            </button>
            {actionDialog.type === "approve" ? (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200"
                onClick={() => handleApprove(actionDialog.item?._id)}
              >
                <CheckCircle className="h-4 w-4" />
                Approve & Issue
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-2xl text-sm font-medium bg-[#F28B82] hover:opacity-90 text-white transition-all duration-200"
                onClick={() => handleReject(actionDialog.item?._id)}
              >
                <XCircle className="h-4 w-4" />
                Reject Request
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

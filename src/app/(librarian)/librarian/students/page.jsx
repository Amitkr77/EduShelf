'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  ShieldBan,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  BookOpen,
  DollarSign,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function StudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: '',
    student: null,
  });
  const [processing, setProcessing] = useState(false);
  const [studentStats, setStudentStats] = useState({});

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        role: 'student',
        page: page.toString(),
        limit: '10',
      });
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all')
        params.set('status', statusFilter);

      const res = await apiFetch(`/users?${params.toString()}`);
      const items = res.data?.items || [];
      setStudents(items);
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });

      // Fetch borrow/fine stats for each student
      const statsMap = {};
      await Promise.all(
        items.map(async (student) => {
          try {
            const [borrowRes, fineRes] = await Promise.all([
              apiFetch(`/borrow?userId=${student._id}&status=issued&limit=1`).catch(() => ({ data: { pagination: { total: 0 } } })),
              apiFetch(`/fines?userId=${student._id}&status=pending&limit=100`).catch(() => ({ data: { items: [] } })),
            ]);
            statsMap[student._id] = {
              borrowed: borrowRes.data?.pagination?.total || 0,
              fines: (fineRes.data?.items || []).reduce(
                (sum, f) => sum + (f.amount || 0),
                0
              ),
            };
          } catch (e) {
            statsMap[student._id] = { borrowed: 0, fines: 0 };
          }
        })
      );
      setStudentStats(statsMap);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function handleStatusChange(userId, newStatus) {
    try {
      setProcessing(true);
      await apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: { status: newStatus },
      });
      toast.success(
        `Student ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`
      );
      setActionDialog({ open: false, type: '', student: null });
      fetchStudents();
    } catch (error) {
      toast.error(error.message || 'Failed to update student status');
    } finally {
      setProcessing(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-[#E8F0EC] text-[#6B8F83] hover:bg-[#E8F0EC] border-0">
            Active
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-[#FDE8E6] text-[#C25B4F] hover:bg-[#FDE8E6] border-0">
            Suspended
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F9FAFB] border-0">
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="space-y-5 animate-in fade-in-0 duration-500">
      {/* Header */}
      {/* <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Students</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {pagination.total} registered student{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div> */}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              placeholder="Search by name, email, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 rounded-xl bg-white border border-neutral-200 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-300 transition-shadow"
            />
          </div>
        </form>
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[150px] h-11 rounded-xl bg-white border-neutral-200 text-sm">
            <Filter className="h-3.5 w-3.5 mr-2 text-neutral-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading students..." />
        ) : students.length === 0 ? (
          <div className="py-16 px-6">
            <EmptyState
              icon={Users}
              title="No students found"
              description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No students have registered yet.'}
            />
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-neutral-100">
              {students.map((student) => {
                const stats = studentStats[student._id] || { borrowed: 0, fines: 0 };
                return (
                  <div key={student._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-neutral-100 text-neutral-500 text-xs font-medium">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{student.name}</p>
                          <p className="text-xs text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            {student.email}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {stats.borrowed}
                        </span>
                        {stats.fines > 0 && (
                          <span className="flex items-center gap-1 text-red-500">
                            <DollarSign className="h-3 w-3" />
                            ₹{stats.fines.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                          student.status === 'active'
                            ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                        }`}
                        onClick={() =>
                          setActionDialog({
                            open: true,
                            type: student.status === 'active' ? 'suspend' : 'activate',
                            student,
                          })
                        }
                      >
                        {student.status === 'active' ? (
                          <span className="flex items-center gap-1"><ShieldBan className="h-3 w-3" />Suspend</span>
                        ) : (
                          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Activate</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-neutral-100">
                    <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Student</TableHead>
                    <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">ID</TableHead>
                    <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider hidden lg:table-cell">Department</TableHead>
                    <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider text-center">Borrowed</TableHead>
                    <TableHead className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider text-right hidden sm:table-cell">Fines</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const stats = studentStats[student._id] || { borrowed: 0, fines: 0 };
                    return (
                      <TableRow key={student._id} className="border-neutral-100">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-neutral-100 text-neutral-500 text-xs font-medium">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{student.name}</p>
                              <p className="text-xs text-neutral-400 truncate">{student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <code className="text-xs text-neutral-500 bg-neutral-50 px-1.5 py-0.5 rounded">{student.studentId || '—'}</code>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-neutral-500">{student.department || '—'}</TableCell>
                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                        <TableCell className="text-center text-sm tabular-nums text-neutral-700">{stats.borrowed}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          {stats.fines > 0 ? (
                            <span className="text-sm font-medium text-red-600 tabular-nums">₹{stats.fines.toFixed(2)}</span>
                          ) : (
                            <span className="text-sm text-neutral-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              {student.status === 'active' ? (
                                <DropdownMenuItem
                                  className="text-amber-700 focus:text-amber-700 rounded-lg"
                                  onClick={() => setActionDialog({ open: true, type: 'suspend', student })}
                                >
                                  <ShieldBan className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-emerald-700 focus:text-emerald-700 rounded-lg"
                                  onClick={() => setActionDialog({ open: true, type: 'activate', student })}
                                >
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
                <span className="text-xs text-neutral-400 tabular-nums">Page {pagination.page} of {pagination.pages}</span>
                <div className="flex gap-2">
                  <button
                    className="h-8 px-3 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <span className="flex items-center gap-1"><ChevronLeft className="h-3.5 w-3.5" />Prev</span>
                  </button>
                  <button
                    className="h-8 px-3 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <span className="flex items-center gap-1">Next<ChevronRight className="h-3.5 w-3.5" /></span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: '', student: null })}
      >
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 gap-0">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-semibold text-neutral-900">
              {actionDialog.type === 'suspend' ? 'Suspend Student' : 'Activate Student'}
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-500 leading-relaxed">
              {actionDialog.type === 'suspend'
                ? `Suspend ${actionDialog.student?.name}? They won't be able to borrow books until reactivated.`
                : `Reactivate ${actionDialog.student?.name}? They will regain full library access.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 pt-2">
            <button
              className="flex-1 h-10 rounded-xl text-sm font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
              onClick={() => setActionDialog({ open: false, type: '', student: null })}
            >
              Cancel
            </button>
            {actionDialog.type === 'suspend' ? (
              <button
                className="flex-1 h-10 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                onClick={() => handleStatusChange(actionDialog.student?._id, 'suspended')}
                disabled={processing}
              >
                {processing ? 'Suspending…' : 'Suspend'}
              </button>
            ) : (
              <button
                className="flex-1 h-10 rounded-xl text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                onClick={() => handleStatusChange(actionDialog.student?._id, 'active')}
                disabled={processing}
              >
                {processing ? 'Activating…' : 'Activate'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

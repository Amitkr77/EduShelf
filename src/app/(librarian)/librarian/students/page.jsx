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
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Page Header */}
      {/* <div>
        <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">Student Management</h1>
        <p className="text-sm sm:text-base text-[#6B7280] mt-1">
          {pagination.total} registered student{pagination.total !== 1 ? 's' : ''}
        </p>
      </div> */}

      {/* Search/Filter - Glass Card */}
      <div className="rounded-2xl sm:rounded-3xl  backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input
                placeholder="Search by name, email, or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] pl-10 pr-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
              />
            </div>
          </form>
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Students Table / Cards */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading students..." />
        ) : students.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Users}
              title="No students found"
              description={
                search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No students have registered yet.'
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile: Card Layout */}
            <div className="sm:hidden p-3 space-y-3 max-h-[70vh] overflow-y-auto">
              {students.map((student) => {
                const stats = studentStats[student._id] || { borrowed: 0, fines: 0 };
                return (
                  <div
                    key={student._id}
                    className="rounded-xl border border-[#E5E7EB] p-3 bg-white transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[#E3F2FA] text-[#4A8DB7] text-xs">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[#1F2937] truncate">
                            {student.name}
                          </p>
                          <p className="text-xs text-[#6B7280] flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-[#6B7280] flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {stats.borrowed} borrowed
                        </span>
                        {stats.fines > 0 && (
                          <span className="text-[#C25B4F] flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ₹{stats.fines.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                          student.status === 'active'
                            ? 'border border-[#C4952A] text-[#C4952A] hover:bg-[#FEF3E2]'
                            : 'border border-[#6B8F83] text-[#6B8F83] hover:bg-[#E8F0EC]'
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
                          <>
                            <ShieldBan className="h-3.5 w-3.5 mr-1" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden sm:block overflow-x-auto table-responsive p-6">
              <Table className="min-w-[600px] sm:min-w-0">
                <TableHeader>
                  <TableRow className="bg-[#F4F8F9] hover:bg-[#F4F8F9]">
                    <TableHead className="text-[#6B7280] font-semibold">Student</TableHead>
                    <TableHead className="hidden md:table-cell text-[#6B7280] font-semibold">
                      Student ID
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-[#6B7280] font-semibold">
                      Department
                    </TableHead>
                    <TableHead className="text-[#6B7280] font-semibold">Status</TableHead>
                    <TableHead className="text-center text-[#6B7280] font-semibold">Borrowed</TableHead>
                    <TableHead className="text-center hidden sm:table-cell text-[#6B7280] font-semibold">
                      Pending Fines
                    </TableHead>
                    <TableHead className="text-right text-[#6B7280] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const stats = studentStats[student._id] || {
                      borrowed: 0,
                      fines: 0,
                    };
                    return (
                      <TableRow key={student._id} className="hover:bg-[#F4F8F9] transition-colors border-[#E5E7EB]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-[#E3F2FA] text-[#4A8DB7] text-xs">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-[#1F2937] truncate">
                                {student.name}
                              </p>
                              <p className="text-xs text-[#6B7280] flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="font-mono text-xs border-[#E5E7EB] text-[#6B7280]">
                            {student.studentId || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-[#6B7280]">
                          {student.department || 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <BookOpen className="h-3 w-3 text-[#6B7280]" />
                            <span className="text-sm font-medium text-[#1F2937]">
                              {stats.borrowed}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          {stats.fines > 0 ? (
                            <div className="flex items-center justify-center gap-1 text-[#C25B4F]">
                              <DollarSign className="h-3 w-3" />
                              <span className="text-sm font-medium">
                                {stats.fines.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-[#6B7280]">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#1F2937]">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              {student.status === 'active' ? (
                                <DropdownMenuItem
                                  className="text-[#C4952A] focus:text-[#C4952A] rounded-lg"
                                  onClick={() =>
                                    setActionDialog({
                                      open: true,
                                      type: 'suspend',
                                      student,
                                    })
                                  }
                                >
                                  <ShieldBan className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-[#6B8F83] focus:text-[#6B8F83] rounded-lg"
                                  onClick={() =>
                                    setActionDialog({
                                      open: true,
                                      type: 'activate',
                                      student,
                                    })
                                  }
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

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: '', student: null })
        }
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937]">
              {actionDialog.type === 'suspend'
                ? 'Suspend Student'
                : 'Activate Student'}
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              {actionDialog.type === 'suspend'
                ? `Are you sure you want to suspend ${actionDialog.student?.name}? They will not be able to borrow books or access the library until reactivated.`
                : `Are you sure you want to reactivate ${actionDialog.student?.name}? They will regain full access to the library.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button
              className="inline-flex items-center justify-center h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 w-full sm:w-auto"
              onClick={() =>
                setActionDialog({ open: false, type: '', student: null })
              }
            >
              Cancel
            </button>
            {actionDialog.type === 'suspend' ? (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#F3C47A] text-[#1F2937] hover:opacity-90 transition-all duration-200 w-full sm:w-auto"
                onClick={() =>
                  handleStatusChange(
                    actionDialog.student?._id,
                    'suspended'
                  )
                }
                disabled={processing}
              >
                <ShieldBan className="h-4 w-4" />
                {processing ? 'Suspending...' : 'Suspend Student'}
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#7CCB7A] text-white hover:opacity-90 transition-all duration-200 w-full sm:w-auto"
                onClick={() =>
                  handleStatusChange(actionDialog.student?._id, 'active')
                }
                disabled={processing}
              >
                <ShieldCheck className="h-4 w-4" />
                {processing ? 'Activating...' : 'Activate Student'}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

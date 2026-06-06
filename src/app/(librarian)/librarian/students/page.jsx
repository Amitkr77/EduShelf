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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Active
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
            Suspended
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">
          {pagination.total} registered student{pagination.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or student ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
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
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
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
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner message="Loading students..." />
          ) : students.length === 0 ? (
            <div className="p-6">
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Student ID
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Department
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Borrowed</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">
                        Pending Fines
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const stats = studentStats[student._id] || {
                        borrowed: 0,
                        fines: 0,
                      };
                      return (
                        <TableRow key={student._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                                  {getInitials(student.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {student.name}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="font-mono text-xs">
                              {student.studentId || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {student.department || 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(student.status)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <BookOpen className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {stats.borrowed}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center hidden sm:table-cell">
                            {stats.fines > 0 ? (
                              <div className="flex items-center justify-center gap-1 text-rose-600">
                                <DollarSign className="h-3 w-3" />
                                <span className="text-sm font-medium">
                                  {stats.fines.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {student.status === 'active' ? (
                                  <DropdownMenuItem
                                    className="text-rose-600 focus:text-rose-600"
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
                                    className="text-emerald-600 focus:text-emerald-600"
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

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: '', student: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'suspend'
                ? 'Suspend Student'
                : 'Activate Student'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'suspend'
                ? `Are you sure you want to suspend ${actionDialog.student?.name}? They will not be able to borrow books or access the library until reactivated.`
                : `Are you sure you want to reactivate ${actionDialog.student?.name}? They will regain full access to the library.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, type: '', student: null })
              }
            >
              Cancel
            </Button>
            {actionDialog.type === 'suspend' ? (
              <Button
                variant="destructive"
                onClick={() =>
                  handleStatusChange(
                    actionDialog.student?._id,
                    'suspended'
                  )
                }
                disabled={processing}
              >
                <ShieldBan className="h-4 w-4 mr-2" />
                {processing ? 'Suspending...' : 'Suspend Student'}
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() =>
                  handleStatusChange(actionDialog.student?._id, 'active')
                }
                disabled={processing}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {processing ? 'Activating...' : 'Activate Student'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

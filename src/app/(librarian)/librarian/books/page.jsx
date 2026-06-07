'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function BooksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, book: null });
  const [deleting, setDeleting] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (search) params.set('search', search);
      if (categoryFilter && categoryFilter !== 'all')
        params.set('category', categoryFilter);
      if (sortBy) params.set('sort', sortBy);

      const res = await apiFetch(`/books?${params.toString()}`);
      setBooks(res.data?.items || []);
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, sortBy]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiFetch('/books/categories');
      setCategories(res.data || []);
    } catch (error) {
      // Silently fail for categories
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  async function handleDelete() {
    if (!deleteDialog.book) return;
    try {
      setDeleting(true);
      await apiFetch(`/books/${deleteDialog.book._id}`, { method: 'DELETE' });
      toast.success(`"${deleteDialog.book.title}" deleted successfully`);
      setDeleteDialog({ open: false, book: null });
      fetchBooks();
    } catch (error) {
      toast.error(error.message || 'Failed to delete book');
    } finally {
      setDeleting(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  }

  function getAvailabilityBadge(available, total) {
    if (available === 0) {
      return <Badge className="bg-[#FDE8E6] text-[#C25B4F] hover:bg-[#FDE8E6] border-0">Unavailable</Badge>;
    }
    if (available < total * 0.3) {
      return <Badge className="bg-[#FEF3E2] text-[#C4952A] hover:bg-[#FEF3E2] border-0">Low Stock</Badge>;
    }
    return <Badge className="bg-[#E8F0EC] text-[#6B8F83] hover:bg-[#E8F0EC] border-0">Available</Badge>;
  }

  function getCategoryName(book) {
    if (book.category && typeof book.category === 'object') {
      return book.category.name;
    }
    return 'Uncategorized';
  }

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">Manage Books</h1>
          <p className="text-sm sm:text-base text-[#6B7280] mt-1">
            {pagination.total} book{pagination.total !== 1 ? 's' : ''} in the library
          </p>
        </div>
        <button
          onClick={() => router.push('/librarian/books/add')}
          className="inline-flex items-center gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480]"
        >
          <Plus className="h-4 w-4" />
          Add Book
        </button>
      </div>

      {/* Search + Filters - Glass Card Header */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input
                placeholder="Search by title, author, or ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] pl-10 pr-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
              />
            </div>
          </form>
          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl h-11 sm:h-12 bg-[#F9FAFB] border border-[#E5E7EB]">
              <Filter className="h-4 w-4 mr-2 text-[#6B7280]" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl h-11 sm:h-12 bg-[#F9FAFB] border border-[#E5E7EB]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading books..." />
        ) : books.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={BookOpen}
              title="No books found"
              description={
                search || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Start by adding your first book to the library.'
              }
              actionLabel="Add Book"
              onAction={() => router.push('/librarian/books/add')}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto table-responsive">
              <Table className="min-w-[600px] sm:min-w-0">
                <TableHeader>
                  <TableRow className="bg-[#F4F8F9] hover:bg-[#F4F8F9]">
                    <TableHead className="w-[60px]">Cover</TableHead>
                    <TableHead className="text-[#6B7280] font-semibold">Title</TableHead>
                    <TableHead className="hidden md:table-cell text-[#6B7280] font-semibold">Author</TableHead>
                    <TableHead className="hidden lg:table-cell text-[#6B7280] font-semibold">ISBN</TableHead>
                    <TableHead className="hidden md:table-cell text-[#6B7280] font-semibold">Category</TableHead>
                    <TableHead className="text-center text-[#6B7280] font-semibold">Total</TableHead>
                    <TableHead className="text-center text-[#6B7280] font-semibold">Available</TableHead>
                    <TableHead className="text-[#6B7280] font-semibold">Status</TableHead>
                    <TableHead className="text-right text-[#6B7280] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book._id} className="hover:bg-[#F4F8F9] transition-colors border-[#E5E7EB]">
                      <TableCell>
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="h-10 w-8 rounded object-cover"
                          />
                        ) : (
                          <Avatar className="h-10 w-8 rounded">
                            <AvatarFallback className="bg-[#E3F2FA] text-[#4A8DB7] text-xs rounded">
                              <BookOpen className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[#1F2937] truncate max-w-[200px]">
                            {book.title}
                          </p>
                          <p className="text-xs text-[#6B7280] md:hidden">
                            {book.author}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-[#1F2937] truncate max-w-[150px]">{book.author}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs font-mono border-[#E5E7EB] text-[#6B7280]">
                          {book.ISBN}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className="bg-[#E3F2FA] text-[#4A8DB7] hover:bg-[#E3F2FA] border-0">
                          {getCategoryName(book)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-[#1F2937]">
                        {book.totalCopies}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-[#1F2937]">
                        {book.availableCopies}
                      </TableCell>
                      <TableCell>
                        {getAvailabilityBadge(book.availableCopies, book.totalCopies)}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Desktop: Dropdown, Mobile: Icon buttons */}
                        <div className="hidden sm:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#1F2937]">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/librarian/books/edit/${book._id}`)
                                }
                                className="text-[#7C9AA5] focus:text-[#5D7480] rounded-lg"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-[#F28B82] focus:text-[#C25B4F] rounded-lg"
                                onClick={() => setDeleteDialog({ open: true, book })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-end gap-1 sm:hidden">
                          <button
                            onClick={() => router.push(`/librarian/books/edit/${book._id}`)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200"
                            aria-label="Edit book"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ open: true, book })}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-[#F28B82] hover:bg-[#FDE8E6] transition-all duration-200"
                            aria-label="Delete book"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, book: null })}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937]">Delete Book</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Are you sure you want to delete &quot;{deleteDialog.book?.title}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="inline-flex items-center justify-center h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200"
              onClick={() => setDeleteDialog({ open: false, book: null })}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#F28B82] hover:opacity-90 text-white transition-all duration-200"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Book'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

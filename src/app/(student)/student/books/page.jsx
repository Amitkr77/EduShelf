'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Star,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

const COVER_GRADIENTS = [
  'from-[#7C9AA5]/30 to-[#5D7480]/40',
  'from-[#84C7E8]/30 to-[#4A8DB7]/40',
  'from-[#F3C47A]/30 to-[#C4952A]/40',
  'from-[#7CCB7A]/30 to-[#6B8F83]/40',
  'from-[#F28B82]/30 to-[#C25B4F]/40',
  'from-[#8CA5AF]/30 to-[#688997]/40',
];

function getCoverGradient(index) {
  return COVER_GRADIENTS[index % COVER_GRADIENTS.length];
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? 'fill-[#F3C47A] text-[#F3C47A]'
              : 'text-[#E5E7EB]'
          }`}
        />
      ))}
      <span className="text-xs text-[#6B7280] ml-1">
        ({rating?.toFixed(1) || '0.0'})
      </span>
    </div>
  );
}

export default function BooksBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [availability, setAvailability] = useState(
    searchParams.get('availability') || 'all'
  );
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [filterOpen, setFilterOpen] = useState(false);

  const limit = 12;

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiFetch('/books/categories');
      setCategories(res.data || []);
    } catch (error) {
      // silent fail for categories
    }
  }, []);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) params.set('search', search.trim());
      if (category && category !== 'all') params.set('category', category);
      if (availability && availability !== 'all')
        params.set('availability', availability);
      if (sort) params.set('sort', sort);

      const res = await apiFetch(`/books?${params.toString()}`);
      const data = res.data;

      setBooks(data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error('Failed to load books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, availability, sort, page]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadBooks();
  }

  function clearFilters() {
    setSearch('');
    setCategory('all');
    setAvailability('all');
    setSort('newest');
    setPage(1);
  }

  const hasActiveFilters =
    search || (category && category !== 'all') ||
    (availability && availability !== 'all') || (sort && sort !== 'newest');

  const FilterControls = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1F2937]">Category</Label>
        <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
          <SelectTrigger className="rounded-xl border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]">
            <SelectValue placeholder="All Categories" />
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
      </div>

      <Separator className="bg-[#E5E7EB]" />

      {/* Availability Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1F2937]">Availability</Label>
        <Select value={availability} onValueChange={(val) => { setAvailability(val); setPage(1); }}>
          <SelectTrigger className="rounded-xl border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            <SelectItem value="available">Available Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-[#E5E7EB]" />

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1F2937]">Sort By</Label>
        <Select value={sort} onValueChange={(val) => { setSort(val); setPage(1); }}>
          <SelectTrigger className="rounded-xl border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="title">Title (A-Z)</SelectItem>
            <SelectItem value="popularity">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <>
          <Separator className="bg-[#E5E7EB]" />
          <Button
            variant="outline"
            className="w-full rounded-2xl border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1F2937]"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Browse Books</h1>
        <p className="text-[#6B7280] mt-1">
          Explore our library collection and find your next great read.
        </p>
      </div>

      {/* Search Bar + Filter Toggle */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              type="search"
              placeholder="Search by title, author, or ISBN..."
              className="pl-9 rounded-xl border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480] bg-white/80 backdrop-blur-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-2xl shrink-0 transition-all duration-200"
          >
            Search
          </Button>
        </form>

        {/* Mobile filter toggle */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="lg:hidden shrink-0 rounded-2xl border-[#E5E7EB] bg-white/80 backdrop-blur-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterControls />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#1F2937]">
              <Filter className="h-4 w-4 text-[#5D7480]" />
              Filters
            </h3>
            <FilterControls />
          </div>
        </aside>

        {/* Book Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <LoadingSpinner message="Loading books..." />
          ) : books.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No books found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your filters or search terms.'
                  : 'The library catalog is currently empty.'
              }
              actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#6B7280]">
                  Showing {books.length} of {pagination.total} books
                </p>
              </div>

              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book, index) => {
                  const catName =
                    book.category?.name ||
                    (typeof book.category === 'string' ? '' : 'Uncategorized');

                  return (
                    <Link
                      key={book._id}
                      href={`/student/books/${book._id}`}
                      className="group"
                    >
                      <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[#7C9AA5]/40 h-full flex flex-col">
                        {/* Cover Image Area */}
                        <div
                          className={`aspect-[4/3] bg-gradient-to-br ${getCoverGradient(
                            index
                          )} flex items-center justify-center relative overflow-hidden`}
                        >
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-12 w-12 text-[#7C9AA5]/40" />
                          )}
                          {/* Availability Badge */}
                          <div className="absolute top-3 right-3">
                            {book.availableCopies > 0 ? (
                              <span className="inline-block rounded-xl px-2.5 py-1 text-xs font-medium bg-[#E8F0EC] text-[#6B8F83]">
                                Available
                              </span>
                            ) : (
                              <span className="inline-block rounded-xl px-2.5 py-1 text-xs font-medium bg-[#FDE8E6] text-[#C25B4F]">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold text-sm truncate group-hover:text-[#5D7480] transition-colors text-[#1F2937]">
                            {book.title}
                          </h3>
                          <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                            {book.author}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            {catName && catName !== 'Uncategorized' ? (
                              <span className="text-xs font-medium rounded-xl px-2 py-0.5 bg-[#E3F2FA] text-[#4A8DB7]">
                                {catName}
                              </span>
                            ) : (
                              <div />
                            )}
                            <StarRating rating={book.rating || 0} />
                          </div>

                          {book.availableCopies > 0 && (
                            <p className="text-xs text-[#6B7280] mt-2">
                              {book.availableCopies} of {book.totalCopies} copies available
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-2xl border-[#E5E7EB] text-[#6B7280]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(pagination.pages, 5) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className={
                              page === pageNum
                                ? 'bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-2xl'
                                : 'rounded-2xl border-[#E5E7EB] text-[#6B7280]'
                            }
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-2xl border-[#E5E7EB] text-[#6B7280]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

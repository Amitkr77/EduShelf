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
import { Card, CardContent } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

const COVER_COLORS = [
  'from-emerald-200 to-teal-300',
  'from-teal-200 to-cyan-300',
  'from-amber-200 to-orange-300',
  'from-rose-200 to-pink-300',
  'from-violet-200 to-purple-300',
  'from-sky-200 to-blue-300',
];

function getCoverColor(index) {
  return COVER_COLORS[index % COVER_COLORS.length];
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
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
        <Label className="text-sm font-medium">Category</Label>
        <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
          <SelectTrigger>
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

      <Separator />

      {/* Availability Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Availability</Label>
        <Select value={availability} onValueChange={(val) => { setAvailability(val); setPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            <SelectItem value="available">Available Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select value={sort} onValueChange={(val) => { setSort(val); setPage(1); }}>
          <SelectTrigger>
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
          <Separator />
          <Button
            variant="outline"
            className="w-full"
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
        <h1 className="text-2xl font-bold tracking-tight">Browse Books</h1>
        <p className="text-muted-foreground">
          Explore our library collection and find your next great read.
        </p>
      </div>

      {/* Search Bar + Filter Toggle */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, author, or ISBN..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
            Search
          </Button>
        </form>

        {/* Mobile filter toggle */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden shrink-0">
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
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h3>
              <FilterControls />
            </CardContent>
          </Card>
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
                <p className="text-sm text-muted-foreground">
                  Showing {books.length} of {pagination.total} books
                </p>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                      <Card className="h-full transition-all hover:shadow-lg hover:border-emerald-200 overflow-hidden">
                        {/* Cover Image Area */}
                        <div
                          className={`aspect-[4/3] bg-gradient-to-br ${getCoverColor(
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
                            <BookOpen className="h-12 w-12 text-white/60" />
                          )}
                          {/* Availability Badge */}
                          <div className="absolute top-2 right-2">
                            {book.availableCopies > 0 ? (
                              <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 text-xs">
                                Available
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold text-sm truncate group-hover:text-emerald-600 transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {book.author}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            {catName && catName !== 'Uncategorized' && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                              >
                                {catName}
                              </Badge>
                            )}
                            {(!catName || catName === 'Uncategorized') && <div />}
                            <StarRating rating={book.rating || 0} />
                          </div>

                          {book.availableCopies > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {book.availableCopies} of {book.totalCopies} copies
                              available
                            </p>
                          )}
                        </CardContent>
                      </Card>
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
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : ''
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

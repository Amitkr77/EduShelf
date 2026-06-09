"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Star,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import apiFetch from "@/lib/fetcher";
import { toast } from "sonner";

const COVER_GRADIENTS = [
  "from-[#7C9AA5]/30 to-[#5D7480]/30",
  "from-[#7CCB7A]/30 to-[#6B8F83]/30",
  "from-[#F3C47A]/30 to-[#C4952A]/30",
  "from-[#84C7E8]/30 to-[#4A8DB7]/30",
  "from-[#A7C2B0]/30 to-[#6B8F83]/30",
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
              ? "fill-[#F3C47A] text-[#F3C47A]"
              : "text-[#E5E7EB]"
          }`}
        />
      ))}
      <span className="text-xs text-[#6B7280] ml-1">
        ({rating?.toFixed(1) || "0.0"})
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

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [availability, setAvailability] = useState(
    searchParams.get("availability") || "all",
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [filterOpen, setFilterOpen] = useState(false);

  const limit = 12;

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiFetch("/books/categories");
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

      if (search.trim()) params.set("search", search.trim());
      if (category && category !== "all") params.set("category", category);
      if (availability && availability !== "all")
        params.set("availability", availability);
      if (sort) params.set("sort", sort);

      const res = await apiFetch(`/books?${params.toString()}`);
      const data = res.data;

      setBooks(data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error("Failed to load books");
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
    setSearch("");
    setCategory("all");
    setAvailability("all");
    setSort("newest");
    setPage(1);
  }

  const hasActiveFilters =
    search ||
    (category && category !== "all") ||
    (availability && availability !== "all") ||
    (sort && sort !== "newest");

  const FilterControls = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium text-[#6B7280]">
          Category
        </Label>
        <Select
          value={category}
          onValueChange={(val) => {
            setCategory(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480] h-11 sm:h-12">
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
        <Label className="text-xs sm:text-sm font-medium text-[#6B7280]">
          Availability
        </Label>
        <Select
          value={availability}
          onValueChange={(val) => {
            setAvailability(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480] h-11 sm:h-12">
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
        <Label className="text-xs sm:text-sm font-medium text-[#6B7280]">
          Sort By
        </Label>
        <Select
          value={sort}
          onValueChange={(val) => {
            setSort(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480] h-11 sm:h-12">
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
            className="w-full rounded-2xl border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1F2937] transition-all duration-200"
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
    <div className="page-enter space-y-4 sm:space-y-6">
      {/* Search Bar + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1"
        >
          {/* Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />

            <Input
              type="search"
              placeholder="Search by title, author, or ISBN..."
              className="
        pl-9 pr-3
        h-11 sm:h-12
        rounded-xl
        bg-[#F9FAFB]
        border-[#E5E7EB]
        focus-visible:ring-2
        focus-visible:ring-[#5D7480]
        focus-visible:border-transparent
        transition-all
      "
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Button */}
          <Button
            type="submit"
            className="
      w-full sm:w-auto
      h-11 sm:h-12
      px-5
      bg-[#7C9AA5]
      hover:bg-[#5D7480]
      text-white
      rounded-xl
      transition-all duration-200
      hover:-translate-y-0.5
      active:scale-95
      flex items-center justify-center gap-2
      shrink-0
    "
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>

        {/* Mobile filter toggle */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <button
              className="
      lg:hidden
      inline-flex items-center gap-2
      h-10 sm:h-11
      px-4
      rounded-xl
      border border-neutral-200
      bg-white
      text-sm font-medium text-neutral-700
      shadow-sm
      hover:bg-neutral-50
      hover:border-neutral-300
      hover:-translate-y-0.5
      active:scale-95
      transition-all duration-200
    "
            >
              <SlidersHorizontal className="h-4 w-4 text-neutral-600" />
              Filters
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0 flex flex-col">
            <SheetHeader className="px-5 pt-6 pb-4 border-b border-neutral-100">
              <SheetTitle className="text-base font-semibold text-neutral-900">
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterControls />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6 pb-30 rounded-3xl sm:pb-6 md:pb-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-3 sm:p-4 md:p-5 sticky top-4">
            <h3 className="text-base sm:text-lg font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
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
                  ? "Try adjusting your filters or search terms."
                  : "The library catalog is currently empty."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white">
                  Showing {books.length} of {pagination.total} books
                </p>
              </div>

              <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {books.map((book, index) => {
                  const catName =
                    book.category?.name ||
                    (typeof book.category === "string" ? "" : "Uncategorized");

                  return (
                    <Link
                      key={book._id}
                      href={`/student/books/${book._id}`}
                      className="group block"
                    >
                      <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:border-neutral-300 h-full flex flex-col">
                        {/* Cover */}
                        <div
                          className={`sm:aspect-[4/3] aspect-square bg-gradient-to-br ${getCoverGradient(
                            index,
                          )} flex items-center justify-center relative overflow-hidden`}
                        >
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                            />
                          ) : (
                            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white/20" />
                          )}

                          {/* Availability pill */}
                          {book.availableCopies > 0 ? (
                            <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 text-[9px] sm:text-[10px] font-medium tracking-wide uppercase bg-white/90 backdrop-blur-sm text-emerald-700 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                              Available
                            </span>
                          ) : (
                            <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 text-[9px] sm:text-[10px] font-medium tracking-wide uppercase bg-white/90 backdrop-blur-sm text-red-600 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                              Unavailable
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-2.5 sm:p-4 flex-1 flex flex-col gap-1 sm:gap-1.5">
                          <h3 className="text-[13px] sm:text-sm font-medium text-neutral-900 truncate leading-snug group-hover:text-neutral-600 transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                            {book.author}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-1 mt-auto pt-1">
                            {catName && catName !== "Uncategorized" ? (
                              <span
                                className="
        text-[9px] sm:text-[10px]
        font-medium uppercase tracking-wider
        text-neutral-400 bg-neutral-100
        rounded-md px-1.5 sm:px-2 py-0.5
        flex-1 min-w-0 truncate
      "
                              >
                                {catName}
                              </span>
                            ) : (
                              <div />
                            )}

                            <div className="shrink-0">
                              <StarRating rating={book.rating || 0} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl sm:rounded-2xl border-[#E5E7EB] text-[#6B7280] transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
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
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            className={
                              page === pageNum
                                ? "bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-xl sm:rounded-2xl transition-all duration-200"
                                : "rounded-xl sm:rounded-2xl border-[#E5E7EB] text-[#6B7280] transition-all duration-200"
                            }
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      },
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl sm:rounded-2xl border-[#E5E7EB] text-[#6B7280] transition-all duration-200"
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
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

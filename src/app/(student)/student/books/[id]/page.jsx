"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Star,
  Heart,
  BookmarkPlus,
  ArrowLeft,
  Calendar,
  Building2,
  Hash,
  Globe,
  BookText,
  MapPin,
  MessageSquare,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import apiFetch from "@/lib/fetcher";
import { toast } from "sonner";

function StarRatingInput({ rating, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`h-5 w-5 sm:h-6 sm:w-6 cursor-pointer ${
              star <= rating
                ? "fill-[#F3C47A] text-[#F3C47A]"
                : "text-[#E5E7EB] hover:text-[#F3C47A]/60"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarRatingDisplay({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
            star <= Math.round(rating)
              ? "fill-[#F3C47A] text-[#F3C47A]"
              : "text-[#E5E7EB]"
          }`}
        />
      ))}
    </div>
  );
}

const metadataItems = [
  { key: "ISBN", icon: Hash, label: "ISBN" },
  { key: "publisher", icon: Building2, label: "Publisher" },
  { key: "publishedYear", icon: Calendar, label: "Year" },
  { key: "pages", icon: BookText, label: "Pages" },
  { key: "language", icon: Globe, label: "Language" },
  { key: "shelfLocation", icon: MapPin, label: "Shelf" },
];

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id;

  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    async function loadBookData() {
      setLoading(true);
      try {
        const [bookRes, reviewsRes, wishlistRes] = await Promise.all([
          apiFetch(`/books/${bookId}`),
          apiFetch(`/reviews?bookId=${bookId}&limit=50`),
          apiFetch("/wishlist").catch(() => ({ data: { items: [] } })),
        ]);

        setBook(bookRes.data);
        setReviews(reviewsRes.data?.items || []);

        const wishlistItems = wishlistRes.data?.items || [];
        const found = wishlistItems.find(
          (item) => item.bookId?._id === bookId || item.bookId === bookId,
        );
        if (found) {
          setIsWishlisted(true);
          setWishlistId(found._id);
        }
      } catch (error) {
        toast.error("Failed to load book details");
      } finally {
        setLoading(false);
      }
    }

    if (bookId) {
      loadBookData();
    }
  }, [bookId]);

  async function handleBorrow() {
    setActionLoading(true);
    try {
      await apiFetch("/borrow", {
        method: "POST",
        body: JSON.stringify({ bookId }),
      });
      toast.success("Borrow request submitted! Waiting for approval.");
      const bookRes = await apiFetch(`/books/${bookId}`);
      setBook(bookRes.data);
    } catch (error) {
      toast.error(error.message || "Failed to request borrow");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReserve() {
    setActionLoading(true);
    try {
      await apiFetch("/reservations", {
        method: "POST",
        body: JSON.stringify({ bookId }),
      });
      toast.success("Reservation created! You are in the queue.");
    } catch (error) {
      toast.error(error.message || "Failed to create reservation");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWishlistToggle() {
    setActionLoading(true);
    try {
      if (isWishlisted && wishlistId) {
        await apiFetch(`/wishlist/${wishlistId}`, { method: "DELETE" });
        setIsWishlisted(false);
        setWishlistId(null);
        toast.success("Removed from wishlist");
      } else {
        const res = await apiFetch("/wishlist", {
          method: "POST",
          body: JSON.stringify({ bookId }),
        });
        setIsWishlisted(true);
        setWishlistId(res.data?._id);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update wishlist");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReviewSubmit() {
    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setReviewSubmitting(true);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          bookId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      toast.success("Review submitted successfully!");
      setReviewDialogOpen(false);
      setReviewRating(0);
      setReviewComment("");

      const [reviewsRes, bookRes] = await Promise.all([
        apiFetch(`/reviews?bookId=${bookId}&limit=50`),
        apiFetch(`/books/${bookId}`),
      ]);
      setReviews(reviewsRes.data?.items || []);
      setBook(bookRes.data);
    } catch (error) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading book details..." />;
  }

  if (!book) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Book not found"
        description="The book you're looking for doesn't exist or has been removed."
        actionLabel="Browse Books"
        onAction={() => router.push("/student/books")}
      />
    );
  }

  const isAvailable = book.availableCopies > 0;
  const categoryName =
    book.category?.name ||
    (typeof book.category === "string" ? "" : "Uncategorized");

  return (
    <div className="space-y-5 animate-in fade-in-0 duration-500">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="
    inline-flex items-center gap-2
    h-10 px-4
    rounded-xl
    bg-white/10
    text-white
    backdrop-blur-sm
    border border-white/10
    hover:bg-white/20
    transition-all duration-200
    hover:-translate-x-0.5
  "
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Book Header */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden">
        <div className="p-5 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Cover */}
            <div className="shrink-0 mx-auto sm:mx-0">
              <div className="w-40 h-56 sm:w-44 sm:h-60 rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center overflow-hidden shadow-md">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-12 w-12 text-white/40" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-3 text-center sm:text-left">
              <div className="space-y-1.5">
                <div className="flex items-start gap-2.5 flex-wrap justify-center sm:justify-start">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 leading-tight">
                    {book.title}
                  </h1>
                  {isAvailable ? (
                    <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
                      Available
                    </span>
                  ) : (
                    <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-red-600 bg-red-50 rounded-full px-2.5 py-1">
                      Unavailable
                    </span>
                  )}
                </div>
                <p className="text-neutral-500 text-base">{book.author}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <StarRatingDisplay rating={book.rating || 0} />
                <span className="text-sm text-neutral-400 tabular-nums">
                  {book.rating?.toFixed(1) || "0.0"} · {book.ratingCount || 0}{" "}
                  review{(book.ratingCount || 0) !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Category */}
              {categoryName && categoryName !== "Uncategorized" && (
                <span className="inline-block self-center sm:self-start text-[10px] font-medium uppercase tracking-wider text-neutral-500 bg-neutral-100 rounded-md px-2.5 py-1">
                  {categoryName}
                </span>
              )}

              {/* Copies */}
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div
                  className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-red-400"}`}
                />
                <span className="text-sm text-neutral-600">
                  {isAvailable
                    ? `${book.availableCopies} of ${book.totalCopies} available`
                    : "All copies borrowed"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {isAvailable ? (
                  <button
                    className="h-11 px-5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    onClick={handleBorrow}
                    disabled={actionLoading}
                  >
                    <BookOpen className="h-4 w-4" />
                    {actionLoading ? "Requesting…" : "Borrow Book"}
                  </button>
                ) : (
                  <button
                    className="h-11 px-5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    onClick={handleReserve}
                    disabled={actionLoading}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    {actionLoading ? "Reserving…" : "Reserve"}
                  </button>
                )}
                <button
                  onClick={handleWishlistToggle}
                  disabled={actionLoading}
                  className={`h-11 px-5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
                    isWishlisted
                      ? "border-red-200 text-red-500 hover:bg-red-50"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${isWishlisted ? "fill-red-400" : ""}`}
                  />
                  {isWishlisted ? "Wishlisted" : "Wishlist"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description + Details Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Description */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200/80 bg-white">
          <div className="px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
            <h2 className="text-sm font-semibold text-neutral-900">
              Description
            </h2>
          </div>
          <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
            <p className="text-sm text-neutral-500 leading-relaxed whitespace-pre-line">
              {book.description || "No description available."}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white">
          <div className="px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
            <h2 className="text-sm font-semibold text-neutral-900">Details</h2>
          </div>
          <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
            <div className="divide-y divide-neutral-100">
              {metadataItems.map(({ key, icon: Icon, label }) => {
                const value = book[key];
                if (!value && value !== 0) return null;
                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <Icon className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-neutral-400">
                        {label}
                      </p>
                      <p className="text-sm font-medium text-neutral-900 mt-0.5 break-words">
                        {value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white">
        <div className="px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Reviews
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5 tabular-nums">
                {book.rating?.toFixed(1) || "0.0"} average ·{" "}
                {book.ratingCount || 0} review
                {(book.ratingCount || 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
              <DialogTrigger asChild>
                <button className="h-9 px-4 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors inline-flex items-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  Write Review
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px] rounded-2xl p-6 gap-0">
                <DialogHeader className="space-y-1 pb-4">
                  <DialogTitle className="text-lg font-semibold text-neutral-900">
                    Write a Review
                  </DialogTitle>
                  <DialogDescription className="text-sm text-neutral-500">
                    Share your thoughts about this book.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-2">
                      Rating
                    </p>
                    <StarRatingInput
                      rating={reviewRating}
                      onChange={setReviewRating}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-2">
                      Review
                    </p>
                    <Textarea
                      placeholder="What did you think?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      className="rounded-xl bg-neutral-50 border-neutral-200 text-sm focus-visible:ring-2 focus-visible:ring-neutral-900/5 focus-visible:border-neutral-300 resize-none"
                    />
                  </div>
                  <button
                    className="w-full h-10 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40"
                    onClick={handleReviewSubmit}
                    disabled={reviewSubmitting || reviewRating === 0}
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          {reviews.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={MessageSquare}
                title="No reviews yet"
                description="Be the first to share your thoughts."
              />
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {reviews.map((review) => {
                const user = review.userId || {};
                const initials = user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "U";

                return (
                  <div
                    key={review._id}
                    className="py-3 border-b border-neutral-100 last:border-0 first:pt-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-neutral-100 text-neutral-500 text-[10px] font-medium border-0">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-neutral-900 truncate">
                            {user.name || "Anonymous"}
                          </span>
                          <span className="text-[11px] text-neutral-400 tabular-nums">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <StarRatingDisplay rating={review.rating} />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-neutral-500 mt-2 leading-relaxed pl-[38px]">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

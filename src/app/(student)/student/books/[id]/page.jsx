'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

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
            className={`h-6 w-6 cursor-pointer ${
              star <= rating
                ? 'fill-[#F3C47A] text-[#F3C47A]'
                : 'text-[#E5E7EB] hover:text-[#F3C47A]/60'
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
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? 'fill-[#F3C47A] text-[#F3C47A]'
              : 'text-[#E5E7EB]'
          }`}
        />
      ))}
    </div>
  );
}

const metadataItems = [
  { key: 'ISBN', icon: Hash, label: 'ISBN' },
  { key: 'publisher', icon: Building2, label: 'Publisher' },
  { key: 'publishedYear', icon: Calendar, label: 'Year' },
  { key: 'pages', icon: BookText, label: 'Pages' },
  { key: 'language', icon: Globe, label: 'Language' },
  { key: 'shelfLocation', icon: MapPin, label: 'Shelf' },
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
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    async function loadBookData() {
      setLoading(true);
      try {
        const [bookRes, reviewsRes, wishlistRes] = await Promise.all([
          apiFetch(`/books/${bookId}`),
          apiFetch(`/reviews?bookId=${bookId}&limit=50`),
          apiFetch('/wishlist').catch(() => ({ data: { items: [] } })),
        ]);

        setBook(bookRes.data);
        setReviews(reviewsRes.data?.items || []);

        const wishlistItems = wishlistRes.data?.items || [];
        const found = wishlistItems.find(
          (item) => item.bookId?._id === bookId || item.bookId === bookId
        );
        if (found) {
          setIsWishlisted(true);
          setWishlistId(found._id);
        }
      } catch (error) {
        toast.error('Failed to load book details');
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
      await apiFetch('/borrow', {
        method: 'POST',
        body: JSON.stringify({ bookId }),
      });
      toast.success('Borrow request submitted! Waiting for approval.');
      const bookRes = await apiFetch(`/books/${bookId}`);
      setBook(bookRes.data);
    } catch (error) {
      toast.error(error.message || 'Failed to request borrow');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReserve() {
    setActionLoading(true);
    try {
      await apiFetch('/reservations', {
        method: 'POST',
        body: JSON.stringify({ bookId }),
      });
      toast.success('Reservation created! You are in the queue.');
    } catch (error) {
      toast.error(error.message || 'Failed to create reservation');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWishlistToggle() {
    setActionLoading(true);
    try {
      if (isWishlisted && wishlistId) {
        await apiFetch(`/wishlist/${wishlistId}`, { method: 'DELETE' });
        setIsWishlisted(false);
        setWishlistId(null);
        toast.success('Removed from wishlist');
      } else {
        const res = await apiFetch('/wishlist', {
          method: 'POST',
          body: JSON.stringify({ bookId }),
        });
        setIsWishlisted(true);
        setWishlistId(res.data?._id);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReviewSubmit() {
    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setReviewSubmitting(true);
    try {
      await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          bookId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      toast.success('Review submitted successfully!');
      setReviewDialogOpen(false);
      setReviewRating(0);
      setReviewComment('');

      const [reviewsRes, bookRes] = await Promise.all([
        apiFetch(`/reviews?bookId=${bookId}&limit=50`),
        apiFetch(`/books/${bookId}`),
      ]);
      setReviews(reviewsRes.data?.items || []);
      setBook(bookRes.data);
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
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
        onAction={() => router.push('/student/books')}
      />
    );
  }

  const isAvailable = book.availableCopies > 0;
  const categoryName =
    book.category?.name ||
    (typeof book.category === 'string' ? '' : 'Uncategorized');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="text-[#6B7280] hover:text-[#1F2937] hover:bg-transparent"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Book Header Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Book Cover */}
          <div className="shrink-0">
            <div className="w-48 h-64 rounded-2xl bg-gradient-to-br from-[#7C9AA5]/30 to-[#5D7480]/40 flex items-center justify-center overflow-hidden shadow-lg">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <BookOpen className="h-16 w-16 text-[#7C9AA5]/40" />
              )}
            </div>
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937] leading-tight">
                {book.title}
              </h1>
              {isAvailable ? (
                <span className="inline-block mt-2 rounded-xl px-3 py-1 text-xs font-medium bg-[#E8F0EC] text-[#6B8F83]">
                  Available
                </span>
              ) : (
                <span className="inline-block mt-2 rounded-xl px-3 py-1 text-xs font-medium bg-[#FDE8E6] text-[#C25B4F]">
                  Unavailable
                </span>
              )}
            </div>
            <p className="text-[#6B7280] text-lg">{book.author}</p>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <StarRatingDisplay rating={book.rating || 0} />
              <span className="text-sm text-[#6B7280]">
                {book.rating?.toFixed(1) || '0.0'} ({book.ratingCount || 0}{' '}
                review{book.ratingCount !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Category Badge */}
            {categoryName && categoryName !== 'Uncategorized' && (
              <span className="inline-block rounded-xl px-3 py-1 text-xs font-medium bg-[#E3F2FA] text-[#4A8DB7]">
                {categoryName}
              </span>
            )}

            {/* Available copies */}
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isAvailable ? 'bg-[#7CCB7A]' : 'bg-[#F28B82]'
                }`}
              />
              <span className="text-sm text-[#1F2937]">
                {isAvailable
                  ? `${book.availableCopies} of ${book.totalCopies} copies available`
                  : 'All copies are currently borrowed'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {isAvailable ? (
                <Button
                  className="bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-2xl transition-all duration-200"
                  onClick={handleBorrow}
                  disabled={actionLoading}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Requesting...' : 'Borrow Book'}
                </Button>
              ) : (
                <Button
                  className="bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-2xl transition-all duration-200"
                  onClick={handleReserve}
                  disabled={actionLoading}
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Reserving...' : 'Reserve Book'}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleWishlistToggle}
                disabled={actionLoading}
                className={`rounded-2xl transition-all duration-200 ${
                  isWishlisted
                    ? 'border-[#F28B82]/40 text-[#C25B4F] hover:bg-[#FDE8E6]/30'
                    : 'border-[#E5E7EB] text-[#5D7480] hover:bg-[#DDE7EA]/30'
                }`}
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${
                    isWishlisted ? 'fill-[#F28B82]' : ''
                  }`}
                />
                {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Details + Description Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Description */}
        <div className="lg:col-span-2 rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-semibold text-[#1F2937]">Description</h2>
          </div>
          <div className="px-6 pb-6">
            <p className="text-sm text-[#6B7280] leading-relaxed">
              {book.description || 'No description available for this book.'}
            </p>
          </div>
        </div>

        {/* Book Metadata */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-semibold text-[#1F2937]">Book Details</h2>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {metadataItems.map(({ key, icon: Icon, label }) => {
              const value = book[key];
              if (!value && value !== 0) return null;
              return (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <Icon className="h-4 w-4 text-[#6B7280] shrink-0" />
                  <span className="text-[#6B7280]">{label}:</span>
                  <span className="font-medium text-[#1F2937]">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between p-6 pb-2">
          <div>
            <h2 className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#5D7480]" />
              Reviews
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              {book.rating?.toFixed(1) || '0.0'} average from{' '}
              {book.ratingCount || 0} review
              {(book.ratingCount || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-2xl transition-all duration-200"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <p className="text-sm font-medium mb-2 text-[#1F2937]">Your Rating</p>
                  <StarRatingInput
                    rating={reviewRating}
                    onChange={setReviewRating}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 text-[#1F2937]">Your Review</p>
                  <Textarea
                    placeholder="Share your thoughts about this book..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="rounded-xl border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]"
                  />
                </div>
                <Button
                  className="w-full bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-2xl transition-all duration-200"
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting || reviewRating === 0}
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="px-6 pb-6">
          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews yet"
              description="Be the first to share your thoughts about this book!"
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const user = review.userId || {};
                const initials = user.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'U';

                return (
                  <div
                    key={review._id}
                    className="border border-[#E5E7EB] rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7C9AA5]/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-[#DDE7EA] text-[#5D7480] text-xs font-semibold border-0">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-[#1F2937]">
                            {user.name || 'Anonymous'}
                          </p>
                          <div className="flex items-center gap-2">
                            <StarRatingDisplay rating={review.rating} />
                            <span className="text-xs text-[#6B7280]">
                              {new Date(review.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-[#6B7280] mt-3 leading-relaxed">
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

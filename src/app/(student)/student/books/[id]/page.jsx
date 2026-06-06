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
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300 hover:text-amber-300'
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
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

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

        // Check if this book is in the wishlist
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
      // Refresh book data
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

      // Refresh reviews and book data
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
        className="text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Book Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Book Cover */}
        <div className="shrink-0">
          <div className="w-48 h-64 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-300 flex items-center justify-center overflow-hidden shadow-lg">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <BookOpen className="h-16 w-16 text-white/60" />
            )}
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
              {isAvailable ? (
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                  Available
                </Badge>
              ) : (
                <Badge variant="destructive">Unavailable</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg">{book.author}</p>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <StarRatingDisplay rating={book.rating || 0} />
              <span className="text-sm text-muted-foreground">
                {book.rating?.toFixed(1) || '0.0'} ({book.ratingCount || 0}{' '}
                review{book.ratingCount !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Category Badge */}
            {categoryName && categoryName !== 'Uncategorized' && (
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
              >
                {categoryName}
              </Badge>
            )}

            {/* Available copies */}
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-sm">
                {isAvailable
                  ? `${book.availableCopies} of ${book.totalCopies} copies available`
                  : 'All copies are currently borrowed'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {isAvailable ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleBorrow}
                  disabled={actionLoading}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Requesting...' : 'Borrow Book'}
                </Button>
              ) : (
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white"
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
                className={
                  isWishlisted
                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${
                    isWishlisted ? 'fill-rose-500' : ''
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {book.description || 'No description available for this book.'}
            </p>
          </CardContent>
        </Card>

        {/* Book Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Book Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {book.ISBN && (
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">ISBN:</span>
                <span className="font-medium">{book.ISBN}</span>
              </div>
            )}
            {book.publisher && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Publisher:</span>
                <span className="font-medium">{book.publisher}</span>
              </div>
            )}
            {book.publishedYear && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Year:</span>
                <span className="font-medium">{book.publishedYear}</span>
              </div>
            )}
            {book.pages > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <BookText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Pages:</span>
                <span className="font-medium">{book.pages}</span>
              </div>
            )}
            {book.language && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Language:</span>
                <span className="font-medium">{book.language}</span>
              </div>
            )}
            {book.shelfLocation && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Shelf:</span>
                <span className="font-medium">{book.shelfLocation}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reviews
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {book.rating?.toFixed(1) || '0.0'} average from{' '}
              {book.ratingCount || 0} review
              {(book.ratingCount || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <p className="text-sm font-medium mb-2">Your Rating</p>
                  <StarRatingInput
                    rating={reviewRating}
                    onChange={setReviewRating}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Your Review</p>
                  <Textarea
                    placeholder="Share your thoughts about this book..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting || reviewRating === 0}
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
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
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user.name || 'Anonymous'}
                          </p>
                          <div className="flex items-center gap-2">
                            <StarRatingDisplay rating={review.rating} />
                            <span className="text-xs text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { connectDB } from '@/lib/db.js';
import Review from '@/models/Review.js';
import Book from '@/models/Book.js';
import ActivityLog from '@/models/ActivityLog.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';

// Helper: recalculate book average rating
async function recalculateBookRating(bookId) {
  const reviews = await Review.find({ bookId });
  const book = await Book.findById(bookId);
  if (!book) return;

  if (reviews.length === 0) {
    book.rating = 0;
    book.ratingCount = 0;
  } else {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    book.rating = Math.round(avgRating * 10) / 10;
    book.ratingCount = reviews.length;
  }
  await book.save();
}

// GET /api/reviews/[id] — Get single review
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const review = await Review.findById(id)
      .populate('userId', 'name avatar')
      .populate('bookId', 'title author');

    if (!review) {
      return apiError('Review not found', 404);
    }

    return apiResponse(review, 'Review retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/reviews/[id] — Update review (owner only)
export async function PUT(request, { params }) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const { id } = await params;

      const review = await Review.findById(id);
      if (!review) {
        return apiError('Review not found', 404);
      }

      // Only the owner can update
      if (review.userId.toString() !== user._id.toString()) {
        return apiError('You can only update your own reviews', 403);
      }

      const body = await request.json();
      const { rating, comment } = body;

      // Validate rating if provided
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          return apiError('Rating must be between 1 and 5');
        }
        review.rating = Number(rating);
      }

      if (comment !== undefined) {
        review.comment = comment;
      }

      await review.save();

      // Recalculate book average rating
      await recalculateBookRating(review.bookId);

      const updatedReview = await Review.findById(id)
        .populate('userId', 'name avatar')
        .populate('bookId', 'title author');

      return apiResponse(updatedReview, 'Review updated successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/reviews/[id] — Delete review (owner or librarian/admin)
export async function DELETE(request, { params }) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const { id } = await params;

      const review = await Review.findById(id);
      if (!review) {
        return apiError('Review not found', 404);
      }

      // Owner or librarian/admin can delete
      const isOwner = review.userId.toString() === user._id.toString();
      const hasRole = ['librarian', 'admin'].includes(user.role);

      if (!isOwner && !hasRole) {
        return apiError('You can only delete your own reviews', 403);
      }

      const bookId = review.bookId;

      await Review.findByIdAndDelete(id);

      // Recalculate book average rating
      await recalculateBookRating(bookId);

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'review_delete',
        details: `Review ${id} deleted`,
        resourceId: id,
        resourceType: 'review',
      });

      return apiResponse(null, 'Review deleted successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

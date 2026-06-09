import { connectDB } from '@/lib/db.js';
import Review from '@/models/Review.js';
import Book from '@/models/Book.js';
import ActivityLog from '@/models/ActivityLog.js';
import User from '@/models/User.js';
import {
  apiResponse,
  apiError,
  handleApiError,
  parseQueryParams,
  paginateParams,
  paginateResponse,
} from '@/lib/helpers.js';
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

// GET /api/reviews — List reviews with filter and pagination
export async function GET(request) {
  try {
    await connectDB();

    const query = parseQueryParams(request);
    const { page, limit, skip } = paginateParams(query);

    // Build filter
    const filter = {};

    if (query.bookId) {
      filter.bookId = query.bookId;
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'name avatar')
        .populate('bookId', 'title author')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    const result = paginateResponse(reviews, total, page, limit);

    return apiResponse(result, 'Reviews retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/reviews — Create review (withAuth)
export async function POST(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const body = await request.json();
      const { bookId, rating, comment } = body;

      if (!bookId) {
        return apiError('Book ID is required');
      }

      if (!rating || rating < 1 || rating > 5) {
        return apiError('Rating must be between 1 and 5');
      }

      // Check book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return apiError('Book not found', 404);
      }

      // Check user hasn't already reviewed this book
      const existingReview = await Review.findOne({
        userId: user._id,
        bookId: bookId,
      });

      if (existingReview) {
        return apiError('You have already reviewed this book', 409);
      }

      const review = await Review.create({
        userId: user._id,
        bookId,
        rating: Number(rating),
        comment: comment || '',
      });

      // Recalculate book average rating
      await recalculateBookRating(bookId);

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'review_add',
        details: `Reviewed "${book.title}" with ${rating} star(s)`,
        resourceId: review._id,
        resourceType: 'review',
      });

      const populatedReview = await Review.findById(review._id)
        .populate('userId', 'name avatar')
        .populate('bookId', 'title author');

      return apiResponse(populatedReview, 'Review created successfully', true, 201);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

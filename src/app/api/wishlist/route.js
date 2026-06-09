import { connectDB } from '@/lib/db.js';
import Wishlist from '@/models/Wishlist.js';
import Book from '@/models/Book.js';
import ActivityLog from '@/models/ActivityLog.js';
import User from '@/models/User.js';
import Category from '@/models/Category.js';
import {
  apiResponse,
  apiError,
  handleApiError,
  parseQueryParams,
  paginateParams,
  paginateResponse,
} from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';

// GET /api/wishlist — List wishlist for current user
export async function GET(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const query = parseQueryParams(request);
      const { page, limit, skip } = paginateParams(query);

      const filter = { userId: user._id };

      const [wishlistItems, total] = await Promise.all([
        Wishlist.find(filter)
          .populate('bookId', 'title author ISBN coverImage rating ratingCount availableCopies category')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Wishlist.countDocuments(filter),
      ]);

      const result = paginateResponse(wishlistItems, total, page, limit);

      return apiResponse(result, 'Wishlist retrieved successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/wishlist — Add to wishlist
export async function POST(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const body = await request.json();
      const { bookId } = body;

      if (!bookId) {
        return apiError('Book ID is required');
      }

      // Check book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return apiError('Book not found', 404);
      }

      // Check not already in wishlist
      const existingItem = await Wishlist.findOne({
        userId: user._id,
        bookId: bookId,
      });

      if (existingItem) {
        return apiError('Book is already in your wishlist', 409);
      }

      const wishlistItem = await Wishlist.create({
        userId: user._id,
        bookId,
      });

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'wishlist_add',
        details: `Added "${book.title}" to wishlist`,
        resourceId: wishlistItem._id,
        resourceType: 'book',
      });

      const populatedItem = await Wishlist.findById(wishlistItem._id)
        .populate('bookId', 'title author ISBN coverImage rating ratingCount availableCopies category');

      return apiResponse(populatedItem, 'Book added to wishlist', true, 201);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

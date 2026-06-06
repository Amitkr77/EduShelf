import { connectDB } from '@/lib/db.js';
import { apiResponse, apiError, handleApiError, parseQueryParams, paginateParams, paginateResponse } from '@/lib/helpers.js';
import { withAuth, withRole } from '@/lib/middleware.js';
import Borrow from '@/models/Borrow.js';
import Book from '@/models/Book.js';
import Notification from '@/models/Notification.js';
import ActivityLog from '@/models/ActivityLog.js';

// GET /api/borrow - List borrows (librarian sees all, student sees own)
export async function GET(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const query = parseQueryParams(request);
      const { page, limit, skip } = paginateParams(query);

      // Build filter
      const filter = {};

      // Students can only see their own borrows
      if (user.role === 'student') {
        filter.userId = user._id;
      } else {
        // Librarian/admin can filter by userId
        if (query.userId) {
          filter.userId = query.userId;
        }
      }

      // Filter by status
      if (query.status) {
        filter.status = query.status;
      }

      const [borrows, total] = await Promise.all([
        Borrow.find(filter)
          .populate('userId', 'name email studentId')
          .populate('bookId', 'title author ISBN')
          .populate('approvedBy', 'name')
          .populate('returnedTo', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Borrow.countDocuments(filter),
      ]);

      const result = paginateResponse(borrows, total, page, limit);

      return apiResponse(result, 'Borrows retrieved successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/borrow - Student requests to borrow a book
export async function POST(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const body = await request.json();
      const { bookId } = body;

      if (!bookId) {
        return apiError('Book ID is required', 400);
      }

      // Check book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return apiError('Book not found', 404);
      }

      // Check for duplicate active borrow (same user, same book, status in [requested, approved, issued])
      const existingBorrow = await Borrow.findOne({
        userId: user._id,
        bookId: bookId,
        status: { $in: ['requested', 'approved', 'issued'] },
      });

      if (existingBorrow) {
        return apiError('You already have an active borrow request or loan for this book', 409);
      }

      // Create borrow request
      const borrow = await Borrow.create({
        userId: user._id,
        bookId: bookId,
        status: 'requested',
        requestDate: new Date(),
      });

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'borrow_request',
        details: `Requested to borrow "${book.title}"`,
        resourceId: borrow._id,
        resourceType: 'borrow',
      });

      // Notify librarians about new borrow request
      await Notification.create({
        userId: user._id,
        message: `Your borrow request for "${book.title}" has been submitted and is pending approval.`,
        type: 'general',
        relatedId: borrow._id,
        relatedType: 'borrow',
      });

      const populatedBorrow = await Borrow.findById(borrow._id)
        .populate('userId', 'name email studentId')
        .populate('bookId', 'title author ISBN');

      return apiResponse(populatedBorrow, 'Borrow request submitted successfully', true, 201);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

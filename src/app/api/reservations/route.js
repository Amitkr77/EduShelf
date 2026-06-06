import { connectDB } from '@/lib/db.js';
import { apiResponse, apiError, handleApiError, parseQueryParams, paginateParams, paginateResponse, RESERVATION_EXPIRY_HOURS } from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';
import Reservation from '@/models/Reservation.js';
import Book from '@/models/Book.js';
import Notification from '@/models/Notification.js';
import ActivityLog from '@/models/ActivityLog.js';

// GET /api/reservations - List reservations (librarian sees all, student sees own)
export async function GET(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const query = parseQueryParams(request);
      const { page, limit, skip } = paginateParams(query);

      // Build filter
      const filter = {};

      // Students can only see their own reservations
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

      // Filter by bookId
      if (query.bookId) {
        filter.bookId = query.bookId;
      }

      const [reservations, total] = await Promise.all([
        Reservation.find(filter)
          .populate('userId', 'name email studentId')
          .populate('bookId', 'title author ISBN')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Reservation.countDocuments(filter),
      ]);

      const result = paginateResponse(reservations, total, page, limit);

      return apiResponse(result, 'Reservations retrieved successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/reservations - Create reservation for unavailable book
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

      // Check book is unavailable (availableCopies === 0)
      if (book.availableCopies > 0) {
        return apiError('This book is currently available. You can borrow it directly instead of reserving.', 400);
      }

      // Check no existing active reservation for same user+book
      const existingReservation = await Reservation.findOne({
        userId: user._id,
        bookId: bookId,
        status: 'active',
      });

      if (existingReservation) {
        return apiError('You already have an active reservation for this book', 409);
      }

      // Get next queuePosition for this book (max active position + 1)
      const lastReservation = await Reservation.findOne({
        bookId: bookId,
        status: 'active',
      }).sort({ queuePosition: -1 });

      const queuePosition = lastReservation ? lastReservation.queuePosition + 1 : 1;

      // Set expiryDate to null initially (will be set when book becomes available)
      const reservation = await Reservation.create({
        userId: user._id,
        bookId: bookId,
        queuePosition,
        status: 'active',
        reservedDate: new Date(),
        expiryDate: null,
      });

      // Create notification
      await Notification.create({
        userId: user._id,
        message: `You have been added to the reservation queue for "${book.title}". Your queue position is ${queuePosition}.`,
        type: 'reservation_update',
        relatedId: reservation._id,
        relatedType: 'reservation',
      });

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'reservation_create',
        details: `Reserved "${book.title}" (queue position: ${queuePosition})`,
        resourceId: reservation._id,
        resourceType: 'reservation',
      });

      const populatedReservation = await Reservation.findById(reservation._id)
        .populate('userId', 'name email studentId')
        .populate('bookId', 'title author ISBN');

      return apiResponse(populatedReservation, 'Reservation created successfully', true, 201);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { connectDB } from '@/lib/db.js';
import { apiResponse, apiError, handleApiError, DAILY_FINE_RATE } from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';
import Borrow from '@/models/Borrow.js';
import Book from '@/models/Book.js';
import Fine from '@/models/Fine.js';
import Reservation from '@/models/Reservation.js';
import Notification from '@/models/Notification.js';
import ActivityLog from '@/models/ActivityLog.js';

// POST /api/borrow/return - Return a book (librarian/admin or student)
export async function POST(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const body = await request.json();
      const { borrowId } = body;

      if (!borrowId) {
        return apiError('Borrow ID is required', 400);
      }

      // Check borrow exists
      const borrow = await Borrow.findById(borrowId);
      if (!borrow) {
        return apiError('Borrow record not found', 404);
      }

      // Check borrow status is 'issued' or 'overdue'
      if (!['issued', 'overdue'].includes(borrow.status)) {
        return apiError(`Cannot return a book with status "${borrow.status}". Only "issued" or "overdue" borrows can be returned.`, 400);
      }

      // Students can only return their own books
      if (user.role === 'student' && borrow.userId.toString() !== user._id.toString()) {
        return apiError('You can only return your own borrowed books', 403);
      }

      const returnDate = new Date();
      const book = await Book.findById(borrow.bookId);

      if (!book) {
        return apiError('Associated book not found', 404);
      }

      // Update borrow record
      borrow.returnDate = returnDate;
      borrow.status = 'returned';
      borrow.returnedTo = user._id;

      await borrow.save();

      // Increment book available copies
      book.availableCopies += 1;
      await book.save();

      // Check if overdue and create fine
      const dueDate = new Date(borrow.dueDate);
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));

      let fineRecord = null;
      if (daysOverdue > 0) {
        // Check if fine already exists for this borrow
        const existingFine = await Fine.findOne({ borrowId: borrow._id });
        if (existingFine) {
          // Update existing fine with final amount
          existingFine.daysOverdue = daysOverdue;
          existingFine.amount = daysOverdue * DAILY_FINE_RATE;
          existingFine.dailyRate = DAILY_FINE_RATE;
          existingFine.reason = `Book returned ${daysOverdue} day(s) overdue`;
          await existingFine.save();
          fineRecord = existingFine;
        } else {
          // Create new fine
          fineRecord = await Fine.create({
            userId: borrow.userId,
            borrowId: borrow._id,
            bookId: borrow.bookId,
            amount: daysOverdue * DAILY_FINE_RATE,
            daysOverdue: daysOverdue,
            dailyRate: DAILY_FINE_RATE,
            reason: `Book returned ${daysOverdue} day(s) overdue`,
            status: 'pending',
          });
        }

        // Notify user about fine
        await Notification.create({
          userId: borrow.userId,
          message: `You have been fined $${(daysOverdue * DAILY_FINE_RATE).toFixed(2)} for returning "${book.title}" ${daysOverdue} day(s) overdue.`,
          type: 'fine',
          relatedId: fineRecord._id,
          relatedType: 'fine',
        });
      }

      // Process reservation queue: notify first in queue
      const nextReservation = await Reservation.findOne({
        bookId: borrow.bookId,
        status: 'active',
      }).sort({ queuePosition: 1 });

      if (nextReservation) {
        // Set expiry date for the reservation (48 hours from now)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 48);
        nextReservation.expiryDate = expiryDate;
        nextReservation.notifiedAt = new Date();
        await nextReservation.save();

        // Notify the user whose reservation is next
        await Notification.create({
          userId: nextReservation.userId,
          message: `The book "${book.title}" you reserved is now available. You have 48 hours to borrow it before your reservation expires.`,
          type: 'reservation_update',
          relatedId: nextReservation._id,
          relatedType: 'reservation',
        });
      }

      // Create return notification for the borrower
      await Notification.create({
        userId: borrow.userId,
        message: `You have successfully returned "${book.title}".${daysOverdue > 0 ? ` A fine of $${(daysOverdue * DAILY_FINE_RATE).toFixed(2)} has been applied for late return.` : ''}`,
        type: 'general',
        relatedId: borrow._id,
        relatedType: 'borrow',
      });

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'borrow_return',
        details: `Returned "${book.title}"${daysOverdue > 0 ? ` (${daysOverdue} days overdue, fine: $${(daysOverdue * DAILY_FINE_RATE).toFixed(2)})` : ''}`,
        resourceId: borrow._id,
        resourceType: 'borrow',
      });

      const populatedBorrow = await Borrow.findById(borrow._id)
        .populate('userId', 'name email studentId')
        .populate('bookId', 'title author ISBN')
        .populate('returnedTo', 'name');

      const responseData = {
        borrow: populatedBorrow,
        fine: fineRecord,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
        reservationNotified: !!nextReservation,
      };

      return apiResponse(responseData, `Book returned successfully${daysOverdue > 0 ? `. Fine of $${(daysOverdue * DAILY_FINE_RATE).toFixed(2)} applied for ${daysOverdue} day(s) overdue.` : ''}`);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

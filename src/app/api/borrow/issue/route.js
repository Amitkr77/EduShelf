import { connectDB } from '@/lib/db.js';
import { apiResponse, apiError, handleApiError, BORROW_DURATION_DAYS } from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';
import Borrow from '@/models/Borrow.js';
import Book from '@/models/Book.js';
import Notification from '@/models/Notification.js';
import ActivityLog from '@/models/ActivityLog.js';

// POST /api/borrow/issue - Approve and issue a book (librarian/admin only)
export async function POST(request) {
  try {
    return await withRole(request, ['librarian', 'admin'], async (user) => {
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

      // Check borrow status is 'requested' or 'approved'
      if (!['requested', 'approved'].includes(borrow.status)) {
        return apiError(`Cannot issue a book with status "${borrow.status}". Only "requested" or "approved" borrows can be issued.`, 400);
      }

      // Check book still has available copies
      const book = await Book.findById(borrow.bookId);
      if (!book) {
        return apiError('Associated book not found', 404);
      }

      if (book.availableCopies <= 0) {
        return apiError('No available copies of this book. The book may have been borrowed by someone else.', 400);
      }

      // Set issue details
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

      borrow.issueDate = now;
      borrow.dueDate = dueDate;
      borrow.status = 'issued';
      borrow.approvedBy = user._id;

      await borrow.save();

      // Decrement book available copies
      book.availableCopies -= 1;
      book.borrowCount += 1;
      await book.save();

      // Create notification for student
      await Notification.create({
        userId: borrow.userId,
        message: `Your borrow request for "${book.title}" has been approved. Due date: ${dueDate.toLocaleDateString()}.`,
        type: 'borrow_approved',
        relatedId: borrow._id,
        relatedType: 'borrow',
      });

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'borrow_issue',
        details: `Issued "${book.title}" to user (borrow ID: ${borrow._id})`,
        resourceId: borrow._id,
        resourceType: 'borrow',
      });

      const populatedBorrow = await Borrow.findById(borrow._id)
        .populate('userId', 'name email studentId')
        .populate('bookId', 'title author ISBN')
        .populate('approvedBy', 'name');

      return apiResponse(populatedBorrow, 'Book issued successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

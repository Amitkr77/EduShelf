import { connectDB } from '@/lib/db.js';
import { apiResponse, apiError, handleApiError, parseQueryParams, paginateParams, paginateResponse, DAILY_FINE_RATE } from '@/lib/helpers.js';
import { withAuth, withRole } from '@/lib/middleware.js';
import Borrow from '@/models/Borrow.js';
import Fine from '@/models/Fine.js';
import Notification from '@/models/Notification.js';
import ActivityLog from '@/models/ActivityLog.js';
import User from '@/models/User.js';
import Book from '@/models/Book.js';

// GET /api/fines - List fines (librarian sees all, student sees own)
export async function GET(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const query = parseQueryParams(request);
      const { page, limit, skip } = paginateParams(query);

      // Build filter
      const filter = {};

      // Students can only see their own fines
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

      // Filter by borrowId
      if (query.borrowId) {
        filter.borrowId = query.borrowId;
      }

      const [fines, total] = await Promise.all([
        Fine.find(filter)
          .populate('userId', 'name email studentId')
          .populate('borrowId')
          .populate('bookId', 'title author ISBN')
          .populate('paidTo', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Fine.countDocuments(filter),
      ]);

      const result = paginateResponse(fines, total, page, limit);

      return apiResponse(result, 'Fines retrieved successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/fines - Calculate overdue fines (librarian/system endpoint)
export async function POST(request) {
  try {
    return await withRole(request, ['librarian', 'admin'], async (user) => {
      await connectDB();

      const now = new Date();

      // Find all borrows with status 'issued' where dueDate < now (overdue)
      const overdueBorrows = await Borrow.find({
        status: 'issued',
        dueDate: { $lt: now },
      });

      if (overdueBorrows.length === 0) {
        return apiResponse({ processed: 0, fines: [] }, 'No overdue borrows found');
      }

      const processedFines = [];
      const errors = [];

      for (const borrow of overdueBorrows) {
        try {
          // Update borrow status to 'overdue'
          borrow.status = 'overdue';
          await borrow.save();

          // Calculate days overdue
          const daysOverdue = Math.ceil((now - borrow.dueDate) / (1000 * 60 * 60 * 24));

          // Check if fine already exists for this borrow
          let fine = await Fine.findOne({ borrowId: borrow._id });

          if (fine) {
            // Update existing fine with current overdue amount
            fine.daysOverdue = daysOverdue;
            fine.amount = daysOverdue * DAILY_FINE_RATE;
            fine.dailyRate = DAILY_FINE_RATE;
            fine.reason = `Book is ${daysOverdue} day(s) overdue`;
            await fine.save();
          } else {
            // Create new fine
            fine = await Fine.create({
              userId: borrow.userId,
              borrowId: borrow._id,
              bookId: borrow.bookId,
              amount: daysOverdue * DAILY_FINE_RATE,
              daysOverdue: daysOverdue,
              dailyRate: DAILY_FINE_RATE,
              reason: `Book is ${daysOverdue} day(s) overdue`,
              status: 'pending',
            });
          }

          // Notify user about overdue
          await Notification.create({
            userId: borrow.userId,
            message: `Your borrowed book is ${daysOverdue} day(s) overdue. A fine of $${(daysOverdue * DAILY_FINE_RATE).toFixed(2)} has been applied.`,
            type: 'overdue_alert',
            relatedId: fine._id,
            relatedType: 'fine',
          });

          // Log activity
          await ActivityLog.create({
            userId: user._id,
            action: 'fine_create',
            details: `Overdue fine of $${(daysOverdue * DAILY_FINE_RATE).toFixed(2)} created for borrow ${borrow._id} (${daysOverdue} days overdue)`,
            resourceId: fine._id,
            resourceType: 'fine',
          });

          processedFines.push(fine);
        } catch (err) {
          errors.push({
            borrowId: borrow._id,
            error: err.message,
          });
        }
      }

      return apiResponse({
        processed: processedFines.length,
        totalOverdue: overdueBorrows.length,
        fines: processedFines,
        errors: errors.length > 0 ? errors : undefined,
      }, `Processed ${processedFines.length} overdue fine(s)`);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

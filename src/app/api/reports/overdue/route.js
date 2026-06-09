import { connectDB } from '@/lib/db.js';
import Borrow from '@/models/Borrow.js';
import Fine from '@/models/Fine.js';
import {
  apiResponse,
  apiError,
  handleApiError,
  parseQueryParams,
  paginateParams,
  paginateResponse,
  DAILY_FINE_RATE,
} from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';
import User from '@/models/User.js';
import Book from '@/models/Book.js';

// GET /api/reports/overdue — Overdue report (librarian/admin only)
export async function GET(request) {
  try {
    return await withRole(request, ['librarian', 'admin'], async (user) => {
      await connectDB();

      const query = parseQueryParams(request);
      const { page, limit, skip } = paginateParams(query);

      // Find all overdue borrows
      const filter = { status: 'overdue' };

      const [overdueBorrows, total] = await Promise.all([
        Borrow.find(filter)
          .populate('userId', 'name email studentId department')
          .populate('bookId', 'title author ISBN')
          .sort({ dueDate: 1 }) // Most overdue first
          .skip(skip)
          .limit(limit),
        Borrow.countDocuments(filter),
      ]);

      // Calculate fine details for each overdue borrow
      const now = new Date();
      let totalFines = 0;

      const overdueWithFines = overdueBorrows.map((borrow) => {
        const daysOverdue = Math.ceil((now - borrow.dueDate) / (1000 * 60 * 60 * 24));
        const calculatedFine = daysOverdue * DAILY_FINE_RATE;
        totalFines += calculatedFine;

        return {
          _id: borrow._id,
          user: borrow.userId,
          book: borrow.bookId,
          issueDate: borrow.issueDate,
          dueDate: borrow.dueDate,
          daysOverdue,
          calculatedFine,
          borrowStatus: borrow.status,
        };
      });

      // Get actual fines from DB for these borrows
      const borrowIds = overdueBorrows.map((b) => b._id);
      const existingFines = await Fine.find({
        borrowId: { $in: borrowIds },
        status: { $in: ['pending', 'paid', 'waived'] },
      });

      const finesByBorrowId = {};
      existingFines.forEach((fine) => {
        finesByBorrowId[fine.borrowId.toString()] = fine;
      });

      // Merge fine records
      const overdueWithFineRecords = overdueWithFines.map((item) => ({
        ...item,
        fineRecord: finesByBorrowId[item._id.toString()] || null,
      }));

      // Summary statistics
      const totalOverdueCount = total;
      const averageDaysOverdue = overdueWithFines.length > 0
        ? Math.round(
            overdueWithFines.reduce((sum, item) => sum + item.daysOverdue, 0) /
              overdueWithFines.length
          )
        : 0;

      // Count fines by status
      const paidFines = existingFines.filter((f) => f.status === 'paid');
      const pendingFines = existingFines.filter((f) => f.status === 'pending');
      const waivedFines = existingFines.filter((f) => f.status === 'waived');

      const summary = {
        totalOverdue: totalOverdueCount,
        totalCalculatedFines: totalFines,
        averageDaysOverdue,
        paidFinesCount: paidFines.length,
        paidFinesAmount: paidFines.reduce((sum, f) => sum + f.amount, 0),
        pendingFinesCount: pendingFines.length,
        pendingFinesAmount: pendingFines.reduce((sum, f) => sum + f.amount, 0),
        waivedFinesCount: waivedFines.length,
        waivedFinesAmount: waivedFines.reduce((sum, f) => sum + f.amount, 0),
      };

      const paginatedResult = paginateResponse(overdueWithFineRecords, total, page, limit);

      return apiResponse({
        summary,
        ...paginatedResult,
      }, 'Overdue report generated successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

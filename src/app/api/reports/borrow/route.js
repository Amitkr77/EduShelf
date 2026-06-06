import { connectDB } from '@/lib/db.js';
import Borrow from '@/models/Borrow.js';
import Book from '@/models/Book.js';
import { apiResponse, apiError, handleApiError, parseQueryParams } from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';

// GET /api/reports/borrow — Borrow report (librarian/admin only)
export async function GET(request) {
  try {
    return await withRole(request, ['librarian', 'admin'], async (user) => {
      await connectDB();

      const query = parseQueryParams(request);

      // Build date filter
      const dateFilter = {};
      if (query.startDate) {
        dateFilter.createdAt = { ...dateFilter.createdAt, $gte: new Date(query.startDate) };
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt = { ...dateFilter.createdAt, $lte: end };
      }

      const borrowFilter = Object.keys(dateFilter).length > 0 ? dateFilter : {};

      // Borrows by status
      const borrowsByStatus = await Borrow.aggregate([
        { $match: borrowFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const statusBreakdown = {};
      borrowsByStatus.forEach((item) => {
        statusBreakdown[item._id] = item.count;
      });

      // Borrows by month
      const borrowsByMonth = await Borrow.aggregate([
        { $match: borrowFilter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const monthlyData = borrowsByMonth.map((item) => ({
        period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        year: item._id.year,
        month: item._id.month,
        count: item.count,
      }));

      // Popular books (most borrowed)
      const popularBooks = await Borrow.aggregate([
        { $match: borrowFilter },
        {
          $group: {
            _id: '$bookId',
            borrowCount: { $sum: 1 },
          },
        },
        { $sort: { borrowCount: -1 } },
        { $limit: 10 },
      ]);

      // Populate book details for popular books
      const popularBookIds = popularBooks.map((item) => item._id);
      const booksDetails = await Book.find({ _id: { $in: popularBookIds } })
        .select('title author ISBN');

      const popularBooksWithDetails = popularBooks.map((item) => {
        const bookDetail = booksDetails.find(
          (b) => b._id.toString() === item._id.toString()
        );
        return {
          bookId: item._id,
          title: bookDetail?.title || 'Unknown',
          author: bookDetail?.author || 'Unknown',
          ISBN: bookDetail?.ISBN || '',
          borrowCount: item.borrowCount,
        };
      });

      // Total borrows
      const totalBorrows = await Borrow.countDocuments(borrowFilter);

      // Currently active borrows
      const activeBorrows = await Borrow.countDocuments({
        ...borrowFilter,
        status: { $in: ['issued', 'approved'] },
      });

      // Overdue borrows
      const overdueBorrows = await Borrow.countDocuments({
        ...borrowFilter,
        status: 'overdue',
      });

      const summary = {
        totalBorrows,
        activeBorrows,
        overdueBorrows,
        statusBreakdown,
      };

      return apiResponse({
        summary,
        borrowsByMonth: monthlyData,
        popularBooks: popularBooksWithDetails,
      }, 'Borrow report generated successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

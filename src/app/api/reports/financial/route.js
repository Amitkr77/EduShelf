import { connectDB } from '@/lib/db.js';
import Fine from '@/models/Fine.js';
import { apiResponse, apiError, handleApiError, parseQueryParams } from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';

// GET /api/reports/financial — Financial report (librarian/admin only)
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

      const fineFilter = Object.keys(dateFilter).length > 0 ? dateFilter : {};

      // Total collected (paid)
      const paidAggregation = await Fine.aggregate([
        { $match: { ...fineFilter, status: 'paid' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      // Total pending
      const pendingAggregation = await Fine.aggregate([
        { $match: { ...fineFilter, status: 'pending' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      // Total waived
      const waivedAggregation = await Fine.aggregate([
        { $match: { ...fineFilter, status: 'waived' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      const totalCollected = paidAggregation.length > 0 ? paidAggregation[0].totalAmount : 0;
      const collectedCount = paidAggregation.length > 0 ? paidAggregation[0].count : 0;

      const totalPending = pendingAggregation.length > 0 ? pendingAggregation[0].totalAmount : 0;
      const pendingCount = pendingAggregation.length > 0 ? pendingAggregation[0].count : 0;

      const totalWaived = waivedAggregation.length > 0 ? waivedAggregation[0].totalAmount : 0;
      const waivedCount = waivedAggregation.length > 0 ? waivedAggregation[0].count : 0;

      // Group by month
      const monthlyBreakdown = await Fine.aggregate([
        { $match: fineFilter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0],
              },
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0],
              },
            },
            waivedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'waived'] }, '$amount', 0],
              },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const monthlyData = monthlyBreakdown.map((item) => ({
        period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        year: item._id.year,
        month: item._id.month,
        totalAmount: item.totalAmount,
        count: item.count,
        paidAmount: item.paidAmount,
        pendingAmount: item.pendingAmount,
        waivedAmount: item.waivedAmount,
      }));

      const summary = {
        totalCollected,
        collectedCount,
        totalPending,
        pendingCount,
        totalWaived,
        waivedCount,
        grandTotal: totalCollected + totalPending + totalWaived,
      };

      return apiResponse({
        summary,
        monthlyBreakdown: monthlyData,
      }, 'Financial report generated successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

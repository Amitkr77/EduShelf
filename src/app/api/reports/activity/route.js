import { connectDB } from '@/lib/db.js';
import ActivityLog from '@/models/ActivityLog.js';
import {
  apiResponse,
  apiError,
  handleApiError,
  parseQueryParams,
  paginateParams,
  paginateResponse,
} from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';

// GET /api/reports/activity — Activity log (librarian/admin only)
export async function GET(request) {
  try {
    return await withRole(request, ['librarian', 'admin'], async (user) => {
      await connectDB();

      const query = parseQueryParams(request);
      const { page, limit, skip } = paginateParams(query);

      // Build filter
      const filter = {};

      // Filter by action
      if (query.action) {
        filter.action = query.action;
      }

      // Filter by userId
      if (query.userId) {
        filter.userId = query.userId;
      }

      // Filter by resourceType
      if (query.resourceType) {
        filter.resourceType = query.resourceType;
      }

      // Date range filter
      if (query.startDate) {
        filter.createdAt = { ...filter.createdAt, $gte: new Date(query.startDate) };
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt = { ...filter.createdAt, $lte: end };
      }

      const [logs, total] = await Promise.all([
        ActivityLog.find(filter)
          .populate('userId', 'name email role studentId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        ActivityLog.countDocuments(filter),
      ]);

      const result = paginateResponse(logs, total, page, limit);

      return apiResponse(result, 'Activity logs retrieved successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

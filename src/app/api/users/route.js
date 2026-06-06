import { connectDB } from '@/lib/db.js';
import User from '@/models/User.js';
import {
  apiResponse,
  apiError,
  handleApiError,
  parseQueryParams,
  paginateParams,
  paginateResponse,
} from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';

// GET /api/users — List users (librarian/admin only) with filter by role, status, search
export async function GET(request) {
  return withRole(request, ['librarian', 'admin'], async (user) => {
    try {
      await connectDB();

      const params = parseQueryParams(request);
      const { search, role, status } = params;
      const { page, limit, skip } = paginateParams(params);

      // Build dynamic query
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
        ];
      }

      if (role) {
        query.role = role;
      }

      if (status) {
        query.status = status;
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -resetPasswordToken -resetPasswordExpire')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
      ]);

      const data = paginateResponse(users, total, page, limit);

      return apiResponse(data, 'Users retrieved successfully');
    } catch (error) {
      return handleApiError(error);
    }
  });
}

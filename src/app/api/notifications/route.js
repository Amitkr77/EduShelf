import { connectDB } from '@/lib/db.js';
import Notification from '@/models/Notification.js';
import {
  apiResponse,
  apiError,
  handleApiError,
  parseQueryParams,
  paginateParams,
  paginateResponse,
} from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';

// GET /api/notifications — List notifications for current user
export async function GET(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const query = parseQueryParams(request);
      const { page, limit, skip } = paginateParams(query);

      // Build filter — always scoped to current user
      const filter = { userId: user._id };

      // Filter by isRead
      if (query.isRead !== undefined) {
        filter.isRead = query.isRead === 'true';
      }

      // Filter by type
      if (query.type) {
        filter.type = query.type;
      }

      const [notifications, total] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(filter),
      ]);

      const result = paginateResponse(notifications, total, page, limit);

      return apiResponse(result, 'Notifications retrieved successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/notifications — Create notification (system use)
export async function POST(request) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const body = await request.json();
      const { userId, message, type, relatedId, relatedType } = body;

      if (!userId) {
        return apiError('User ID is required');
      }

      if (!message || !message.trim()) {
        return apiError('Message is required');
      }

      const notification = await Notification.create({
        userId,
        message: message.trim(),
        type: type || 'general',
        relatedId: relatedId || null,
        relatedType: relatedType || null,
      });

      return apiResponse(notification, 'Notification created successfully', true, 201);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { connectDB } from '@/lib/db.js';
import Notification from '@/models/Notification.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';

// PUT /api/notifications/[id] — Mark notification as read (toggle isRead)
export async function PUT(request, { params }) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const { id } = await params;

      const notification = await Notification.findById(id);
      if (!notification) {
        return apiError('Notification not found', 404);
      }

      // Only the owner can mark it
      if (notification.userId.toString() !== user._id.toString()) {
        return apiError('You can only modify your own notifications', 403);
      }

      // Toggle isRead
      notification.isRead = !notification.isRead;
      await notification.save();

      return apiResponse(notification, notification.isRead ? 'Notification marked as read' : 'Notification marked as unread');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/notifications/[id] — Delete notification (owner only)
export async function DELETE(request, { params }) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const { id } = await params;

      const notification = await Notification.findById(id);
      if (!notification) {
        return apiError('Notification not found', 404);
      }

      // Only the owner can delete it
      if (notification.userId.toString() !== user._id.toString()) {
        return apiError('You can only delete your own notifications', 403);
      }

      await Notification.findByIdAndDelete(id);

      return apiResponse(null, 'Notification deleted successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

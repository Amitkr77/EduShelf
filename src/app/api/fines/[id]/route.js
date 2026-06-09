import { connectDB } from '@/lib/db.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';
import Fine from '@/models/Fine.js';
import Notification from '@/models/Notification.js';
import ActivityLog from '@/models/ActivityLog.js';
import User from '@/models/User.js';
import Book from '@/models/Book.js';
import Borrow from '@/models/Borrow.js';

// PUT /api/fines/[id] - Update fine status (mark as paid or waived)
export async function PUT(request, { params }) {
  try {
    return await withRole(request, ['librarian', 'admin'], async (user) => {
      await connectDB();

      const { id } = await params;
      const body = await request.json();
      const { status, reason } = body;

      if (!status) {
        return apiError('Status is required', 400);
      }

      // Validate status transition
      if (!['paid', 'waived'].includes(status)) {
        return apiError('Invalid status. Only "paid" or "waived" are allowed.', 400);
      }

      const fine = await Fine.findById(id);
      if (!fine) {
        return apiError('Fine not found', 404);
      }

      // Check if fine is already paid or waived
      if (fine.status === 'paid') {
        return apiError('This fine has already been paid', 400);
      }

      if (fine.status === 'waived') {
        return apiError('This fine has already been waived', 400);
      }

      // Update fine based on new status
      if (status === 'paid') {
        fine.status = 'paid';
        fine.paidDate = new Date();
        fine.paidTo = user._id;
      } else if (status === 'waived') {
        fine.status = 'waived';
        // Optionally update reason
        if (reason) {
          fine.reason = reason;
        }
      }

      await fine.save();

      // Create notification for user
      const notificationMessage = status === 'paid'
        ? `Your fine of $${fine.amount.toFixed(2)} has been marked as paid.`
        : `Your fine of $${fine.amount.toFixed(2)} has been waived.${reason ? ` Reason: ${reason}` : ''}`;

      await Notification.create({
        userId: fine.userId,
        message: notificationMessage,
        type: 'fine',
        relatedId: fine._id,
        relatedType: 'fine',
      });

      // Log activity
      const actionType = status === 'paid' ? 'fine_pay' : 'fine_waive';
      const actionDetails = status === 'paid'
        ? `Fine of $${fine.amount.toFixed(2)} marked as paid`
        : `Fine of $${fine.amount.toFixed(2)} waived${reason ? ` (reason: ${reason})` : ''}`;

      await ActivityLog.create({
        userId: user._id,
        action: actionType,
        details: actionDetails,
        resourceId: fine._id,
        resourceType: 'fine',
      });

      const populatedFine = await Fine.findById(fine._id)
        .populate('userId', 'name email studentId')
        .populate('borrowId')
        .populate('bookId', 'title author ISBN')
        .populate('paidTo', 'name');

      return apiResponse(populatedFine, `Fine ${status === 'paid' ? 'marked as paid' : 'waived'} successfully`);
    });
  } catch (error) {
    return handleApiError(error);
  }
}

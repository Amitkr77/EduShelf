import { connectDB } from '@/lib/db.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';
import Reservation from '@/models/Reservation.js';
import Notification from '@/models/Notification.js';
import ActivityLog from '@/models/ActivityLog.js';

// PUT /api/reservations/[id] - Cancel a reservation
export async function PUT(request, { params }) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const { id } = await params;
      const body = await request.json();

      const reservation = await Reservation.findById(id);
      if (!reservation) {
        return apiError('Reservation not found', 404);
      }

      // Only the reservation owner or librarian/admin can cancel
      const isOwner = reservation.userId.toString() === user._id.toString();
      const isStaff = ['librarian', 'admin'].includes(user.role);

      if (!isOwner && !isStaff) {
        return apiError('You can only cancel your own reservations', 403);
      }

      // Check if reservation is still active
      if (reservation.status !== 'active') {
        return apiError(`Cannot cancel a reservation with status "${reservation.status}". Only active reservations can be cancelled.`, 400);
      }

      const cancelledPosition = reservation.queuePosition;
      const bookId = reservation.bookId;

      // Update reservation status
      reservation.status = 'cancelled';
      await reservation.save();

      // Reorder queue positions for remaining active reservations on same book
      // Find other active reservations for same book with queuePosition > cancelled position
      const reservationsToReorder = await Reservation.find({
        bookId: bookId,
        status: 'active',
        queuePosition: { $gt: cancelledPosition },
      });

      // Decrement queuePosition by 1 for each
      for (const res of reservationsToReorder) {
        res.queuePosition -= 1;
        await res.save();
      }

      // Create notification
      await Notification.create({
        userId: reservation.userId,
        message: `Your reservation has been cancelled.`,
        type: 'reservation_update',
        relatedId: reservation._id,
        relatedType: 'reservation',
      });

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'reservation_cancel',
        details: `Cancelled reservation (position was: ${cancelledPosition})`,
        resourceId: reservation._id,
        resourceType: 'reservation',
      });

      const populatedReservation = await Reservation.findById(reservation._id)
        .populate('userId', 'name email studentId')
        .populate('bookId', 'title author ISBN');

      return apiResponse(populatedReservation, 'Reservation cancelled successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

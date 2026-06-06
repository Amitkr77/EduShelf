import { connectDB } from '@/lib/db.js';
import Wishlist from '@/models/Wishlist.js';
import ActivityLog from '@/models/ActivityLog.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';

// DELETE /api/wishlist/[id] — Remove from wishlist (owner only)
export async function DELETE(request, { params }) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const { id } = await params;

      const wishlistItem = await Wishlist.findById(id);
      if (!wishlistItem) {
        return apiError('Wishlist item not found', 404);
      }

      // Only the owner can remove
      if (wishlistItem.userId.toString() !== user._id.toString()) {
        return apiError('You can only remove items from your own wishlist', 403);
      }

      await Wishlist.findByIdAndDelete(id);

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: 'wishlist_remove',
        details: `Removed book from wishlist`,
        resourceId: wishlistItem.bookId,
        resourceType: 'book',
      });

      return apiResponse(null, 'Book removed from wishlist');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

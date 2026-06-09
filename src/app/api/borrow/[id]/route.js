import { connectDB } from '@/lib/db.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withAuth } from '@/lib/middleware.js';
import Borrow from '@/models/Borrow.js';
import Book from '@/models/Book.js';
import User from '@/models/User.js';
import Notification from '@/models/Notification.js';
import ActivityLog from '@/models/ActivityLog.js';

// GET /api/borrow/[id] - Get single borrow details
export async function GET(request, { params }) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const { id } = await params;
      const borrow = await Borrow.findById(id)
        .populate('userId', 'name email studentId')
        .populate('bookId', 'title author ISBN')
        .populate('approvedBy', 'name')
        .populate('returnedTo', 'name');

      if (!borrow) {
        return apiError('Borrow record not found', 404);
      }

      // Students can only view their own borrows
      if (user.role === 'student' && borrow.userId._id.toString() !== user._id.toString()) {
        return apiError('Access denied', 403);
      }

      return apiResponse(borrow, 'Borrow record retrieved successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/borrow/[id] - Update borrow (for notes, etc.)
export async function PUT(request, { params }) {
  try {
    return await withAuth(request, async (user) => {
      await connectDB();

      const { id } = await params;
      const body = await request.json();

      const borrow = await Borrow.findById(id);
      if (!borrow) {
        return apiError('Borrow record not found', 404);
      }

      // Students can only update their own borrows (limited fields)
      if (user.role === 'student') {
        if (borrow.userId.toString() !== user._id.toString()) {
          return apiError('Access denied', 403);
        }
        // Students can only update notes
        if (body.notes !== undefined) {
          borrow.notes = body.notes;
        }
      } else {
        // Librarian/admin can update more fields
        const allowedFields = ['notes', 'status', 'dueDate'];
        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            borrow[field] = body[field];
          }
        }
      }

      await borrow.save();

      const updatedBorrow = await Borrow.findById(borrow._id)
        .populate('userId', 'name email studentId')
        .populate('bookId', 'title author ISBN')
        .populate('approvedBy', 'name')
        .populate('returnedTo', 'name');

      return apiResponse(updatedBorrow, 'Borrow record updated successfully');
    });
  } catch (error) {
    return handleApiError(error);
  }
}

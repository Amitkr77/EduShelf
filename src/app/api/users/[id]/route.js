import { connectDB } from '@/lib/db.js';
import User from '@/models/User.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';

// GET /api/users/[id] — Get user profile (own profile or librarian/admin)
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    // Authenticate user
    const { authenticate } = await import('@/lib/auth.js');
    const currentUser = await authenticate(request.headers);

    if (!currentUser) {
      return apiError('Authentication required', 401);
    }

    // Users can only view their own profile unless they are librarian/admin
    const isOwnProfile = currentUser._id.toString() === id;
    const hasPrivilegedRole = ['librarian', 'admin'].includes(currentUser.role);

    if (!isOwnProfile && !hasPrivilegedRole) {
      return apiError('Insufficient permissions', 403);
    }

    const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return apiError('User not found', 404);
    }

    return apiResponse(user, 'User profile retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/users/[id] — Update user profile (own profile or librarian/admin)
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    // Authenticate user
    const { authenticate } = await import('@/lib/auth.js');
    const currentUser = await authenticate(request.headers);

    if (!currentUser) {
      return apiError('Authentication required', 401);
    }

    const isOwnProfile = currentUser._id.toString() === id;
    const hasPrivilegedRole = ['librarian', 'admin'].includes(currentUser.role);

    if (!isOwnProfile && !hasPrivilegedRole) {
      return apiError('Insufficient permissions', 403);
    }

    const body = await request.json();

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return apiError('User not found', 404);
    }

    // Build update object
    const updateFields = {};

    // Regular users can update these fields on their own profile
    const userFields = ['name', 'phone', 'department', 'avatar'];

    // Only librarian/admin can update these fields
    const adminFields = ['role', 'status', 'studentId'];

    for (const field of userFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] === 'string') {
          updateFields[field] = body[field].trim();
        } else {
          updateFields[field] = body[field];
        }
      }
    }

    // Only librarian/admin can update restricted fields
    if (hasPrivilegedRole) {
      for (const field of adminFields) {
        if (body[field] !== undefined) {
          updateFields[field] = body[field];
        }
      }
    }

    // If email is being updated, check uniqueness
    if (body.email && body.email.trim() !== existingUser.email) {
      const emailExists = await User.findOne({
        email: body.email.trim().toLowerCase(),
        _id: { $ne: id },
      });
      if (emailExists) {
        return apiError('Email already exists', 409);
      }
      updateFields.email = body.email.trim().toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');

    return apiResponse(updatedUser, 'User profile updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/[id] — Deactivate user (librarian/admin only — set status to inactive)
export async function DELETE(request, { params }) {
  return withRole(request, ['librarian', 'admin'], async (user) => {
    try {
      await connectDB();

      const { id } = await params;

      const existingUser = await User.findById(id);
      if (!existingUser) {
        return apiError('User not found', 404);
      }

      // Prevent self-deactivation
      if (user._id.toString() === id) {
        return apiError('You cannot deactivate your own account');
      }

      // Set status to inactive instead of deleting
      const deactivatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { status: 'inactive' } },
        { new: true }
      ).select('-password -resetPasswordToken -resetPasswordExpire');

      return apiResponse(deactivatedUser, 'User deactivated successfully');
    } catch (error) {
      return handleApiError(error);
    }
  });
}

import { connectDB } from '@/lib/db.js';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, password } = body;

    // Validate required fields
    if (!token) {
      return apiError('Reset token is required', 400);
    }
    if (!password || password.length < 6) {
      return apiError('Password must be at least 6 characters', 400);
    }

    // Verify token using verifyToken from jwt.js
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return apiError('Invalid or expired reset token', 400);
    }

    // Find user by decoded userId and check resetPasswordExpire
    const user = await User.findById(decoded.userId).select('+resetPasswordToken +resetPasswordExpire');
    if (!user) {
      return apiError('User not found', 404);
    }

    // Verify the stored token matches and hasn't expired
    if (user.resetPasswordToken !== token) {
      return apiError('Invalid reset token', 400);
    }

    if (!user.resetPasswordExpire || user.resetPasswordExpire < new Date()) {
      return apiError('Reset token has expired', 400);
    }

    // Update password (pre-save hook will hash it)
    user.password = password;

    // Clear resetPasswordToken and resetPasswordExpire
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return apiResponse(null, 'Password reset successful');
  } catch (error) {
    return handleApiError(error);
  }
}

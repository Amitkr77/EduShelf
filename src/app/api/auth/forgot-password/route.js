import { connectDB } from '@/lib/db.js';
import User from '@/models/User';
import { signResetToken } from '@/lib/jwt';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return apiError('Email is required', 400);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // For security, don't reveal whether the email exists
      return apiResponse(null, 'If an account with that email exists, a reset token has been generated.');
    }

    // Generate reset token using signResetToken from jwt.js
    const resetToken = signResetToken({ userId: user._id });

    // Store resetPasswordToken and resetPasswordExpire on user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    await user.save({ validateBeforeSave: false });

    // In production would email, but for now return the token in response
    return apiResponse({ resetToken }, 'If an account with that email exists, a reset token has been generated.');
  } catch (error) {
    return handleApiError(error);
  }
}

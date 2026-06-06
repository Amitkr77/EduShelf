import { connectDB } from '@/lib/db.js';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !email.trim()) {
      return apiError('Email is required', 400);
    }
    if (!password) {
      return apiError('Password is required', 400);
    }

    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return apiError('Invalid email or password', 401);
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return apiError('Invalid email or password', 401);
    }

    // Check user status — suspended users can't login
    if (user.status === 'suspended') {
      return apiError('Your account has been suspended. Please contact the library administrator.', 403);
    }

    // Sign JWT token with { userId, role }
    const token = signToken({ userId: user._id, role: user.role });

    // Set HTTP-only cookie with token and return user + token
    const response = apiResponse({ user, token }, 'Login successful');
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

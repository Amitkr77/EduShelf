import { connectDB } from '@/lib/db.js';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return apiError('Name is required', 400);
    }
    if (!email || !email.trim()) {
      return apiError('Email is required', 400);
    }
    if (!password || password.length < 6) {
      return apiError('Password must be at least 6 characters', 400);
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return apiError('Email already registered', 409);
    }

    // Create user with role 'student'
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
    });

    // Auto-sign JWT token
    const token = signToken({ userId: user._id, role: user.role });

    // Return user + token (password excluded by model toJSON)
    return apiResponse({ user, token }, 'Registration successful', true, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

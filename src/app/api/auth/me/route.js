import { authenticate } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/helpers';

export async function GET(request) {
  try {
    const user = await authenticate(request.headers);
    if (!user) {
      return apiError('Authentication required', 401);
    }

    // Return user data (password excluded by model toJSON)
    return apiResponse({ user }, 'User fetched successfully');
  } catch (error) {
    return apiError('Internal server error', 500);
  }
}

import { apiResponse } from '@/lib/helpers';

export async function POST() {
  // Clear the HTTP-only cookie
  const response = apiResponse(null, 'Logged out');
  response.cookies.set('token', '', { maxAge: 0, path: '/' });
  return response;
}

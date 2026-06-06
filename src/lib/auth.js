import { decodeToken } from './jwt.js';
import { connectDB } from './db.js';
import User from '@/models/User';

export async function authenticate(headers) {
  await connectDB();
  const decoded = decodeToken(headers);
  if (!decoded) return null;

  const user = await User.findById(decoded.userId).select('-password');
  if (!user || user.status === 'suspended') return null;

  return user;
}

export async function requireAuth(headers) {
  const user = await authenticate(headers);
  if (!user) {
    return { error: true, status: 401, message: 'Authentication required' };
  }
  return { error: false, user };
}

export async function requireRole(headers, roles) {
  const result = await requireAuth(headers);
  if (result.error) return result;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  if (!roleArray.includes(result.user.role)) {
    return { error: true, status: 403, message: 'Insufficient permissions' };
  }

  return result;
}

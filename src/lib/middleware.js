import { NextResponse } from 'next/server';
import { authenticate } from './auth';

export async function withAuth(request, handler) {
  const user = await authenticate(request.headers);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Authentication required', data: null },
      { status: 401 }
    );
  }
  return handler(user);
}

export async function withRole(request, roles, handler) {
  const user = await authenticate(request.headers);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Authentication required', data: null },
      { status: 401 }
    );
  }

  const roleArray = Array.isArray(roles) ? roles : [roles];
  if (!roleArray.includes(user.role)) {
    return NextResponse.json(
      { success: false, message: 'Insufficient permissions', data: null },
      { status: 403 }
    );
  }

  return handler(user);
}

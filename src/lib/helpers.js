import { NextResponse } from 'next/server';

export function apiResponse(data, message = '', success = true, status = 200) {
  return NextResponse.json({ success, message, data }, { status });
}

export function apiError(message, status = 400, errors = null) {
  return NextResponse.json(
    { success: false, message, data: errors },
    { status }
  );
}

export function handleApiError(error) {
  console.error('API Error:', error);

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return apiError(messages.join(', '), 400);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return apiError(`${field} already exists`, 409);
  }

  return apiError('Internal server error', 500);
}

export function parseQueryParams(request) {
  const { searchParams } = new URL(request.url);
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

export function paginateParams(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginateResponse(data, total, page, limit) {
  return {
    items: data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export const DAILY_FINE_RATE = 2;
export const BORROW_DURATION_DAYS = 14;
export const RESERVATION_EXPIRY_HOURS = 48;

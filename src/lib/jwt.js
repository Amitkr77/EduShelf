import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edushelf-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const JWT_RESET_EXPIRES_IN = '1h';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function signResetToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_RESET_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenFromHeaders(headers) {
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookieHeader = headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...v] = c.trim().split('=');
      return [key, v.join('=')];
    })
  );

  return cookies.token || null;
}

export function decodeToken(headers) {
  const token = getTokenFromHeaders(headers);
  if (!token) return null;
  return verifyToken(token);
}

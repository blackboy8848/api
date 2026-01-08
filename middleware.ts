import { NextRequest, NextResponse } from 'next/server';

// Allowed origins
const allowedOrigins = [
  'https://mountainmiragebackpackers.in',
  'https://www.mountainmiragebackpackers.in',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

// CORS headers helper
function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Check if origin is allowed
  if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (origin && process.env.NODE_ENV === 'development') {
    // Allow any origin in development
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const pathname = request.nextUrl.pathname;

  // Only apply CORS to API routes
  if (pathname.startsWith('/api')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const headers = getCorsHeaders(origin);
      return new NextResponse(null, {
        status: 200,
        headers,
      });
    }

    // For actual requests, we'll add CORS headers in the response
    // This is handled by the route handlers
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};


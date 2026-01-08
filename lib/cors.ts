import { NextResponse } from 'next/server';

// Allowed origins
const allowedOrigins = [
  'https://mountainmiragebackpackers.in',
  'https://www.mountainmiragebackpackers.in',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Add CORS headers to a NextResponse
 * @param response - The NextResponse object
 * @param origin - The origin from the request headers
 * @returns NextResponse with CORS headers added
 */
export function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  // Check if origin is allowed
  if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (origin && process.env.NODE_ENV === 'development') {
    // Allow any origin in development
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

/**
 * Create a CORS-enabled response
 * @param data - Response data
 * @param init - Response init options
 * @param origin - The origin from the request headers
 * @returns NextResponse with CORS headers
 */
export function corsResponse(
  data: any,
  init?: ResponseInit,
  origin?: string | null
): NextResponse {
  const response = NextResponse.json(data, init);
  return addCorsHeaders(response, origin || null);
}


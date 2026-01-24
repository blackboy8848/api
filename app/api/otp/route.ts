import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders } from '@/lib/cors';
import { sendOTPEmail } from '@/lib/email';

// In-memory storage for OTPs (in production, consider using Redis or database)
interface OTPData {
  otp: string;
  email: string;
  expiresAt: number;
}

const otpStorage = new Map<string, OTPData>();

// Clean up expired OTPs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStorage.entries()) {
    if (data.expiresAt < now) {
      otpStorage.delete(email);
    }
  }
}, 10 * 60 * 1000); // 10 minutes

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// POST - Generate and send OTP
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      const response = NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const response = NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      const response = NextResponse.json(
        { error: 'Email service not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Store OTP
    otpStorage.set(email.toLowerCase(), {
      otp,
      email: email.toLowerCase(),
      expiresAt,
    });

    // Send OTP via email
    try {
      console.log('=== Starting OTP Email Send ===');
      console.log('Recipient:', email);
      console.log('OTP:', otp);
      console.log('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM,
      });
      
      await sendOTPEmail(email, otp);
      
      console.log('=== OTP Email Send Completed Successfully ===');
    } catch (emailError: any) {
      console.error('=== Failed to send OTP email ===');
      console.error('Error type:', typeof emailError);
      console.error('Error code:', emailError?.code);
      console.error('Error command:', emailError?.command);
      console.error('Error response:', emailError?.response);
      console.error('Error responseCode:', emailError?.responseCode);
      console.error('Error message:', emailError?.message);
      console.error('Error stack:', emailError?.stack);
      console.error('Full error object:', JSON.stringify(emailError, Object.getOwnPropertyNames(emailError), 2));
      
      otpStorage.delete(email.toLowerCase()); // Remove OTP if email failed
      
      const errorMessage = emailError?.message || 'Unknown error occurred';
      const errorCode = emailError?.code || 'UNKNOWN';
      
      const response = NextResponse.json(
        { 
          error: 'Failed to send OTP email. Please check your SMTP configuration.', 
          details: errorMessage,
          code: errorCode,
          command: emailError?.command,
          response: emailError?.response,
        },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    // Return success response WITHOUT OTP for security
    // OTP is only sent via email, never returned in API response
    const response = NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully to your email',
        email: email,
        expiresIn: '10 minutes',
        note: 'Please check your email inbox for the OTP code',
      },
      { status: 200 }
    );
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    const response = NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

// GET - Verify OTP (optional endpoint for verification)
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const otp = searchParams.get('otp');

    if (!email || !otp) {
      const response = NextResponse.json(
        { 
          error: 'Email and OTP are required for verification',
          usage: {
            verify: 'GET /api/otp?email=user@example.com&otp=123456',
            send: 'POST /api/otp with body: { "email": "user@example.com" }'
          }
        },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    const storedData = otpStorage.get(email.toLowerCase());

    if (!storedData) {
      const response = NextResponse.json(
        { error: 'OTP not found or expired', valid: false },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    if (storedData.expiresAt < Date.now()) {
      otpStorage.delete(email.toLowerCase());
      const response = NextResponse.json(
        { error: 'OTP has expired', valid: false },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    if (storedData.otp !== otp) {
      const response = NextResponse.json(
        { error: 'Invalid OTP', valid: false },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // OTP is valid - remove it after verification
    otpStorage.delete(email.toLowerCase());

    const response = NextResponse.json(
      { message: 'OTP verified successfully', valid: true },
      { status: 200 }
    );
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    const response = NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

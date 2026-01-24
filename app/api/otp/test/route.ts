import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders } from '@/lib/cors';
import { verifyEmailConnection, sendOTPEmail } from '@/lib/email';

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET - Test SMTP connection
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    console.log('Testing SMTP connection...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***' : 'NOT SET');
    console.log('SMTP_FROM:', process.env.SMTP_FROM);

    const isConnected = await verifyEmailConnection();
    
    if (isConnected) {
      const response = NextResponse.json({
        success: true,
        message: 'SMTP connection successful',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM,
        }
      });
      return addCorsHeaders(response, origin);
    } else {
      const response = NextResponse.json({
        success: false,
        message: 'SMTP connection failed',
        error: 'Could not verify SMTP connection. Check your credentials and server settings.'
      }, { status: 500 });
      return addCorsHeaders(response, origin);
    }
  } catch (error: any) {
    console.error('SMTP test error:', error);
    const response = NextResponse.json({
      success: false,
      message: 'SMTP connection test failed',
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
      }
    }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}

// POST - Test sending email
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      const response = NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    const testOTP = '123456';
    await sendOTPEmail(email, testOTP);

    const response = NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      email: email,
      note: 'Check your inbox (and spam folder) for the test email'
    });
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    console.error('Test email error:', error);
    const response = NextResponse.json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
      }
    }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}

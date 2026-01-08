import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { User } from '@/types/database';
import bcrypt from 'bcrypt';
import { addCorsHeaders } from '@/lib/cors';

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET - Method not allowed (login requires POST)
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST method for login.' },
    { status: 405 }
  );
}

// POST - Login user with uid/email and password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, password } = body;

    const origin = request.headers.get('origin');

    // Validate input
    if (!password) {
      const response = NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    if (!uid && !email) {
      const response = NextResponse.json(
        { error: 'Either uid or email is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    const db = await pool.getConnection();

    // Find user by uid or email
    let query: string;
    let params: string[];

    if (uid) {
      query = 'SELECT * FROM users WHERE uid = ?';
      params = [uid];
    } else {
      query = 'SELECT * FROM users WHERE email = ?';
      params = [email];
    }

    const [rows] = await db.execute(query, params);
    const users = rows as User[];
    db.release();

    // Check if user exists
    if (Array.isArray(users) && users.length === 0) {
      const response = NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    const user = users[0];

    // Check if password is correct
    if (!user.password) {
      const response = NextResponse.json(
        { error: 'User has no password set', success: false },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    const isHashed = user.password.startsWith('$2a$') || 
                     user.password.startsWith('$2b$') || 
                     user.password.startsWith('$2y$');

    if (!isHashed) {
      // Password is stored as plain text - this is a security issue
      console.error(`SECURITY WARNING: User ${user.email} has plain text password stored in database`);
      const response = NextResponse.json(
        { 
          error: 'Account security issue detected. Please reset your password or contact support.',
          success: false 
        },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    // Compare plain password with hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      const response = NextResponse.json(
        { error: 'Invalid password', success: false },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // Password is correct - return success with user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    const origin = request.headers.get('origin');
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    }, { status: 200 });
    
    return addCorsHeaders(response, origin);

  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    
    const origin = request.headers.get('origin');
    
    // More specific error handling
    if (error.message?.includes('bcrypt')) {
      const response = NextResponse.json({
        error: 'Password verification error. Please contact support.',
        success: false
      }, { status: 500 });
      return addCorsHeaders(response, origin);
    }
    
    const response = NextResponse.json({
      error: error.message || 'Login failed',
      success: false
    }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}

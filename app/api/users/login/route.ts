import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { User } from '@/types/database';
import bcrypt from 'bcrypt';

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

    // Validate input
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!uid && !email) {
      return NextResponse.json(
        { error: 'Either uid or email is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      );
    }

    const user = users[0];

    // Check if password is correct
    if (!user.password) {
      return NextResponse.json(
        { error: 'User has no password set', success: false },
        { status: 400 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Invalid password', success: false },
        { status: 401 }
      );
    }

    // Password is correct - return success with user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({
      error: error.message || 'Login failed',
      success: false
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { User } from '@/types/database';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const saltRounds = 10;

// GET - Method not allowed (register requires POST)
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST method for registration.' },
    { status: 405 }
  );
}

// POST - Register new user
export async function POST(request: NextRequest) {
  try {
    const body: Partial<User> = await request.json();
    const { uid, email, password, display_name, phone, location, bio, avatar } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', success: false },
        { status: 400 }
      );
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', success: false },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long', success: false },
        { status: 400 }
      );
    }

    // Generate UID automatically if not provided
    const generatedUid = uid || randomUUID();

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const db = await pool.getConnection();
    
    // Check if email already exists
    const [existingUsers] = await db.execute(
      'SELECT uid FROM users WHERE email = ?',
      [email]
    );
    
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      db.release();
      return NextResponse.json(
        { error: 'User with this email already exists', success: false },
        { status: 409 }
      );
    }

    // Check if generated UID already exists (unlikely but handle it)
    const [existingUid] = await db.execute(
      'SELECT uid FROM users WHERE uid = ?',
      [generatedUid]
    );
    
    let finalUid = generatedUid;
    
    if (Array.isArray(existingUid) && existingUid.length > 0) {
      // Regenerate UID if collision occurs
      finalUid = randomUUID();
    }

    // Insert new user
    const [result] = await db.execute(
      `INSERT INTO users (uid, email, password, display_name, phone, location, bio, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUid,
        email,
        hashedPassword,
        display_name || 'Adventure Seeker',
        phone || null,
        location || null,
        bio || null,
        avatar || null
      ]
    );
    db.release();

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      uid: finalUid
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'User already exists', success: false },
        { status: 409 }
      );
    }
    
    return NextResponse.json({
      error: error.message || 'Registration failed',
      success: false
    }, { status: 500 });
  }
}


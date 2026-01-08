import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { User } from '@/types/database';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { addCorsHeaders } from '@/lib/cors';

const saltRounds = 10;

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET all users or single user by uid
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    const db = await pool.getConnection();

    if (uid) {
      // Get single user
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE uid = ?',
        [uid]
      );
      db.release();
      const users = rows as User[];
      if (Array.isArray(users) && users.length === 0) {
        const response = NextResponse.json({ error: 'User not found' }, { status: 404 });
        return addCorsHeaders(response, origin);
      }
      // Include hashed password in response
      const user = users[0];
      const { password, ...rest } = user;
      const responseData = {
        ...rest,
        hashedPassword: password || null
      };
      const response = NextResponse.json(responseData);
      return addCorsHeaders(response, origin);
    }

    // Get all users
    const [rows] = await db.execute('SELECT * FROM users ORDER BY join_date DESC');
    const users = rows as User[];
    db.release();
    // Include hashed password in response
    const usersWithHashedPassword = users.map(user => {
      const { password, ...rest } = user;
      return {
        ...rest,
        hashedPassword: password || null
      };
    });
    const response = NextResponse.json(usersWithHashedPassword);
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    console.error('Database error:', error);
    const response = NextResponse.json({
      error: error.message || 'Database connection error'
    }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const body: Partial<User> = await request.json();
    const { uid, email, password, display_name, phone, location, bio, avatar } = body;

    if (!email || !password) {
      const response = NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
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
      const response = NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      return addCorsHeaders(response, origin);
    }

    // Check if generated UID already exists (unlikely but handle it)
    const [existingUid] = await db.execute(
      'SELECT uid FROM users WHERE uid = ?',
      [generatedUid]
    );
    
    if (Array.isArray(existingUid) && existingUid.length > 0) {
      // Regenerate UID if collision occurs
      const newUid = randomUUID();
      const [result] = await db.execute(
        `INSERT INTO users (uid, email, password, display_name, phone, location, bio, avatar) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newUid, email, hashedPassword, display_name || 'Adventure Seeker', phone || null, location || null, bio || null, avatar || null]
      );
      db.release();
      const response1 = NextResponse.json({ message: 'User created successfully', uid: newUid }, { status: 201 });
      return addCorsHeaders(response1, origin);
    }

    const [result] = await db.execute(
      `INSERT INTO users (uid, email, password, display_name, phone, location, bio, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generatedUid, email, hashedPassword, display_name || 'Adventure Seeker', phone || null, location || null, bio || null, avatar || null]
    );
    db.release();

    const response = NextResponse.json({ message: 'User created successfully', uid: generatedUid }, { status: 201 });
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      const response = NextResponse.json({ error: 'User already exists' }, { status: 409 });
      return addCorsHeaders(response, origin);
    }
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const body: Partial<User> = await request.json();
    const { uid, ...updateFields } = body;

    if (!uid) {
      const response = NextResponse.json({ error: 'uid is required' }, { status: 400 });
      return addCorsHeaders(response, origin);
    }

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      const response = NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      return addCorsHeaders(response, origin);
    }

    // Hash password if it's being updated
    if (updateFields.password) {
      updateFields.password = await bcrypt.hash(updateFields.password, saltRounds);
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updateFields as any)[field]);

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `UPDATE users SET ${setClause} WHERE uid = ?`,
      [...values, uid]
    );
    db.release();

    const response = NextResponse.json({ message: 'User updated successfully', uid });
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      const response = NextResponse.json({ error: 'uid is required' }, { status: 400 });
      return addCorsHeaders(response, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM users WHERE uid = ?', [uid]);
    db.release();

    const response = NextResponse.json({ message: 'User deleted successfully' });
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}


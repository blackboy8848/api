import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { User } from '@/types/database';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const saltRounds = 10;

// GET all users or single user by uid
export async function GET(request: NextRequest) {
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
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      // Include hashed password in response
      const user = users[0];
      const { password, ...rest } = user;
      const response = {
        ...rest,
        hashedPassword: password || null
      };
      return NextResponse.json(response);
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
    return NextResponse.json(usersWithHashedPassword);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({
      error: error.message || 'Database connection error'
    }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body: Partial<User> = await request.json();
    const { uid, email, password, display_name, phone, location, bio, avatar } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
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
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
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
      return NextResponse.json({ message: 'User created successfully', uid: newUid }, { status: 201 });
    }

    const [result] = await db.execute(
      `INSERT INTO users (uid, email, password, display_name, phone, location, bio, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generatedUid, email, hashedPassword, display_name || 'Adventure Seeker', phone || null, location || null, bio || null, avatar || null]
    );
    db.release();

    return NextResponse.json({ message: 'User created successfully', uid: generatedUid }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<User> = await request.json();
    const { uid, ...updateFields } = body;

    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
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

    return NextResponse.json({ message: 'User updated successfully', uid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM users WHERE uid = ?', [uid]);
    db.release();

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { User } from '@/types/database';

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
      return NextResponse.json(users[0]);
    }

    // Get all users
    const [rows] = await db.execute('SELECT * FROM users ORDER BY join_date DESC');
    const users = rows as User[];
    db.release();
    return NextResponse.json(users);
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
    const body: User = await request.json();
    const { uid, email, display_name, phone, location, bio, avatar } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'uid and email are required' },
        { status: 400 }
      );
    }

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `INSERT INTO users (uid, email, display_name, phone, location, bio, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uid, email, display_name || 'Adventure Seeker', phone || null, location || null, bio || null, avatar || null]
    );
    db.release();

    return NextResponse.json({ message: 'User created successfully', uid }, { status: 201 });
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


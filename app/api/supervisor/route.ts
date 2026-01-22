import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { SuperUser, NavigationPermissions } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// OPTIONS - Handle preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET - List all super users or get single super user by id or user_id
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const email = searchParams.get('email');
    const is_active = searchParams.get('is_active');

    const db = await pool.getConnection();

    let query = 'SELECT * FROM super_users WHERE 1=1';
    const params: (string | number)[] = [];

    if (id) {
      query += ' AND id = ?';
      params.push(parseInt(id));
    }
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    if (email) {
      query += ' AND email = ?';
      params.push(email);
    }
    if (is_active !== null && is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    const superUsers = rows as SuperUser[];

    // Parse JSON navigation_permissions if it's a string
    const parsedUsers = superUsers.map((user) => {
      if (typeof user.navigation_permissions === 'string') {
        try {
          user.navigation_permissions = JSON.parse(user.navigation_permissions) as NavigationPermissions;
        } catch (e) {
          // If parsing fails, keep as is
        }
      }
      // Convert is_active from number to boolean for response
      return {
        ...user,
        is_active: user.is_active === 1 || user.is_active === true,
      };
    });

    db.release();

    // If single query parameter, return single object; otherwise return array
    if (id || (user_id && !email && is_active === null)) {
      const res = NextResponse.json(parsedUsers[0] || null);
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json(parsedUsers);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// POST - Create new super user
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body: Partial<SuperUser> = await request.json();
    const { user_id, email, display_name, is_active, navigation_permissions } = body;

    if (!user_id || !email) {
      const res = NextResponse.json({ error: 'user_id and email are required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    // Validate navigation_permissions
    if (!navigation_permissions) {
      const res = NextResponse.json(
        { error: 'navigation_permissions is required' },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();

    // Convert navigation_permissions to JSON string if it's an object
    const permissionsJson =
      typeof navigation_permissions === 'string'
        ? navigation_permissions
        : JSON.stringify(navigation_permissions);

    // Convert is_active boolean to number (1 or 0)
    const activeStatus = is_active === true || is_active === 1 ? 1 : 0;

    const [result] = await db.execute(
      `INSERT INTO super_users (user_id, email, display_name, is_active, navigation_permissions)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, email, display_name || null, activeStatus, permissionsJson]
    );

    db.release();

    const insertResult = result as { insertId?: number };
    const id = insertResult?.insertId;

    const res = NextResponse.json({ message: 'Super user created successfully', id }, { status: 201 });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    // Handle duplicate entry error
    if (err?.message?.includes('Duplicate entry')) {
      const res = NextResponse.json(
        { error: 'Super user with this user_id or email already exists' },
        { status: 409 }
      );
      return addCorsHeaders(res, origin);
    }
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// PUT - Update super user
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body: Partial<SuperUser> = await request.json();
    const { id, user_id, email, display_name, is_active, navigation_permissions } = body;

    if (!id && !user_id) {
      const res = NextResponse.json(
        { error: 'id or user_id is required to update' },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();

    // Build dynamic update query
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (display_name !== undefined) {
      updates.push('display_name = ?');
      params.push(display_name || null);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active === true || is_active === 1 ? 1 : 0);
    }
    if (navigation_permissions !== undefined) {
      updates.push('navigation_permissions = ?');
      const permissionsJson =
        typeof navigation_permissions === 'string'
          ? navigation_permissions
          : JSON.stringify(navigation_permissions);
      params.push(permissionsJson);
    }

    if (updates.length === 0) {
      db.release();
      const res = NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    // Determine WHERE clause
    const whereClause = id ? 'id = ?' : 'user_id = ?';
    const whereValue = id || user_id;
    params.push(whereValue as string | number);

    const query = `UPDATE super_users SET ${updates.join(', ')} WHERE ${whereClause}`;

    const [result] = await db.execute(query, params);
    const updateResult = result as { affectedRows?: number };

    db.release();

    if (updateResult.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Super user not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Super user updated successfully' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// DELETE - Delete super user
export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id && !user_id) {
      const res = NextResponse.json(
        { error: 'id or user_id is required to delete' },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();

    const whereClause = id ? 'id = ?' : 'user_id = ?';
    const whereValue = id ? parseInt(id) : user_id;

    const [result] = await db.execute(`DELETE FROM super_users WHERE ${whereClause}`, [whereValue]);
    const deleteResult = result as { affectedRows?: number };

    db.release();

    if (deleteResult.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Super user not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Super user deleted successfully' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { addCorsHeaders } from '@/lib/cors';
import type { User, SuperUser, NavigationPermissions } from '@/types/database';

export const dynamic = 'force-dynamic';

// OPTIONS - Handle preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// POST - Super user login (email + password)
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      const res = NextResponse.json(
        { error: 'Email is required', success: false },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    if (!password) {
      const res = NextResponse.json(
        { error: 'Password is required', success: false },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const res = NextResponse.json(
        { error: 'Invalid email format', success: false },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();

    // Find user by email
    const [userRows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    const users = userRows as User[];

    if (!Array.isArray(users) || users.length === 0) {
      db.release();
      const res = NextResponse.json(
        { error: 'Invalid email or password', success: false },
        { status: 401 }
      );
      return addCorsHeaders(res, origin);
    }

    const user = users[0];

    if (!user.password) {
      db.release();
      const res = NextResponse.json(
        { error: 'Account has no password set. Please use registration with OTP.', success: false },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      db.release();
      const res = NextResponse.json(
        { error: 'Invalid email or password', success: false },
        { status: 401 }
      );
      return addCorsHeaders(res, origin);
    }

    // Check that this user is an active super user
    const [superRows] = await db.execute(
      'SELECT * FROM super_users WHERE user_id = ? AND is_active = 1',
      [user.uid]
    );
    db.release();

    const superUsers = superRows as SuperUser[];
    if (!Array.isArray(superUsers) || superUsers.length === 0) {
      const res = NextResponse.json(
        { error: 'Access denied. This account is not an active super user.', success: false },
        { status: 403 }
      );
      return addCorsHeaders(res, origin);
    }

    const superUser = superUsers[0];
    let navPerms = superUser.navigation_permissions;
    if (typeof navPerms === 'string') {
      try {
        navPerms = JSON.parse(navPerms) as NavigationPermissions;
      } catch {
        navPerms = {};
      }
    }

    const { password: _, ...userWithoutPassword } = user;

    const res = NextResponse.json(
      {
        success: true,
        message: 'Super user login successful',
        user: userWithoutPassword,
        supervisor: {
          id: superUser.id,
          user_id: superUser.user_id,
          email: superUser.email,
          display_name: superUser.display_name ?? user.display_name,
          is_active: superUser.is_active === 1 || superUser.is_active === true,
          navigation_permissions: navPerms,
          created_at: superUser.created_at,
          updated_at: superUser.updated_at,
        },
      },
      { status: 200 }
    );
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Supervisor login error:', err);
    const res = NextResponse.json(
      { error: err?.message || 'Login failed', success: false },
      { status: 500 }
    );
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

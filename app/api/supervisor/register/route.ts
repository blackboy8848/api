import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { addCorsHeaders } from '@/lib/cors';
import { verifyAndConsumeOTP } from '@/lib/otp';
import type { NavigationPermissions } from '@/types/database';

export const dynamic = 'force-dynamic';

const saltRounds = 10;

/** Default navigation permissions for newly registered super users (full access). */
const DEFAULT_SUPERVISOR_PERMISSIONS: NavigationPermissions = {
  my_events: true,
  leads: { enabled: true, channel_leads: true, missed_checkouts: true },
  bookings: {
    enabled: true,
    all_bookings: true,
    transactions: true,
    settlements: true,
    customers: true,
    refunds: true,
  },
  calendar: true,
  coupons: true,
  operations: true,
  oneinbox: true,
  onelink: true,
  instagram: true,
  whatsapp: true,
  pickup_points: true,
  analytics: { enabled: true, lead_analytics: true, booking_analytics: true },
  policies: true,
  settings: true,
  user_management: true,
};

// OPTIONS - Handle preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// POST - Super user registration (email + OTP + password)
// Step 1: User requests OTP via POST /api/otp with { "email": "..." }
// Step 2: User submits this endpoint with email, otp, password, display_name (optional)
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const { email, otp, password, display_name } = body;

    if (!email) {
      const res = NextResponse.json(
        { error: 'Email is required', success: false },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    if (!otp) {
      const res = NextResponse.json(
        { error: 'OTP is required. Request one via POST /api/otp with your email.', success: false },
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

    if (password.length < 6) {
      const res = NextResponse.json(
        { error: 'Password must be at least 6 characters long', success: false },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const valid = verifyAndConsumeOTP(email.trim(), String(otp).trim());
    if (!valid) {
      const res = NextResponse.json(
        { error: 'Invalid or expired OTP. Please request a new code via POST /api/otp.', success: false },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const db = await pool.getConnection();

    try {
      // Check if already a super user
      const [existingSuper] = await db.execute(
        'SELECT id FROM super_users WHERE email = ?',
        [normalizedEmail]
      );
      const existingSuperArr = existingSuper as { id: number }[];
      if (Array.isArray(existingSuperArr) && existingSuperArr.length > 0) {
        const res = NextResponse.json(
          { error: 'A super user with this email already exists.', success: false },
          { status: 409 }
        );
        return addCorsHeaders(res, origin);
      }

      // Find or create user in users table
      const [userRows] = await db.execute(
        'SELECT uid, email, display_name FROM users WHERE email = ?',
        [normalizedEmail]
      );
      const userRowsArr = userRows as { uid: string; email: string; display_name?: string }[];

      let uid: string;
      if (Array.isArray(userRowsArr) && userRowsArr.length > 0) {
        uid = userRowsArr[0].uid;
        // Update password and optionally display_name if user already existed
        await db.execute(
          'UPDATE users SET password = ?, display_name = COALESCE(?, display_name), updated_at = CURRENT_TIMESTAMP WHERE uid = ?',
          [hashedPassword, display_name?.trim() || null, uid]
        );
      } else {
        uid = randomUUID();
        await db.execute(
          `INSERT INTO users (uid, email, password, display_name) VALUES (?, ?, ?, ?)`,
          [uid, normalizedEmail, hashedPassword, display_name?.trim() || 'Super User']
        );
      }

      const permissionsJson = JSON.stringify(DEFAULT_SUPERVISOR_PERMISSIONS);
      await db.execute(
        `INSERT INTO super_users (user_id, email, display_name, is_active, navigation_permissions)
         VALUES (?, ?, ?, 1, ?)`,
        [uid, normalizedEmail, display_name?.trim() || null, permissionsJson]
      );

      db.release();

      const res = NextResponse.json(
        {
          success: true,
          message: 'Super user registered successfully. You can now log in.',
          uid,
          email: normalizedEmail,
          display_name: display_name?.trim() || null,
        },
        { status: 201 }
      );
      return addCorsHeaders(res, origin);
    } catch (dbError: unknown) {
      db.release();
      const err = dbError as { code?: string; message?: string };
      if (err?.code === 'ER_DUP_ENTRY') {
        const res = NextResponse.json(
          { error: 'A super user with this email or user already exists.', success: false },
          { status: 409 }
        );
        return addCorsHeaders(res, origin);
      }
      throw dbError;
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Supervisor register error:', err);
    const res = NextResponse.json(
      { error: err?.message || 'Registration failed', success: false },
      { status: 500 }
    );
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

/**
 * Enterprise DB helpers: transactions and audit logging.
 * - Always use runWithTransaction for booking-related operations.
 * - Always log to audit_logs for CREATE, UPDATE, CANCEL, REFUND, ADJUSTMENT.
 */

import type { Connection } from 'mysql2/promise';
import pool from '@/lib/db';
import type { AuditEntityType, AuditActionType } from '@/types/database';
import { randomUUID } from 'crypto';

/**
 * Get a connection and start a transaction. Caller must commit/rollback and release.
 * Usage:
 *   const db = await getConnectionWithTransaction();
 *   try {
 *     // ... work ...
 *     await db.commit();
 *   } catch (e) {
 *     await db.rollback();
 *     throw e;
 *   } finally {
 *     db.release();
 *   }
 */
export async function getConnectionWithTransaction(): Promise<Connection> {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  return conn;
}

/**
 * Run a function inside a single DB transaction. On success commits and returns the result.
 * On failure rolls back, releases, and rethrows. Always releases the connection in finally.
 */
export async function runWithTransaction<T>(
  fn: (conn: Connection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export interface AuditLogInsert {
  entity_type: AuditEntityType | string;
  entity_id: string;
  action_type: AuditActionType | string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  performed_by?: string | null;
}

/**
 * Insert one row into audit_logs. Use parameterized query. Id is generated if not provided.
 */
export async function insertAuditLog(
  conn: Connection,
  payload: AuditLogInsert & { id?: string }
): Promise<void> {
  const id = payload.id ?? randomUUID();
  await conn.execute(
    `INSERT INTO audit_logs (id, entity_type, entity_id, action_type, old_data, new_data, performed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.entity_type,
      payload.entity_id,
      payload.action_type,
      payload.old_data != null ? JSON.stringify(payload.old_data) : null,
      payload.new_data != null ? JSON.stringify(payload.new_data) : null,
      payload.performed_by ?? null,
    ]
  );
}

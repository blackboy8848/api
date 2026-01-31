/**
 * Shared OTP storage and verification for use by /api/otp and /api/supervisor/register.
 * In production, consider using Redis or a database table for OTP storage.
 */

export interface OTPData {
  otp: string;
  email: string;
  expiresAt: number;
}

const otpStorage = new Map<string, OTPData>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP for an email. Overwrites any existing OTP for that email.
 */
export function setOTP(email: string, otp: string, expiresAt?: number): void {
  const key = email.toLowerCase().trim();
  otpStorage.set(key, {
    otp,
    email: key,
    expiresAt: expiresAt ?? Date.now() + OTP_TTL_MS,
  });
}

/**
 * Verify OTP for an email. If valid, consumes the OTP (removes it) and returns true.
 * Returns false if OTP missing, expired, or incorrect.
 */
export function verifyAndConsumeOTP(email: string, otp: string): boolean {
  const key = email.toLowerCase().trim();
  const stored = otpStorage.get(key);

  if (!stored) return false;
  if (stored.expiresAt < Date.now()) {
    otpStorage.delete(key);
    return false;
  }
  if (stored.otp !== otp) return false;

  otpStorage.delete(key);
  return true;
}

/**
 * Remove OTP for an email (e.g. when send fails so user can request again).
 */
export function deleteOTP(email: string): void {
  otpStorage.delete(email.toLowerCase().trim());
}

/**
 * Get OTP TTL in milliseconds (for callers that need to set expiresAt)
 */
export function getOTPTTLMs(): number {
  return OTP_TTL_MS;
}

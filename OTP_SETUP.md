# OTP Service Setup Guide

## Overview

The OTP (One-Time Password) service allows you to send verification codes via email. It generates a random 6-digit code and sends it to the user's email address.

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# SMTP Configuration for OTP Service
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-mountainmiragebackpackers.in
SMTP_PASSWORD=your-email-password
SMTP_FROM=your-mountainmiragebackpackers.in
```

### 2. Email Credentials

Based on your Hostinger email configuration:
- **SMTP Host:** `smtp.hostinger.com`
- **SMTP Port:** `465`
- **Security:** SSL/TLS enabled
- **Email:** Your Hostinger email address (e.g., `info@mountainmiragebackpackers.in`)
- **Password:** Your email account password

## API Endpoints

### Generate and Send OTP

**POST** `/api/otp`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "email": "user@example.com",
  "expiresIn": "10 minutes",
  "note": "Please check your email inbox for the OTP code"
}
```

**Security:** The OTP is **never** returned in the API response. It is only sent via email for security purposes.

### Verify OTP

**GET** `/api/otp?email={email}&otp={otp}`

**Response:**
```json
{
  "message": "OTP verified successfully",
  "valid": true
}
```

## Features

- ✅ Generates random 6-digit OTP
- ✅ Sends OTP via email with HTML template
- ✅ OTP expires after 10 minutes
- ✅ **Secure:** OTP is never returned in API response (only sent via email)
- ✅ Automatic cleanup of expired OTPs
- ✅ Email validation
- ✅ Error handling for SMTP failures

## Testing

1. Make sure your `.env.local` file has the correct SMTP credentials
2. Start your development server: `npm run dev`
3. Test the endpoint:

```bash
curl -X POST http://localhost:3000/api/otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

4. Check the response - it should confirm the OTP was sent (OTP is NOT in the response for security)
5. Check the email inbox for the OTP email

## Security Notes

- ✅ **OTP is never returned in API response** - Only sent via email for maximum security
- OTPs are stored in memory and automatically expire after 10 minutes
- For production, consider using Redis or a database for OTP storage
- Rate limiting should be implemented to prevent abuse
- OTPs are case-sensitive and single-use (deleted after verification)

## Troubleshooting

### Email not sending

1. Verify SMTP credentials in `.env.local`
2. Check that your email account allows SMTP access
3. Verify the SMTP host and port are correct
4. Check server logs for detailed error messages

### OTP not found

- OTPs expire after 10 minutes
- Each email can only have one active OTP at a time
- Make sure you're using the correct email address (case-insensitive)

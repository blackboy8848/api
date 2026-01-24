import nodemailer from 'nodemailer';

// Determine if we should use secure (SSL) or STARTTLS
const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const useSecure = smtpPort === 465; // Port 465 uses SSL, 587 uses STARTTLS

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: smtpPort,
  secure: useSecure, // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER, // Your email address
    pass: process.env.SMTP_PASSWORD, // Your email password
  },
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false,
  },
  debug: true, // Enable debug output
  logger: true, // Log to console
});

/**
 * Send OTP email to user
 * @param to - Recipient email address
 * @param otp - The OTP code to send
 * @returns Promise<boolean> - true if email sent successfully
 */
export async function sendOTPEmail(to: string, otp: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER, // Sender address
      to: to, // Recipient address
      subject: 'Your OTP Code', // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">One-Time Password (OTP)</h2>
          <p style="color: #666; font-size: 16px;">Your OTP code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
    };

    console.log(`Attempting to send OTP email to: ${to}`);
    console.log(`From: ${process.env.SMTP_FROM || process.env.SMTP_USER}`);
    console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`SMTP Port: ${process.env.SMTP_PORT}`);

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Accepted recipients:', info.accepted);
    console.log('Rejected recipients:', info.rejected);
    
    if (info.rejected && info.rejected.length > 0) {
      console.error('Email was rejected for:', info.rejected);
      throw new Error(`Email rejected: ${info.rejected.join(', ')}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error sending OTP email:');
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Verify SMTP connection
 * @returns Promise<boolean> - true if connection is successful
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP server is ready to send emails');
    return true;
  } catch (error) {
    console.error('SMTP connection error:', error);
    return false;
  }
}

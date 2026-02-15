import nodemailer from 'nodemailer'
import { brand } from './brand'

// Configure email transporter
// In production, use proper SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Send OTP to the USER's email (the address they typed in the form).
 * SMTP_USER/SMTP_FROM are only the SENDER – the recipient is always the user's email.
 */
export async function sendOTPEmail(userEmail: string, otp: string) {
  if (!userEmail?.includes('@')) {
    console.error('[Email] Invalid recipient:', userEmail)
    return false
  }
  const mailOptions = {
    from: process.env.SMTP_FROM || brand.emailFrom,
    to: userEmail,
    subject: `${brand.appName} - Email Verification OTP`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Email Verification</h2>
        <p>Your OTP for ${brand.appName} is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || brand.emailFrom,
    to: email,
    subject: `Welcome to ${brand.appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Welcome to ${brand.appName}, ${name}!</h2>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
          <li>Access training materials</li>
          <li>View available projects</li>
          <li>Build your network</li>
          <li>Track your performance and rewards</li>
        </ul>
        <p>Login to get started: <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Login</a></p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return false
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
  
  const mailOptions = {
    from: process.env.SMTP_FROM || brand.emailFrom,
    to: email,
    subject: `${brand.appName} - Password Reset`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

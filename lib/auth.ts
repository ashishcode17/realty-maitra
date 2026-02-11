import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface JWTPayload {
  userId: string
  email?: string
  role: string
  tokenVersion?: number // if missing, treat as 0 for backward compatibility
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function generateToken(userId: string, role: string, tokenVersion: number = 0): string {
  return jwt.sign({ userId, role, tokenVersion }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): { userId: string; role: string; tokenVersion?: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; tokenVersion?: number }
  } catch {
    return null
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateSponsorCode(): string {
  return nanoid(8).toUpperCase()
}

export function hashOTP(otp: string): string {
  return bcrypt.hashSync(otp, 10)
}

export function compareOTP(otp: string, hash: string): boolean {
  return bcrypt.compareSync(otp, hash)
}

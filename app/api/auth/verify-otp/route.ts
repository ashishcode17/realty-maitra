import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compareOTP, generateToken, generateShortInviteCode } from '@/lib/auth'
import { getRoleRank } from '@/lib/roles'
import { handleApiError } from '@/lib/error-handler'
import { checkOtpVerifyRateLimit } from '@/lib/rateLimit'
import { sendWelcomeEmail } from '@/lib/email'
import { createAuditLog, getClientIp } from '@/lib/audit'
import { markInviteUsedAndRegenerate, ensureActiveInviteForUser } from '@/lib/invite'

export async function POST(request: NextRequest) {
  try {
    const rate = checkOtpVerifyRateLimit(request)
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: 'Too many attempts',
          message: 'Please try again later',
          code: 'RATE_LIMIT',
          retryAfter: rate.retryAfter,
        },
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { email, otp } = body
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const otpStr = typeof otp === 'string' ? otp.trim() : ''

    if (!emailStr || !otpStr) {
      return NextResponse.json(
        { error: 'Email and OTP are required', code: 'MISSING_FIELDS' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (otpStr.length !== 6 || !/^\d+$/.test(otpStr)) {
      return NextResponse.json(
        { error: 'Invalid OTP format', code: 'INVALID_OTP' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const record = await prisma.otpVerification.findFirst({
      where: { identifier: emailStr, purpose: 'REGISTER' },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json(
        { error: 'OTP expired or not found', code: 'OTP_EXPIRED' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'OTP expired', code: 'OTP_EXPIRED' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const valid = compareOTP(otpStr, record.otpHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid OTP', code: 'INVALID_OTP' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let meta: { pendingUserId?: string; isDirectorSeed?: boolean; createdByDirectorId?: string | null } = {}
    try {
      meta = record.meta ? JSON.parse(record.meta) : {}
    } catch {
      meta = {}
    }
    const pendingUserId = meta.pendingUserId
    const isDirectorSeed = meta.isDirectorSeed === true
    const createdByDirectorId = meta.createdByDirectorId ?? null
    if (!pendingUserId) {
      return NextResponse.json(
        { error: 'Registration data not found', code: 'INVALID_STATE' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const pendingUser = await prisma.user.findUnique({
      where: { id: pendingUserId },
      include: { sponsor: { select: { sponsorCode: true } } },
    })

    if (!pendingUser || !pendingUser.email.startsWith('pending_')) {
      await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'Registration expired', code: 'OTP_EXPIRED' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const actualEmail = pendingUser.email.replace(/^pending_/, '')
    const invitedBySponsorCode = pendingUser.sponsorCodeUsed ?? pendingUser.sponsor?.sponsorCode ?? null
    const invitedByUserId = pendingUser.sponsorId ?? createdByDirectorId
    const joinTimestamp = new Date()

    const role = pendingUser.role ?? 'BDM'
    const rank = pendingUser.rank ?? 'BDM'
    const isRootAdmin = role === 'SUPER_ADMIN' || rank === 'ADMIN'

    let newUser: { id: string; name: string; email: string; role: string; rank: string; sponsorCode: string | null; performanceRank?: string }
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        newUser = await prisma.user.create({
          data: {
            name: pendingUser.name,
            email: actualEmail,
            phone: pendingUser.phone,
            city: pendingUser.city,
            passwordHash: pendingUser.passwordHash,
            role,
            roleRank: getRoleRank(role),
            sponsorId: pendingUser.sponsorId,
            path: pendingUser.path ?? [],
            rank,
            performanceRank: 'R5',
            treeId: null,
            createdByDirectorId: isDirectorSeed ? createdByDirectorId : null,
            createdViaInviteType: isDirectorSeed ? 'DIRECTOR_SEED' : null,
            sponsorCode: generateShortInviteCode(5),
            sponsorCodeUsed: invitedBySponsorCode,
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: joinTimestamp,
            phoneVerified: true,
            phoneVerifiedAt: joinTimestamp,
          },
        })
        break
      } catch (e: unknown) {
        const isUniqueViolation = (e as { code?: string })?.code === 'P2002'
        if (isUniqueViolation && attempt < 9) continue
        throw e
      }
    }
    if (!newUser!) throw new Error('User creation failed')

    let treeIdUpdate: string | null = null
    if (isRootAdmin || isDirectorSeed) {
      treeIdUpdate = newUser.id
    } else if (pendingUser.sponsorId) {
      const sponsor = await prisma.user.findUnique({
        where: { id: pendingUser.sponsorId },
        select: { treeId: true, id: true },
      })
      treeIdUpdate = sponsor?.treeId ?? sponsor?.id ?? null
    }
    if (treeIdUpdate) {
      await prisma.user.update({
        where: { id: newUser.id },
        data: { treeId: treeIdUpdate },
      })
    }

    if (invitedBySponsorCode && !isRootAdmin) {
      await markInviteUsedAndRegenerate({
        inviteCodeUsed: invitedBySponsorCode,
        usedByUserId: newUser.id,
      }).catch((e) => console.error('Invite regenerate error:', e))
    }
    if (isRootAdmin) {
      await ensureActiveInviteForUser(newUser.id).catch(() => {})
    }

    await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {})
    await prisma.user.delete({ where: { id: pendingUserId } }).catch(() => {})

    await createAuditLog({
      actorUserId: newUser.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      metaJson: {
        invitedByUserId,
        invitedBySponsorCode,
        joinTimestamp: joinTimestamp.toISOString(),
      },
      ip: getClientIp(request),
    }).catch(() => {})

    sendWelcomeEmail(actualEmail, newUser.name).catch(() => {})

    const token = generateToken(newUser.id, newUser.role, (newUser as { tokenVersion?: number }).tokenVersion ?? 0)

    return NextResponse.json(
      {
        message: 'Registration successful',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          rank: newUser.rank,
          sponsorCode: newUser.sponsorCode ?? '',
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    return handleApiError(error, 'Verify OTP')
  }
}

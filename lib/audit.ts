import { prisma } from './prisma'

export type AuditAction =
  | 'USER_CREATED'
  | 'ROLE_CHANGE'
  | 'SPONSOR_REASSIGN'
  | 'USER_STATUS_CHANGE'
  | 'REFERRAL_CODE_REGENERATED'
  | 'EARNINGS_CREATE'
  | 'EARNINGS_UPDATE'
  | 'EARNINGS_STATUS_CHANGE'
  | 'CHALLENGE_COMPLETION_APPROVE'
  | 'CHALLENGE_COMPLETION_REJECT'
  | 'TRAINING_CONTENT_UPLOAD'
  | 'TRAINING_CONTENT_DELETE'
  | 'NOTIFICATION_CREATE'
  | 'NOTIFICATION_UPDATE'
  | 'NOTIFICATION_DELETE'
  | 'LEAD_ASSIGN'
  | 'LEAD_STAGE_CHANGE'
  | 'LOGIN'
  | 'LOGOUT_ALL'

export interface AuditMeta {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  reason?: string
  [key: string]: unknown
}

/**
 * Create an audit log entry. Use from API routes after critical actions.
 * Does not throw; logs errors to console.
 */
export async function createAuditLog(params: {
  actorUserId: string
  action: string
  entityType: string
  entityId?: string | null
  metaJson?: AuditMeta | null
  ip?: string | null
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metaJson: params.metaJson ? JSON.stringify(params.metaJson) : null,
        ip: params.ip ?? null,
      },
    })
  } catch (err) {
    console.error('Audit log create failed:', err)
  }
}

/** Get client IP from request (best effort) */
export function getClientIp(request: Request): string | null {
  const headers = request.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    null
  )
}

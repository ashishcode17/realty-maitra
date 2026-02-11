-- AlterEnum: Add FROZEN to UserStatus
ALTER TYPE "UserStatus" ADD VALUE 'FROZEN';

-- AlterTable AuditLog: add ip
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ip" TEXT;

-- AlterTable ChallengeEnrollment: proof + verification
ALTER TABLE "ChallengeEnrollment" ADD COLUMN IF NOT EXISTS "proofFilePath" TEXT;
ALTER TABLE "ChallengeEnrollment" ADD COLUMN IF NOT EXISTS "proofNote" TEXT;
ALTER TABLE "ChallengeEnrollment" ADD COLUMN IF NOT EXISTS "proofSubmittedAt" TIMESTAMP(3);
ALTER TABLE "ChallengeEnrollment" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Earnings: isVerified
ALTER TABLE "Earnings" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Lead: nextFollowUpAt
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextFollowUpAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "PerformanceRank" AS ENUM ('R0', 'R1', 'R2', 'R3', 'R4', 'R5');

-- AlterTable User: add new columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "performanceRank" "PerformanceRank" NOT NULL DEFAULT 'R5';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "treeId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdByDirectorId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdViaInviteType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "idImageUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "idImageUploadedAt" TIMESTAMP(3);

-- CreateTable InviteCodeRecord
CREATE TABLE IF NOT EXISTS "InviteCodeRecord" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteCodeRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InviteCodeRecord_code_key" ON "InviteCodeRecord"("code");
CREATE INDEX IF NOT EXISTS "InviteCodeRecord_userId_idx" ON "InviteCodeRecord"("userId");
CREATE INDEX IF NOT EXISTS "InviteCodeRecord_code_idx" ON "InviteCodeRecord"("code");

ALTER TABLE "InviteCodeRecord" DROP CONSTRAINT IF EXISTS "InviteCodeRecord_userId_fkey";
ALTER TABLE "InviteCodeRecord" ADD CONSTRAINT "InviteCodeRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PayoutLedger
CREATE TABLE IF NOT EXISTS "PayoutLedger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "pct" DOUBLE PRECISION NOT NULL,
    "rankAtTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PayoutLedger_userId_idx" ON "PayoutLedger"("userId");
CREATE INDEX IF NOT EXISTS "PayoutLedger_bookingId_idx" ON "PayoutLedger"("bookingId");

ALTER TABLE "PayoutLedger" DROP CONSTRAINT IF EXISTS "PayoutLedger_userId_fkey";
ALTER TABLE "PayoutLedger" ADD CONSTRAINT "PayoutLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes on User
CREATE INDEX IF NOT EXISTS "User_treeId_idx" ON "User"("treeId");
CREATE INDEX IF NOT EXISTS "User_createdByDirectorId_idx" ON "User"("createdByDirectorId");

-- Backfill InviteCodeRecord: one active record per user who has sponsorCode
INSERT INTO "InviteCodeRecord" ("id", "code", "userId", "usedAt", "usedByUserId", "createdAt")
SELECT 'bf_' || "id" || '_' || substr(md5(COALESCE("sponsorCode", '')), 1, 8), "sponsorCode", "id", NULL, NULL, "createdAt"
FROM "User"
WHERE "sponsorCode" IS NOT NULL AND "sponsorCode" != ''
ON CONFLICT ("code") DO NOTHING;

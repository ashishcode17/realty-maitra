-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DIRECTOR', 'VP', 'AVP', 'SSM', 'SM', 'BDM', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'UPCOMING', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('PLOTS', 'VILLAS', 'COMMERCIAL', 'APARTMENTS', 'MIXED');

-- CreateEnum
CREATE TYPE "EarningsStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "TrainingContentType" AS ENUM ('PDF', 'VIDEO', 'DOCUMENT', 'QUIZ');

-- CreateEnum
CREATE TYPE "TrainingContentCategory" AS ENUM ('ONBOARDING', 'SALES', 'PROJECTS', 'COMPLIANCE', 'SCRIPTS', 'TOOLS');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'SITE_VISIT', 'FOLLOW_UP', 'CONVERTED', 'LOST');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BDM',
    "roleRank" INTEGER NOT NULL DEFAULT 6,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerifiedAt" TIMESTAMP(3),
    "sponsorId" TEXT,
    "path" TEXT[],
    "sponsorCode" TEXT,
    "lastActive" TIMESTAMP(3),
    "roleAssignedBy" TEXT,
    "roleAssignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'UPCOMING',
    "description" TEXT,
    "media" TEXT[],
    "documents" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlabConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "directorPct" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "vpPct" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
    "avpPct" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "ssmPct" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "smPct" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    "bdmPct" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
    "uplineBonus1Pct" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "uplineBonus2Pct" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SlabConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earnings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bookingId" TEXT,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "slabPct" DOUBLE PRECISION NOT NULL,
    "calculatedAmount" DOUBLE PRECISION NOT NULL,
    "uplineBonus1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uplineBonus2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "EarningsStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedBy" TEXT,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "TrainingContentCategory" NOT NULL,
    "type" "TrainingContentType" NOT NULL,
    "url" TEXT,
    "filePath" TEXT,
    "description" TEXT,
    "projectId" TEXT,
    "roleVisibility" "UserRole"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "TrainingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "location" TEXT,
    "meetingLink" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "slotCapacity" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingBooking" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "requirementsJson" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "OfferChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeEnrollment" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressJson" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "ChallengeEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "link" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "projectInterestId" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "assignedToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_sponsorCode_key" ON "User"("sponsorCode");

-- CreateIndex
CREATE INDEX "User_sponsorId_idx" ON "User"("sponsorId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_type_idx" ON "Project"("type");

-- CreateIndex
CREATE INDEX "SlabConfig_projectId_idx" ON "SlabConfig"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SlabConfig_projectId_key" ON "SlabConfig"("projectId");

-- CreateIndex
CREATE INDEX "Earnings_userId_idx" ON "Earnings"("userId");

-- CreateIndex
CREATE INDEX "Earnings_projectId_idx" ON "Earnings"("projectId");

-- CreateIndex
CREATE INDEX "Earnings_status_idx" ON "Earnings"("status");

-- CreateIndex
CREATE INDEX "Earnings_createdAt_idx" ON "Earnings"("createdAt");

-- CreateIndex
CREATE INDEX "TrainingContent_category_idx" ON "TrainingContent"("category");

-- CreateIndex
CREATE INDEX "TrainingContent_type_idx" ON "TrainingContent"("type");

-- CreateIndex
CREATE INDEX "TrainingContent_projectId_idx" ON "TrainingContent"("projectId");

-- CreateIndex
CREATE INDEX "TrainingContent_isActive_idx" ON "TrainingContent"("isActive");

-- CreateIndex
CREATE INDEX "TrainingSession_startDate_idx" ON "TrainingSession"("startDate");

-- CreateIndex
CREATE INDEX "TrainingSession_isActive_idx" ON "TrainingSession"("isActive");

-- CreateIndex
CREATE INDEX "TrainingBooking_userId_idx" ON "TrainingBooking"("userId");

-- CreateIndex
CREATE INDEX "TrainingBooking_sessionId_idx" ON "TrainingBooking"("sessionId");

-- CreateIndex
CREATE INDEX "TrainingBooking_status_idx" ON "TrainingBooking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBooking_sessionId_userId_key" ON "TrainingBooking"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "OfferChallenge_isActive_idx" ON "OfferChallenge"("isActive");

-- CreateIndex
CREATE INDEX "OfferChallenge_startDate_idx" ON "OfferChallenge"("startDate");

-- CreateIndex
CREATE INDEX "OfferChallenge_endDate_idx" ON "OfferChallenge"("endDate");

-- CreateIndex
CREATE INDEX "ChallengeEnrollment_userId_idx" ON "ChallengeEnrollment"("userId");

-- CreateIndex
CREATE INDEX "ChallengeEnrollment_challengeId_idx" ON "ChallengeEnrollment"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeEnrollment_status_idx" ON "ChallengeEnrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeEnrollment_challengeId_userId_key" ON "ChallengeEnrollment"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "Notification_isActive_idx" ON "Notification"("isActive");

-- CreateIndex
CREATE INDEX "Notification_isGlobal_idx" ON "Notification"("isGlobal");

-- CreateIndex
CREATE INDEX "Notification_targetUserId_idx" ON "Notification"("targetUserId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_assignedToUserId_idx" ON "Lead"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_projectInterestId_idx" ON "Lead"("projectInterestId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlabConfig" ADD CONSTRAINT "SlabConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earnings" ADD CONSTRAINT "Earnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earnings" ADD CONSTRAINT "Earnings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingContent" ADD CONSTRAINT "TrainingContent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingContent" ADD CONSTRAINT "TrainingContent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBooking" ADD CONSTRAINT "TrainingBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBooking" ADD CONSTRAINT "TrainingBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferChallenge" ADD CONSTRAINT "OfferChallenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeEnrollment" ADD CONSTRAINT "ChallengeEnrollment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "OfferChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeEnrollment" ADD CONSTRAINT "ChallengeEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_projectInterestId_fkey" FOREIGN KEY ("projectInterestId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

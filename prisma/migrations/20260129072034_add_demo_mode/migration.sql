/*
  Warnings:

  - A unique constraint covering the columns `[slotId,userId]` on the table `TrainingBooking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slotId` to the `TrainingBooking` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TrainingBooking_sessionId_userId_key";

-- AlterTable
ALTER TABLE "ChallengeEnrollment" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Earnings" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OfferChallenge" ADD COLUMN     "bannerFileName" TEXT,
ADD COLUMN     "bannerFilePath" TEXT,
ADD COLUMN     "bannerFileSize" INTEGER,
ADD COLUMN     "bannerFileType" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProjectDocument" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SlabConfig" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TrainingBooking" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slotId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrainingContent" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TrainingSession" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TrainingCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TrainingCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSlot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileDownloadLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "fileKind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FileDownloadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingCompletion_userId_idx" ON "TrainingCompletion"("userId");

-- CreateIndex
CREATE INDEX "TrainingCompletion_contentId_idx" ON "TrainingCompletion"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCompletion_userId_contentId_key" ON "TrainingCompletion"("userId", "contentId");

-- CreateIndex
CREATE INDEX "TrainingSlot_sessionId_idx" ON "TrainingSlot"("sessionId");

-- CreateIndex
CREATE INDEX "TrainingSlot_startTime_idx" ON "TrainingSlot"("startTime");

-- CreateIndex
CREATE INDEX "FileDownloadLog_userId_idx" ON "FileDownloadLog"("userId");

-- CreateIndex
CREATE INDEX "FileDownloadLog_fileId_idx" ON "FileDownloadLog"("fileId");

-- CreateIndex
CREATE INDEX "FileDownloadLog_createdAt_idx" ON "FileDownloadLog"("createdAt");

-- CreateIndex
CREATE INDEX "TrainingBooking_slotId_idx" ON "TrainingBooking"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBooking_slotId_userId_key" ON "TrainingBooking"("slotId", "userId");

-- AddForeignKey
ALTER TABLE "TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "TrainingContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSlot" ADD CONSTRAINT "TrainingSlot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBooking" ADD CONSTRAINT "TrainingBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TrainingSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileDownloadLog" ADD CONSTRAINT "FileDownloadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

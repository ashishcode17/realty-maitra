-- CreateTable
CREATE TABLE "UserLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "rank" TEXT,
    "role" TEXT,
    "treeId" TEXT,
    "profileImageUrl" TEXT,
    "govtIdImageUrl" TEXT,
    "inviterUserId" TEXT,
    "inviterCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserLedger_userId_idx" ON "UserLedger"("userId");
CREATE INDEX "UserLedger_eventType_idx" ON "UserLedger"("eventType");
CREATE INDEX "UserLedger_timestamp_idx" ON "UserLedger"("timestamp");
CREATE INDEX "UserLedger_treeId_idx" ON "UserLedger"("treeId");

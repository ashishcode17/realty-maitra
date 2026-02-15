-- AlterTable
ALTER TABLE "User" ADD COLUMN "clerkUserId" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

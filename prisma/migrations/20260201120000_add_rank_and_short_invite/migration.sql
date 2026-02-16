-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('ADMIN', 'DIRECTOR', 'VP', 'SSM', 'SM', 'BDM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "rank" "Rank" NOT NULL DEFAULT 'BDM';

-- CreateIndex
CREATE INDEX "User_rank_idx" ON "User"("rank");

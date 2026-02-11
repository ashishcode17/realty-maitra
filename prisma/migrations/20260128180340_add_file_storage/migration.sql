/*
  Warnings:

  - The values [QUIZ] on the enum `TrainingContentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `url` on the `TrainingContent` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TrainingContentType_new" AS ENUM ('PDF', 'VIDEO', 'DOCUMENT', 'PPT', 'DOCX', 'XLS', 'IMAGE');
ALTER TABLE "TrainingContent" ALTER COLUMN "type" TYPE "TrainingContentType_new" USING ("type"::text::"TrainingContentType_new");
ALTER TYPE "TrainingContentType" RENAME TO "TrainingContentType_old";
ALTER TYPE "TrainingContentType_new" RENAME TO "TrainingContentType";
DROP TYPE "TrainingContentType_old";
COMMIT;

-- AlterTable
ALTER TABLE "TrainingContent" DROP COLUMN "url",
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "uploadedAt" TIMESTAMP(3),
ADD COLUMN     "uploadedBy" TEXT,
ADD COLUMN     "videoEmbedUrl" TEXT;

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_idx" ON "ProjectDocument"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

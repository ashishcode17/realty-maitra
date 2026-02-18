-- CreateTable
CREATE TABLE "GovIdStorage" (
    "userId" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovIdStorage_pkey" PRIMARY KEY ("userId")
);

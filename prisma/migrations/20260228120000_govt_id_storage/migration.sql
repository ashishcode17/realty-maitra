-- CreateTable
CREATE TABLE "govt_id_storage" (
    "userId" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "govt_id_storage_pkey" PRIMARY KEY ("userId")
);

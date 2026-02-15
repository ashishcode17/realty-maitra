-- AlterTable User: add sponsorCodeUsed (audit: invite code used at sign-up)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsorCodeUsed" TEXT;

-- CreateTable OtpVerification (OTP for REGISTER and LOGIN flows)
CREATE TABLE IF NOT EXISTS "OtpVerification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "meta" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OtpVerification_identifier_purpose_idx" ON "OtpVerification"("identifier", "purpose");
CREATE INDEX IF NOT EXISTS "OtpVerification_expiresAt_idx" ON "OtpVerification"("expiresAt");

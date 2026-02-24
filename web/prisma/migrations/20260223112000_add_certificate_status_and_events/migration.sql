-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('active', 'revoked');

-- CreateEnum
CREATE TYPE "CertificateEventType" AS ENUM ('issued', 'reissued', 'revoked', 'restored');

-- AlterTable
ALTER TABLE "Certificate"
ADD COLUMN "status" "CertificateStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "revokedReason" TEXT;

-- CreateTable
CREATE TABLE "CertificateEvent" (
    "id" UUID NOT NULL,
    "certificateId" UUID NOT NULL,
    "actorUserId" UUID,
    "actorRole" "UserRole",
    "eventType" "CertificateEventType" NOT NULL,
    "previousCode" TEXT,
    "nextCode" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Certificate_status_issuedAt_idx" ON "Certificate"("status", "issuedAt");

-- CreateIndex
CREATE INDEX "CertificateEvent_certificateId_createdAt_idx" ON "CertificateEvent"("certificateId", "createdAt");

-- CreateIndex
CREATE INDEX "CertificateEvent_actorUserId_createdAt_idx" ON "CertificateEvent"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "CertificateEvent" ADD CONSTRAINT "CertificateEvent_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateEvent" ADD CONSTRAINT "CertificateEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

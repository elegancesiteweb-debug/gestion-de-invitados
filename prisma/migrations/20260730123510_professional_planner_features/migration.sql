-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('ADMIN', 'COLLABORATOR');

-- CreateEnum
CREATE TYPE "LeadQuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER');

-- AlterTable
ALTER TABLE "EventVendor" ADD COLUMN     "clientApproved" BOOLEAN;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "intakeAnswers" JSONB;

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "brandColor" TEXT,
ADD COLUMN     "brandLogo" BYTEA,
ADD COLUMN     "brandLogoType" TEXT,
ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "leadIntakeToken" TEXT,
ADD COLUMN     "notifyByEmail" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'COLLABORATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadQuestion" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "LeadQuestionType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientComment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");

-- CreateIndex
CREATE INDEX "TeamMember_organizerId_idx" ON "TeamMember"("organizerId");

-- CreateIndex
CREATE INDEX "LeadQuestion_organizerId_idx" ON "LeadQuestion"("organizerId");

-- CreateIndex
CREATE INDEX "ClientComment_eventId_idx" ON "ClientComment"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_leadIntakeToken_key" ON "Organizer"("leadIntakeToken");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadQuestion" ADD CONSTRAINT "LeadQuestion_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientComment" ADD CONSTRAINT "ClientComment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;


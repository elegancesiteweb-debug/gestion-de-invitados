-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'PLANNER');

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "eventsCreatedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AccessCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "usedByOrganizerId" TEXT,

    CONSTRAINT "AccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_code_key" ON "AccessCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_usedByOrganizerId_key" ON "AccessCode"("usedByOrganizerId");

-- AddForeignKey
ALTER TABLE "AccessCode" ADD CONSTRAINT "AccessCode_usedByOrganizerId_fkey" FOREIGN KEY ("usedByOrganizerId") REFERENCES "Organizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "AccessCode" ADD COLUMN     "durationMonths" INTEGER;

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "accessExpiresAt" TIMESTAMP(3);


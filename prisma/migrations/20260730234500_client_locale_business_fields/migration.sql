-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "estimatedBudget" DOUBLE PRECISION,
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "partnerName" TEXT,
ADD COLUMN     "tentativeDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "businessEmail" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'es';


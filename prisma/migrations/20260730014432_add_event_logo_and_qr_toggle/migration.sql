-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "logoImage" BYTEA,
ADD COLUMN     "logoImageType" TEXT,
ADD COLUMN     "showQrOnConfirmation" BOOLEAN NOT NULL DEFAULT true;

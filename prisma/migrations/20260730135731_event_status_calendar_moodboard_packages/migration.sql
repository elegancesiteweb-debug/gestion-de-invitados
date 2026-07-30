-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImageSource" AS ENUM ('ORGANIZER', 'CLIENT');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "calendarToken" TEXT,
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE "StyleGuideImage" ADD COLUMN     "uploadedBy" "ImageSource" NOT NULL DEFAULT 'ORGANIZER';

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Package_organizerId_idx" ON "Package"("organizerId");

-- CreateIndex
CREATE INDEX "PackageItem_packageId_idx" ON "PackageItem"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_calendarToken_key" ON "Event"("calendarToken");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;


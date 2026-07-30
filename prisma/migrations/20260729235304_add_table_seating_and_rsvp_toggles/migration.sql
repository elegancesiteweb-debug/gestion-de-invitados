/*
  Warnings:

  - You are about to drop the column `dressCode` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `mapUrl` on the `Event` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TableShape" AS ENUM ('ROUND', 'RECT');

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "dressCode",
DROP COLUMN "mapUrl",
ADD COLUMN     "askDietaryOnRsvp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "askMessageOnRsvp" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "tableId" TEXT;

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shape" "TableShape" NOT NULL DEFAULT 'ROUND',
    "seats" INTEGER NOT NULL DEFAULT 8,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Table_eventId_idx" ON "Table"("eventId");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

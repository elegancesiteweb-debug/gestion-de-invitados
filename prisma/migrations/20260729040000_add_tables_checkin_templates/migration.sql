-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "messageTemplate" TEXT,
ADD COLUMN     "showTableOnRsvp" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "tableName" TEXT,
ADD COLUMN     "checkinToken" TEXT NOT NULL,
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedInPasses" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Guest_checkinToken_key" ON "Guest"("checkinToken");

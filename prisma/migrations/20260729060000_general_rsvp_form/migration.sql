-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "publicRsvpToken" TEXT,
ADD COLUMN     "generalMaxCompanions" INTEGER NOT NULL DEFAULT 5;

-- CreateIndex
CREATE UNIQUE INDEX "Event_publicRsvpToken_key" ON "Event"("publicRsvpToken");

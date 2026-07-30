-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "floorPlanData" JSONB,
ADD COLUMN     "floorPlanImage" BYTEA,
ADD COLUMN     "floorPlanImageType" TEXT;

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "masterCalendarToken" TEXT;

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLogEntry" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractTemplate_organizerId_idx" ON "ContractTemplate"("organizerId");

-- CreateIndex
CREATE INDEX "ActivityLogEntry_eventId_idx" ON "ActivityLogEntry"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_masterCalendarToken_key" ON "Organizer"("masterCalendarToken");

-- AddForeignKey
ALTER TABLE "ContractTemplate" ADD CONSTRAINT "ContractTemplate_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLogEntry" ADD CONSTRAINT "ActivityLogEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AlterTable
-- vendorsPortalToken se agrega nullable primero para poder rellenar las filas
-- existentes (no hay DEFAULT a nivel de columna para @default(cuid()), solo en Prisma Client).
ALTER TABLE "Event" ADD COLUMN     "totalBudget" DOUBLE PRECISION,
ADD COLUMN     "vendorsPortalToken" TEXT;

UPDATE "Event" SET "vendorsPortalToken" = md5(random()::text || clock_timestamp()::text || "id") WHERE "vendorsPortalToken" IS NULL;

ALTER TABLE "Event" ALTER COLUMN "vendorsPortalToken" SET NOT NULL;

-- CreateTable
CREATE TABLE "VendorItineraryItem" (
    "id" TEXT NOT NULL,
    "eventVendorId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorItineraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorComment" (
    "id" TEXT NOT NULL,
    "eventVendorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorItineraryItem_eventVendorId_idx" ON "VendorItineraryItem"("eventVendorId");

-- CreateIndex
CREATE INDEX "VendorComment_eventVendorId_idx" ON "VendorComment"("eventVendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_vendorsPortalToken_key" ON "Event"("vendorsPortalToken");

-- AddForeignKey
ALTER TABLE "VendorItineraryItem" ADD CONSTRAINT "VendorItineraryItem_eventVendorId_fkey" FOREIGN KEY ("eventVendorId") REFERENCES "EventVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorComment" ADD CONSTRAINT "VendorComment_eventVendorId_fkey" FOREIGN KEY ("eventVendorId") REFERENCES "EventVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;


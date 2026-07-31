-- AlterTable
-- confirmationToken se agrega nullable primero para poder rellenar las filas
-- existentes (no hay DEFAULT a nivel de columna para @default(cuid()), solo en Prisma Client).
ALTER TABLE "EventVendor" ADD COLUMN     "confirmationToken" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "vendorConfirmed" BOOLEAN;

UPDATE "EventVendor" SET "confirmationToken" = md5(random()::text || clock_timestamp()::text || "id") WHERE "confirmationToken" IS NULL;

ALTER TABLE "EventVendor" ALTER COLUMN "confirmationToken" SET NOT NULL;

-- CreateTable
CREATE TABLE "EventDocument" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file" BYTEA NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatisfactionSurvey" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "wouldRecommend" BOOLEAN,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SatisfactionSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventDocument_eventId_idx" ON "EventDocument"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SatisfactionSurvey_eventId_key" ON "SatisfactionSurvey"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventVendor_confirmationToken_key" ON "EventVendor"("confirmationToken");

-- AddForeignKey
ALTER TABLE "EventDocument" ADD CONSTRAINT "EventDocument_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisfactionSurvey" ADD CONSTRAINT "SatisfactionSurvey_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;


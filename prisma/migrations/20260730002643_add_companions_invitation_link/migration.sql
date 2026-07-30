-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "askCompanionNamesOnRsvp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invitationLinkUrl" TEXT;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "invitationLinkUrl" TEXT;

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attending" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Companion_guestId_idx" ON "Companion"("guestId");

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

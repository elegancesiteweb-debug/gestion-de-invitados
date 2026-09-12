-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "loginCode" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_loginCode_key" ON "Organizer"("loginCode");


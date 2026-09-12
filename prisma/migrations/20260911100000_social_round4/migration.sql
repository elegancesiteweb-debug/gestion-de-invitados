-- AlterEnum
ALTER TYPE "SocialMediaType" ADD VALUE 'AUDIO';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "socialCoupleImage" BYTEA,
ADD COLUMN     "socialCoupleImageType" TEXT,
ADD COLUMN     "socialCoverImage" BYTEA,
ADD COLUMN     "socialCoverImageType" TEXT;


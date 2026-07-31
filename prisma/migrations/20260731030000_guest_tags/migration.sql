-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];


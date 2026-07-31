-- AlterTable
ALTER TABLE "ProposalComment" ADD COLUMN     "imageId" TEXT;

-- CreateIndex
CREATE INDEX "ProposalComment_imageId_idx" ON "ProposalComment"("imageId");

-- AddForeignKey
ALTER TABLE "ProposalComment" ADD CONSTRAINT "ProposalComment_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ProposalImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;


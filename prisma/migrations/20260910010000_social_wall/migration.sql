-- CreateEnum
CREATE TYPE "SocialMediaType" AS ENUM ('PHOTO', 'VIDEO');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "socialToken" TEXT;

-- CreateTable
CREATE TABLE "SocialIdentity" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "guestId" TEXT,
    "deviceToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "type" "SocialMediaType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "caption" TEXT,
    "hiddenFromProjection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialStory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "type" "SocialMediaType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialIdentity_deviceToken_key" ON "SocialIdentity"("deviceToken");

-- CreateIndex
CREATE INDEX "SocialIdentity_eventId_idx" ON "SocialIdentity"("eventId");

-- CreateIndex
CREATE INDEX "SocialPost_eventId_idx" ON "SocialPost"("eventId");

-- CreateIndex
CREATE INDEX "SocialPost_identityId_idx" ON "SocialPost"("identityId");

-- CreateIndex
CREATE INDEX "SocialStory_eventId_idx" ON "SocialStory"("eventId");

-- CreateIndex
CREATE INDEX "SocialStory_identityId_idx" ON "SocialStory"("identityId");

-- CreateIndex
CREATE INDEX "SocialLike_postId_idx" ON "SocialLike"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLike_postId_identityId_key" ON "SocialLike"("postId", "identityId");

-- CreateIndex
CREATE INDEX "SocialComment_postId_idx" ON "SocialComment"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_socialToken_key" ON "Event"("socialToken");

-- AddForeignKey
ALTER TABLE "SocialIdentity" ADD CONSTRAINT "SocialIdentity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "SocialIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialStory" ADD CONSTRAINT "SocialStory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialStory" ADD CONSTRAINT "SocialStory_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "SocialIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialLike" ADD CONSTRAINT "SocialLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialLike" ADD CONSTRAINT "SocialLike_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "SocialIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "SocialIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;


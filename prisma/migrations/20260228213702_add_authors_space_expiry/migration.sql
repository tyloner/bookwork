-- CreateEnum
CREATE TYPE "SpaceRule" AS ENUM ('ACTIVE_READERS_ONLY', 'SPOILER_EXPULSION');

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "expiryDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "rules" "SpaceRule"[] DEFAULT ARRAY[]::"SpaceRule"[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "favoriteAuthors" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "SpaceExtensionVote" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpaceExtensionVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpaceExtensionVote_spaceId_idx" ON "SpaceExtensionVote"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceExtensionVote_spaceId_userId_key" ON "SpaceExtensionVote"("spaceId", "userId");

-- AddForeignKey
ALTER TABLE "SpaceExtensionVote" ADD CONSTRAINT "SpaceExtensionVote_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceExtensionVote" ADD CONSTRAINT "SpaceExtensionVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "TvShow" ADD COLUMN     "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "TvShow" ADD CONSTRAINT "TvShow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

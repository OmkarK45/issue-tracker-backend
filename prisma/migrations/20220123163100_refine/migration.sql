/*
  Warnings:

  - Added the required column `createdById` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "website" TEXT;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - Changed the type of `priority` on the `Issue` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PriorityType" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "priority",
ADD COLUMN     "priority" "PriorityType" NOT NULL;

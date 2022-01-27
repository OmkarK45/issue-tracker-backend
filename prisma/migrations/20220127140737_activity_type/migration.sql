/*
  Warnings:

  - Added the required column `type` to the `IssueActivity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'UPDATED', 'CLOSED', 'REOPENED', 'ASSIGNED', 'UNASSIGNED', 'COMMENTED', 'DELETED');

-- AlterTable
ALTER TABLE "IssueActivity" ADD COLUMN     "type" "ActivityType" NOT NULL;

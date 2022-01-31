/*
  Warnings:

  - A unique constraint covering the columns `[userId,issueId]` on the table `IssuesOnUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "IssuesOnUser_userId_issueId_key" ON "IssuesOnUser"("userId", "issueId");

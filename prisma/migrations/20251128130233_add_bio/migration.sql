/*
  Warnings:

  - You are about to drop the column `bioString` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "bioString",
ADD COLUMN     "bio" TEXT;

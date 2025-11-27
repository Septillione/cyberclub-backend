/*
  Warnings:

  - The `status` column on the `Tournament` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `description` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `format` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `formatVersus` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rules` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('announced', 'registrationOpened', 'registrationClosed', 'live', 'finished', 'cancelled');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "address" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentParticipants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "format" TEXT NOT NULL,
ADD COLUMN     "formatVersus" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "prizeFirst" TEXT,
ADD COLUMN     "prizeSecond" TEXT,
ADD COLUMN     "prizeThird" TEXT,
ADD COLUMN     "rules" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TournamentStatus" NOT NULL DEFAULT 'announced';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "tournamentsPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tournamentsWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "winrate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

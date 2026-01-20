/*
  Warnings:

  - The primary key for the `GameRound` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `GameRound` table. All the data in the column will be lost.
  - You are about to drop the column `finishedAt` on the `GameSession` table. All the data in the column will be lost.
  - The primary key for the `PlayerStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `nonce` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PlayerStats_userId_key";

-- DropIndex
DROP INDEX "User_userId_key";

-- AlterTable
ALTER TABLE "GameRound" DROP CONSTRAINT "GameRound_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "GameRound_pkey" PRIMARY KEY ("gameSessionId", "roundNumber");

-- AlterTable
ALTER TABLE "GameSession" DROP COLUMN "finishedAt";

-- AlterTable
ALTER TABLE "PlayerStats" DROP CONSTRAINT "PlayerStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "nonce",
DROP COLUMN "userId";

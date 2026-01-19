/*
  Warnings:

  - You are about to drop the column `result` on the `GameRound` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GameRound" DROP COLUMN "result",
ADD COLUMN     "loserId" TEXT;

-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "totalRounds" INTEGER NOT NULL DEFAULT 0;

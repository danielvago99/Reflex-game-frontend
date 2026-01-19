/*
  Warnings:

  - The values [waiting,expired] on the enum `SessionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `AmbassadorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `totalReferrals` on the `AmbassadorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `totalReflexEarned` on the `AmbassadorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `totalSolBonus` on the `AmbassadorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `DailyChallengeProgress` table. All the data in the column will be lost.
  - You are about to drop the column `rewardClaimed` on the `DailyChallengeProgress` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `GameSession` table. All the data in the column will be lost.
  - You are about to drop the column `lobbyId` on the `GameSession` table. All the data in the column will be lost.
  - You are about to drop the column `roundNumber` on the `GameSession` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `GameSession` table. All the data in the column will be lost.
  - You are about to drop the column `averageReactionMs` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `bestReactionMs` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `bestStreak` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `currentStreak` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `freeStakes005` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `freeStakes010` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `freeStakes020` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `totalReflexPoints` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `totalSolWagered` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PlayerStats` table. All the data in the column will be lost.
  - You are about to alter the column `winRate` on the `PlayerStats` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `totalSolWon` on the `PlayerStats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,6)` to `Decimal(18,9)`.
  - You are about to drop the column `activatedAt` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `deactivatedAt` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `referrerId` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `WeeklyStreak` table. All the data in the column will be lost.
  - You are about to drop the column `currentStreakDays` on the `WeeklyStreak` table. All the data in the column will be lost.
  - You are about to drop the column `lastActiveDate` on the `WeeklyStreak` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyRewardClaimed` on the `WeeklyStreak` table. All the data in the column will be lost.
  - You are about to drop the `GameLobby` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameMatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GamePlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeaderboardEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LobbyPlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReferralReward` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,date]` on the table `DailyChallengeProgress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `matchType` to the `GameSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ambassadorId` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Made the column `weekStartDate` on table `WeeklyStreak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weekEndDate` on table `WeeklyStreak` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('friend', 'ranked');

-- CreateEnum
CREATE TYPE "RoundResult" AS ENUM ('win', 'lose', 'draw');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdrawal', 'game_stake', 'game_payout', 'game_refund', 'referral_bonus', 'challenge_reward');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'confirmed', 'failed');

-- AlterEnum
BEGIN;
CREATE TYPE "SessionStatus_new" AS ENUM ('active', 'completed', 'cancelled', 'disputed');
ALTER TABLE "public"."GameSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "GameSession" ALTER COLUMN "status" TYPE "SessionStatus_new" USING ("status"::text::"SessionStatus_new");
ALTER TYPE "SessionStatus" RENAME TO "SessionStatus_old";
ALTER TYPE "SessionStatus_new" RENAME TO "SessionStatus";
DROP TYPE "public"."SessionStatus_old";
ALTER TABLE "GameSession" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- DropForeignKey
ALTER TABLE "GameLobby" DROP CONSTRAINT "GameLobby_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "GameMatch" DROP CONSTRAINT "GameMatch_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "GameMatch" DROP CONSTRAINT "GameMatch_winningPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayer" DROP CONSTRAINT "GamePlayer_matchId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayer" DROP CONSTRAINT "GamePlayer_userId_fkey";

-- DropForeignKey
ALTER TABLE "GameResult" DROP CONSTRAINT "GameResult_loserId_fkey";

-- DropForeignKey
ALTER TABLE "GameResult" DROP CONSTRAINT "GameResult_matchId_fkey";

-- DropForeignKey
ALTER TABLE "GameResult" DROP CONSTRAINT "GameResult_winnerId_fkey";

-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_lobbyId_fkey";

-- DropForeignKey
ALTER TABLE "LeaderboardEntry" DROP CONSTRAINT "LeaderboardEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "LobbyPlayer" DROP CONSTRAINT "LobbyPlayer_lobbyId_fkey";

-- DropForeignKey
ALTER TABLE "LobbyPlayer" DROP CONSTRAINT "LobbyPlayer_userId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referrerId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralReward" DROP CONSTRAINT "ReferralReward_ambassadorId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralReward" DROP CONSTRAINT "ReferralReward_referralId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralReward" DROP CONSTRAINT "ReferralReward_referredId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralReward" DROP CONSTRAINT "ReferralReward_referrerId_fkey";

-- DropIndex
DROP INDEX "DailyChallengeProgress_date_idx";

-- DropIndex
DROP INDEX "DailyChallengeProgress_userId_key";

-- DropIndex
DROP INDEX "Referral_referrerId_referredId_key";

-- DropIndex
DROP INDEX "WeeklyStreak_userId_key";

-- AlterTable
ALTER TABLE "AmbassadorProfile" DROP COLUMN "createdAt",
DROP COLUMN "totalReferrals",
DROP COLUMN "totalReflexEarned",
DROP COLUMN "totalSolBonus",
ADD COLUMN     "totalInvited" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DailyChallengeProgress" DROP COLUMN "createdAt",
DROP COLUMN "rewardClaimed",
ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "GameSession" DROP COLUMN "endedAt",
DROP COLUMN "lobbyId",
DROP COLUMN "roundNumber",
DROP COLUMN "startedAt",
ADD COLUMN     "avgLoserReaction" DECIMAL(10,2),
ADD COLUMN     "avgWinnerReaction" DECIMAL(10,2),
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "loserId" TEXT,
ADD COLUMN     "matchType" "MatchType" NOT NULL,
ADD COLUMN     "payout" DECIMAL(18,9) NOT NULL DEFAULT 0,
ADD COLUMN     "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stakeLoser" DECIMAL(18,9) NOT NULL DEFAULT 0,
ADD COLUMN     "stakeWinner" DECIMAL(18,9) NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "PlayerStats" DROP COLUMN "averageReactionMs",
DROP COLUMN "bestReactionMs",
DROP COLUMN "bestStreak",
DROP COLUMN "createdAt",
DROP COLUMN "currentStreak",
DROP COLUMN "freeStakes005",
DROP COLUMN "freeStakes010",
DROP COLUMN "freeStakes020",
DROP COLUMN "totalReflexPoints",
DROP COLUMN "totalSolWagered",
DROP COLUMN "updatedAt",
ADD COLUMN     "avgReaction" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bestReaction" DECIMAL(10,2) NOT NULL DEFAULT 9999,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalSolLost" DECIMAL(18,9) NOT NULL DEFAULT 0,
ADD COLUMN     "totalVolumeSolPlayed" DECIMAL(18,9) NOT NULL DEFAULT 0,
ALTER COLUMN "winRate" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "totalSolWon" SET DATA TYPE DECIMAL(18,9);

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "activatedAt",
DROP COLUMN "deactivatedAt",
DROP COLUMN "referrerId",
ADD COLUMN     "ambassadorId" TEXT NOT NULL,
ADD COLUMN     "totalMatches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "updatedAt",
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastSessionAt" TIMESTAMP(3),
ADD COLUMN     "nonce" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "WeeklyStreak" DROP COLUMN "createdAt",
DROP COLUMN "currentStreakDays",
DROP COLUMN "lastActiveDate",
DROP COLUMN "weeklyRewardClaimed",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentDailyStreak" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "weekStartDate" SET NOT NULL,
ALTER COLUMN "weekStartDate" SET DATA TYPE DATE,
ALTER COLUMN "weekEndDate" SET NOT NULL,
ALTER COLUMN "weekEndDate" SET DATA TYPE DATE;

-- DropTable
DROP TABLE "GameLobby";

-- DropTable
DROP TABLE "GameMatch";

-- DropTable
DROP TABLE "GamePlayer";

-- DropTable
DROP TABLE "GameResult";

-- DropTable
DROP TABLE "LeaderboardEntry";

-- DropTable
DROP TABLE "LobbyPlayer";

-- DropTable
DROP TABLE "ReferralReward";

-- DropEnum
DROP TYPE "LobbyMode";

-- DropEnum
DROP TYPE "LobbyStatus";

-- DropEnum
DROP TYPE "PlayerMatchResult";

-- DropEnum
DROP TYPE "RewardType";

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameSessionId" TEXT,
    "amount" DECIMAL(18,9) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "winnerId" TEXT,
    "winnerReaction" INTEGER,
    "loserReaction" INTEGER,
    "result" "RoundResult" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reflexPoints" INTEGER NOT NULL DEFAULT 0,
    "totalFreeStakes" INTEGER NOT NULL DEFAULT 0,
    "freeStakes05Sol" INTEGER NOT NULL DEFAULT 0,
    "freeStakes01Sol" INTEGER NOT NULL DEFAULT 0,
    "freeStakes02Sol" INTEGER NOT NULL DEFAULT 0,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStreakUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerRewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardPlayer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "avgReaction" DECIMAL(10,2) NOT NULL,
    "matchesPlayed" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "totalSolWon" DECIMAL(18,9) NOT NULL,
    "totalVolumeSolPlayed" DECIMAL(18,9) NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardAmbassador" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "AmbassadorTier" NOT NULL,
    "activeReferrals" INTEGER NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardAmbassador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_signature_key" ON "Transaction"("signature");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRewards_userId_key" ON "PlayerRewards"("userId");

-- CreateIndex
CREATE INDEX "LeaderboardPlayer_snapshotDate_idx" ON "LeaderboardPlayer"("snapshotDate");

-- CreateIndex
CREATE INDEX "LeaderboardPlayer_position_idx" ON "LeaderboardPlayer"("position");

-- CreateIndex
CREATE INDEX "LeaderboardAmbassador_snapshotDate_idx" ON "LeaderboardAmbassador"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeProgress_userId_date_key" ON "DailyChallengeProgress"("userId", "date");

-- CreateIndex
CREATE INDEX "GameSession_winnerId_idx" ON "GameSession"("winnerId");

-- CreateIndex
CREATE INDEX "GameSession_loserId_idx" ON "GameSession"("loserId");

-- CreateIndex
CREATE INDEX "GameSession_snapshotDate_idx" ON "GameSession"("snapshotDate");

-- CreateIndex
CREATE INDEX "Referral_ambassadorId_idx" ON "Referral"("ambassadorId");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "WeeklyStreak_userId_idx" ON "WeeklyStreak"("userId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRewards" ADD CONSTRAINT "PlayerRewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardPlayer" ADD CONSTRAINT "LeaderboardPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "AmbassadorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

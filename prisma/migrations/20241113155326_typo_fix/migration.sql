/*
  Warnings:

  - You are about to drop the column `credit` on the `UserBalance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserBalance" DROP COLUMN "credit",
ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0;

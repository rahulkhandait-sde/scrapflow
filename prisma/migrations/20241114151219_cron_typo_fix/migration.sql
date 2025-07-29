/*
  Warnings:

  - You are about to drop the column `corn` on the `Workflow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Workflow" DROP COLUMN "corn",
ADD COLUMN     "cron" TEXT;

/*
  Warnings:

  - You are about to drop the column `date` on the `purchased_event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."purchased_event" DROP COLUMN "date",
ADD COLUMN     "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

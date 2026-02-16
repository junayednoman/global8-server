/*
  Warnings:

  - You are about to drop the column `videos` on the `event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."event" DROP COLUMN "videos",
ADD COLUMN     "video" TEXT;

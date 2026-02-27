/*
  Warnings:

  - You are about to drop the column `isPackage` on the `class` table. All the data in the column will be lost.
  - You are about to drop the column `packageInterval` on the `class` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."class" DROP COLUMN "isPackage",
DROP COLUMN "packageInterval";
